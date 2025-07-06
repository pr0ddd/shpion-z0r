class MyProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.initOptions = options.processorOptions;
    this.attenLim = this.initOptions.attenLim || 100;
    this.postFilterBeta = this.initOptions.postFilterBeta || 0.05;
    this.dfJsCode = this.initOptions.dfJsCode || null;
    this.wasmBytes = this.initOptions.wasmBytes || null;
    this.modelBytes = this.initOptions.modelBytes || null;

    this.wasm = null;
    this.dfState = null;
    this.frameLength = 0;
    this.isInitialized = false;

    // this.initializeDeepFilter();
  }

  async initializeDeepFilter() {
    try {
      if (this.dfJsCode) {
        const patched = `${this.dfJsCode}\nglobalThis.wasm_bindgen = wasm_bindgen;`;
        // eslint-disable-next-line no-eval
        (0, eval)(patched);
      }

      if (typeof globalThis.wasm_bindgen !== 'function') {
        throw new Error('wasm_bindgen is not available after evaluating df.js');
      }

      if (this.wasmBytes && this.wasmBytes.length) {
        try {
          await globalThis.wasm_bindgen(this.wasmBytes);
        this.wasm = globalThis.wasm_bindgen; // Экспортируемые функции доступны прямо в wasm_bindgen

        } catch (error) {
          console.error('🎤 DeepFilterNet: Ошибка инициализации:', error);
        }
      }

      // 3. Создаём состояние DeepFilterNet.
      try {
        this.dfState = this.wasm.df_create(this.modelBytes, this.attenLim);
      } catch (error) {
        console.log(error)
      }


      this.framesProcessed = 0;
      this.isInitialized = true;

      // Сообщаем в основной поток об успехе.
      this.port.postMessage({ type: 'ready' });
    } catch (error) {
      console.error('🎤 DeepFilterNet: Ошибка инициализации:', error);
      this.isInitialized = false;
      this.port.postMessage({
        type: 'error',
        data: { message: error?.message || String(error) },
      });
    }
  }

  process(inputs, outputs) {
    const input = inputs[0]; // Float32Array[128]
    const output = outputs[0]; // Float32Array[128]

    // Пример: копируем вход на выход (без изменений)
    for (let channel = 0; channel < input.length; ++channel) {
      output[channel].set(input[channel]);
    }

    // Возвращаем true чтобы продолжать работу
    return true;
  }
}

registerProcessor('my-processor', MyProcessor);
