// DeepFilterNet Model Loader
// Загружает модель для использования в WASM без постоянного кеша

class DeepFilterModelLoader {
  private static instance: DeepFilterModelLoader;
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
    // Если уже есть активная загрузка этой модели — дождёмся её, чтобы не
    // создавать несколько параллельных запросов.
    if (this.loadingPromises.has(modelName)) {
      console.log(`🎤 DeepFilter: Ожидание завершения загрузки модели ${modelName}...`);
      return this.loadingPromises.get(modelName)!;
    }

    // Запускаем загрузку
    const loadingPromise = this.fetchModel(modelName)
      .finally(() => this.loadingPromises.delete(modelName));

    this.loadingPromises.set(modelName, loadingPromise);
    return loadingPromise;
  }

  // Загружаем строго один архив; без GitHub-fallback и перебора путей.
  private async fetchModel(modelName: string): Promise<Uint8Array> {
    const path = `/models/${modelName}_onnx.tar.gz`;
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

  /**
   * Предзагрузка модели (для улучшения UX). Сейчас это просто «тёплый»
   * вызов loadModel(), который отработает мгновенно, если модель уже
   * загружается.
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