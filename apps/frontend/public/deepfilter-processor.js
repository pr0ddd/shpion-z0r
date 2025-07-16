// DeepFilterNet AudioWorkletProcessor
// Работает в AudioWorkletGlobalScope (отдельный поток)
class DeepFilterProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    this.isInitialized = false;
    this.wasm = null;
    this.dfState = null;
    this.frameLength = 0;

    // --- буферы будут инициализированы после получения frameLength ---
    this.inBuffer = null;   // Float32Array
    this.inLen = 0;         // сколько сэмплов накоплено

    this.outBuffer = null;  // Float32Array FIFO для обработанных кадров
    this.outLen = 0;        // сколько сэмплов готово к выдаче

    // --- debug stats ---
    this._dbgFrames = 0;
    this._dbgUnderruns = 0;
    this._dbgLongProc = 0;

    // --- smoothing state ---
    this.prevTail = 0; // последний сэмпл предыдущего кадра
    this.clicks = 0;   // счётчик резких стыков

    // Параметры, переданные из основного потока
    this.initOptions = options.processorOptions || {};

    // DeepFilterNet настройки
    this.attenLim = this.initOptions.attenLim || 100; // максимальное ослабление шума, дБ
    this.postFilterBeta = this.initOptions.postFilterBeta || 0.05;

    // Код glue df.js и бинарник передаются с главного потока, чтобы обойти отсутствие fetch
    this.dfJsCode = this.initOptions.dfJsCode || null;
    this.wasmBytes = this.initOptions.wasmBytes || null;

    // Модель DeepFilterNet передаётся байтами (Uint8Array)
    this.modelBytes = this.initOptions.modelBytes || null;

    // Слушаем команды от главного потока (из React-приложения)
    this.port.onmessage = this.handleMessage.bind(this);

    // Запускаем асинхронную инициализацию WASM
    this.initializeDeepFilter();

    console.log('🎤 DeepFilterProcessor: Создан');
  }

  /**
   * Загружает wasm-модуль и инициализирует DeepFilterNet.
   * После успеха переключает процессор из passthrough-режима в режим шумоподавления.
   */
  async initializeDeepFilter() {
    try {
      if (!this.modelBytes || this.modelBytes.length === 0) {
        throw new Error('Model bytes not provided – DeepFilter работает в passthrough режиме');
      }

      // 1. Загружаем glue-код df.js. fetch недоступен внутри AudioWorklet, поэтому
      //    ожидаем, что dfJsCode был передан из главного потока (processorOptions.dfJsCode).
      if (this.dfJsCode) {
        // Вставляем хвост, который пробрасывает wasm_bindgen в глобальную область,
        // чтобы он был доступен за пределами eval-модуля.
        const patched = `${this.dfJsCode}\nglobalThis.wasm_bindgen = wasm_bindgen;`;
        // eslint-disable-next-line no-eval
        (0, eval)(patched);
      } else if (typeof fetch !== 'undefined') {
        // На всякий случай fallback, если fetch существует (например Chrome 123+)
        const resp = await fetch('/wasm/df.js');
        if (!resp.ok) throw new Error(`Cannot load df.js (${resp.status})`);
        const code = await resp.text();
        // eslint-disable-next-line no-eval
        (0, eval)(`${code}\nglobalThis.wasm_bindgen = wasm_bindgen;`);
      } else {
        throw new Error('df.js code not provided and fetch is unavailable in AudioWorklet');
      }

      if (typeof globalThis.wasm_bindgen !== 'function') {
        throw new Error('wasm_bindgen is not available after evaluating df.js');
      }

      console.log('🎤 DF-DEBUG: wasm_bindgen available:', typeof globalThis.wasm_bindgen);

      // 2. Инициализируем wasm, передав путь до бинарника.
      //    wasm_bindgen возвращает объект экспорта после полной готовности.
      if (this.wasmBytes && this.wasmBytes.length) {
        console.log('🎤 DF-DEBUG: инициализируем wasm из байтов, size =', this.wasmBytes.length);
        await globalThis.wasm_bindgen(this.wasmBytes);
      } else {
        console.log('🎤 DF-DEBUG: инициализируем wasm из /wasm/df_bg.wasm');
        await globalThis.wasm_bindgen('/wasm/df_bg.wasm');
      }
      this.wasm = globalThis.wasm_bindgen; // Экспортируемые функции доступны прямо в wasm_bindgen

      console.log('🎤 DF-DEBUG: wasm init done, attempting df_create. Model bytes =', this.modelBytes?.length);
      if (this.modelBytes && this.modelBytes.length) {
        const header = Array.from(this.modelBytes.slice(0, 4)).map(b=>b.toString(16).padStart(2,'0')).join(' ');
        console.log('🎤 DF-DEBUG: model header (first 4 bytes):', header);
      }

      // 3. Создаём состояние DeepFilterNet.
      this.dfState = this.wasm.df_create(this.modelBytes, this.attenLim);
      this.frameLength = this.wasm.df_get_frame_length(this.dfState);

      // Инициализируем кольцевые буферы (достаточно запаса на 8 кадров)
      const CAP_FRAMES = 8;
      this.inBuffer = new Float32Array(this.frameLength * CAP_FRAMES);
      this.inLen = 0;

      this.outBuffer = new Float32Array(this.frameLength * CAP_FRAMES);
      this.outLen = 0;

      this.wasm.df_set_post_filter_beta(this.dfState, this.postFilterBeta);

      this.framesProcessed = 0;
      this.isInitialized = true;

      console.log('🎤 DeepFilterProcessor: Инициализация завершена, frameLength =', this.frameLength);

      // Сообщаем в основной поток об успехе.
      this.port.postMessage({ type: 'ready' });

    } catch (error) {
      console.error('🎤 DeepFilterNet: Ошибка инициализации:', error);
      this.isInitialized = false;
      this.port.postMessage({ type: 'error', data: { message: error?.message || String(error) } });
    }
  }

  process(inputs, outputs, parameters) {
    const t0 = currentTime; // AudioWorklet global timeline (seconds)

    const input = inputs[0];
    const output = outputs[0];

    // Если DeepFilterNet ещё не готов – просто копируем данные (passthrough)
    if (!this.isInitialized || !this.dfState) {
      for (let channel = 0; channel < Math.min(input.length, output.length); channel++) {
        const inputChannel = input[channel];
        const outputChannel = output[channel];
        for (let i = 0; i < inputChannel.length; i++) {
          outputChannel[i] = inputChannel[i];
        }
      }
      return true;
    }

    // Пока обработаем только mono-канал (channel 0). Остальные копируем как есть.
    const inCh = input[0] || new Float32Array(0);
    const outCh = output[0] || new Float32Array(0);

    // 1. Пишем входные данные в inBuffer, расширяем при необходимости
    if (this.inLen + inCh.length > this.inBuffer.length) {
      const newBuf = new Float32Array((this.inBuffer.length + inCh.length) * 2);
      newBuf.set(this.inBuffer.subarray(0, this.inLen));
      this.inBuffer = newBuf;
    }
    this.inBuffer.set(inCh, this.inLen);
    this.inLen += inCh.length;

    // 2. Пока накоплен целый кадр – обрабатываем
    while (this.inLen >= this.frameLength) {
      const frameView = this.inBuffer.subarray(0, this.frameLength);
      // Копируем кадр, чтобы WASM не держал ссылку на буфер, который мы сместим ниже
      const frame = new Float32Array(frameView);
      const processed = this.wasm.df_process_frame(this.dfState, frame);

      // положим результат в outBuffer с нормализацией, чтобы избежать
      // NaN / Infinity и клиппинга, вызывавшего «хрип» во всём браузере.
      if (this.outLen + processed.length > this.outBuffer.length) {
        const newOut = new Float32Array((this.outBuffer.length + processed.length) * 2);
        newOut.set(this.outBuffer.subarray(0, this.outLen));
        this.outBuffer = newOut;
      }

      // --- адаптивное усиление без клиппинга ---
      let peakIn = 0;
      for (let i = 0; i < processed.length; i++) {
        const a = Math.abs(processed[i]);
        if (a > peakIn) peakIn = a;
      }

      const USER_GAIN = 3;      // базовый уровень громкости, можно вынести в UI
      const TARGET_PEAK = 0.7;  // запас ~3 дБ до клиппинга
      const autoGain = peakIn ? Math.min(USER_GAIN * TARGET_PEAK / peakIn, USER_GAIN) : USER_GAIN;

      let peakOut = 0;

      const FADE = 32; // длина кросс-фейда

      // детектируем резкий стык между кадрами
      if (processed.length) {
        if (Math.abs(processed[0] * autoGain - this.prevTail) > 0.1) this.clicks++;
      }

      for (let i = 0; i < processed.length; i++) {
        let s = processed[i] * autoGain;
        // применяем кросс-фейд в первые FADE сэмплов кадра
        if (i < FADE) {
          const alpha = i / FADE;
          s = (1 - alpha) * this.prevTail + alpha * s;
        }
        this.outBuffer[this.outLen + i] = s;
        const a = Math.abs(s);
        if (a > peakOut) peakOut = a;
      }

      // сохраняем хвост кадра для следующего сглаживания
      this.prevTail = this.outBuffer[this.outLen + processed.length - 1] || this.prevTail;
      this.outLen += processed.length;

      if (this.framesProcessed % 200 === 0) {
        console.log('[DF-AW] gain', autoGain.toFixed(2), 'peak', peakOut.toFixed(3), 'clicks', this.clicks);
        this.clicks = 0;
      }

      // сдвигаем остаток входного буфера в начало
      this.inBuffer.copyWithin(0, this.frameLength, this.inLen);
      this.inLen -= this.frameLength;
      this.framesProcessed++;

      continue; // переходим к следующей итерации while

    }

    // 3. Выдаём столько, сколько нужно в текущем render quantum (outCh.length)
    const needed = outCh.length;
    if (this.outLen >= outCh.length) {
      outCh.set(this.outBuffer.subarray(0, outCh.length));
      this.outBuffer.copyWithin(0, outCh.length, this.outLen);
      this.outLen -= outCh.length;
    } else {
      // не хватает обработанных — underrun
      this._dbgUnderruns++;
      // не хватает обработанных — выдаём что есть + оригинал для синхры
      if (this.outLen > 0) {
        outCh.set(this.outBuffer.subarray(0, this.outLen));
      }
      for (let i = this.outLen; i < outCh.length; i++) outCh[i] = inCh[i - this.outLen] || 0;
      this.outLen = 0;
    }

    // 4. Проброс остальных каналов без изменений.
    for (let channel = 1; channel < Math.min(input.length, output.length); channel++) {
      const src = input[channel];
      const dst = output[channel];
      for (let i = 0; i < src.length; i++) dst[i] = src[i];
    }

    // Отправляем статистику раз в ~0.5 сек (128*43 ≈ 5500 сэмплов при 48kHz).
    if (this.framesProcessed % 43 === 0) {
      this.port.postMessage({
        type: 'stats',
        data: { framesProcessed: this.framesProcessed },
      });
    }

    // --- debug timings ---
    const procTimeMs = (currentTime - t0) * 1000;
    if (procTimeMs > 2.8) this._dbgLongProc++;

    if (++this._dbgFrames % 200 === 0) {
      console.log('[DF-AW] frames', this._dbgFrames, 'underruns', this._dbgUnderruns, 'long>2.8ms', this._dbgLongProc);
      this._dbgUnderruns = 0;
      this._dbgLongProc = 0;
    }

    return true;
  }

  // Обработка сообщений от главного потока
  static get parameterDescriptors() {
    return [
      {
        name: 'enabled',
        defaultValue: 1,
        minValue: 0,
        maxValue: 1,
        automationRate: 'k-rate'
      },
      {
        name: 'attenuation',
        defaultValue: 100,
        minValue: 10,
        maxValue: 200,
        automationRate: 'k-rate'
      }
    ];
  }

  /** Обработка команд от основного потока */
  handleMessage(event) {
    const { type, data } = event.data || {};
    if (!type) return;

    switch (type) {
      case 'updateParams':
        if (data?.attenLim !== undefined) {
          this.attenLim = data.attenLim;
          // В текущей версии DeepFilterNet нет публичной функции для изменения
          // лимита «на лету», поэтому игнорируем.
        }
        if (data?.postFilterBeta !== undefined) {
          this.postFilterBeta = data.postFilterBeta;
          if (this.isInitialized && this.dfState) {
            this.wasm.df_set_post_filter_beta(this.dfState, this.postFilterBeta);
          }
        }
        break;

      case 'setAttenuation':
        if (data?.attenLim !== undefined) {
          this.attenLim = data.attenLim;
          // Нет публичного API для изменения ослабления в рантайме — игнорируем.
        }
        break;

      case 'setPostFilter':
        if (data?.beta !== undefined) {
          this.postFilterBeta = data.beta;
          if (this.isInitialized && this.dfState) {
            this.wasm.df_set_post_filter_beta(this.dfState, this.postFilterBeta);
          }
        }
        break;

      /* Освобождаем память WASM, когда основной поток просит dispose */
      case 'dispose':
        if (this.isInitialized && this.dfState) {
          try {
            if (this.wasm.__wbg_dfstate_free) {
              this.wasm.__wbg_dfstate_free(this.dfState);
            } else if (this.wasm.df_destroy) {
              this.wasm.df_destroy(this.dfState);
            }
          } catch (e) {
            console.warn('DF dispose error', e);
          }
          this.dfState = null;
          this.isInitialized = false;
        }
        break;
    }
  }
}

// Регистрируем процессор
registerProcessor('deepfilter-processor', DeepFilterProcessor); 