// DeepFilterNet AudioWorkletProcessor
// Работает в AudioWorkletGlobalScope (отдельный поток)
class DeepFilterProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    this.isInitialized = false;
    this.wasm = null;
    this.dfState = null;
    this.frameLength = 0;

    /**
     * Буферы для аккумулирования входящих сэмплов и выдачи обработанных.
     * Используем обычные JS-массивы, т.к. они просты в использовании и достаточно быстры
     * при небольших размерах (audio frame ≤ 512).
     */
    this.inputBuffer = [];
    this.outputBuffer = [];

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

    // 1. Копируем входные сэмплы в накопительный буфер.
    for (let i = 0; i < inCh.length; i++) this.inputBuffer.push(inCh[i]);

    // 2. Пока в буфере достаточно данных, обрабатываем кадр.
    while (this.inputBuffer.length >= this.frameLength) {
      const frame = this.inputBuffer.splice(0, this.frameLength);
      const processed = this.wasm.df_process_frame(this.dfState, new Float32Array(frame));
      this.outputBuffer.push(...processed);
      this.framesProcessed++;
    }

    // 3. Записываем доступные обработанные сэмплы в выходной буфер. Если их меньше –
    //    дополняем нехватающие оригинальными данными, чтобы сохранить синхронизацию.
    for (let i = 0; i < outCh.length; i++) {
      outCh[i] = this.outputBuffer.length ? this.outputBuffer.shift() : inCh[i];
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