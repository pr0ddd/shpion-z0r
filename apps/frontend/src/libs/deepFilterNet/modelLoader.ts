// DeepFilterNet Model Loader
// Загружает и кеширует модель для использования в WASM

interface ModelCache {
  [modelName: string]: Uint8Array;
}

class DeepFilterModelLoader {
  private static instance: DeepFilterModelLoader;
  private modelCache: ModelCache = {};
  private loadingPromises: Map<string, Promise<Uint8Array>> = new Map();

  static getInstance(): DeepFilterModelLoader {
    if (!DeepFilterModelLoader.instance) {
      DeepFilterModelLoader.instance = new DeepFilterModelLoader();
    }
    return DeepFilterModelLoader.instance;
  }

  /**
   * Загружает модель DeepFilterNet
   * @param modelName - имя модели (DeepFilterNet3, DeepFilterNet2, etc.)
   * @returns Promise с байтами модели
   */
  async loadModel(modelName: string = 'DeepFilterNet3'): Promise<Uint8Array> {
    // Проверяем кеш
    if (this.modelCache[modelName]) {
      console.log(`🎤 DeepFilter: Модель ${modelName} загружена из кеша`);
      return this.modelCache[modelName];
    }

    // Проверяем, не загружается ли уже
    if (this.loadingPromises.has(modelName)) {
      console.log(`🎤 DeepFilter: Ожидание загрузки модели ${modelName}...`);
      return this.loadingPromises.get(modelName)!;
    }

    // Начинаем загрузку
    const loadingPromise = (async () => {
      const bytes = await this.fetchModel(modelName);
      return bytes;
    })();
    this.loadingPromises.set(modelName, loadingPromise);

    try {
      const modelBytes = await loadingPromise;
      this.modelCache[modelName] = modelBytes;
      this.loadingPromises.delete(modelName);
      console.log(`🎤 DeepFilter: Модель ${modelName} успешно загружена (${modelBytes.length} байт)`);
      return modelBytes;
    } catch (error) {
      this.loadingPromises.delete(modelName);
      throw error;
    }
  }

  // Загружаем строго один архив; без GitHub-fallback и перебора путей.
  private async fetchModel(modelName: string): Promise<Uint8Array> {
    const path = `/models/DeepFilterNet3_ll_onnx.tar.gz`;
    console.log(`🎤 DF-DEBUG: загружаем модель по пути ${path}`);

    const resp = await fetch(path);
    if (!resp.ok) {
      throw new Error(`Cannot fetch model: HTTP ${resp.status}`);
    }

    const ab = await resp.arrayBuffer();
    const bytes = new Uint8Array(ab);
    console.log('🎤 DF-DEBUG: загружено', bytes.length, 'байт');

    // Если файл уже gzip – ок.
    if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
      return bytes;
    }

    // В противном случае считаем, что сервер разжал архив и теперь это plain TAR.
    console.warn('🎤 DF-DEBUG: получен TAR вместо TAR.GZ – повторно сжимаем в браузере');
    const { gzipSync } = await import('fflate');
    const gzipped = gzipSync(bytes);
    console.log('🎤 DF-DEBUG: повторное сжатие завершено, new size =', gzipped.length, 'байт');
    return gzipped;
  }

  private async gunzip(gzBytes: Uint8Array): Promise<Uint8Array> {
    // Используем DecompressionStream если есть
    if (typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('gzip');
      const resp = new Response(new Blob([gzBytes]).stream().pipeThrough(ds));
      const ab = await resp.arrayBuffer();
      return new Uint8Array(ab);
    }

    // Fallback: динамически импортируем fflate (есть в package.json)
    const { gunzipSync } = await import('fflate');
    return gunzipSync(gzBytes);
  }

  /**
   * Очищает кеш моделей (полезно для освобождения памяти)
   */
  clearCache(): void {
    this.modelCache = {};
    console.log('🎤 DeepFilter: Кеш моделей очищен');
  }

  /**
   * Получает информацию о загруженных моделях
   */
  getCacheInfo(): { [modelName: string]: number } {
    const info: { [modelName: string]: number } = {};
    for (const [name, bytes] of Object.entries(this.modelCache)) {
      info[name] = bytes.length;
    }
    return info;
  }

  /**
   * Предзагрузка модели (для улучшения UX)
   */
  async preloadModel(modelName: string = 'DeepFilterNet3'): Promise<void> {
    try {
      await this.loadModel(modelName);
    } catch (error) {
      console.warn(`🎤 DeepFilter: Предзагрузка модели ${modelName} не удалась:`, error);
    }
  }
}

// Экспортируем singleton instance
export const modelLoader = DeepFilterModelLoader.getInstance();

// Вспомогательная функция для быстрого доступа
export async function loadDeepFilterModel(modelName?: string): Promise<Uint8Array> {
  return modelLoader.loadModel(modelName);
} 