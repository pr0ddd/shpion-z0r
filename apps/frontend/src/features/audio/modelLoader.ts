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
    const loadingPromise = this.fetchModel(modelName);
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

  private async fetchModel(modelName: string): Promise<Uint8Array> {
    const modelPaths = [
      `/models/DeepFilterNet3_onnx.tar.gz`,   // 🎯 Файл пользователя (приоритет)
      `/models/${modelName}_onnx.tar.gz`,     // ONNX версия
      `/models/${modelName}.tar.gz`,           // Локальная модель
      `/models/deepfilter3.tar.gz`,            // Альтернативное имя
      `/models/default.tar.gz`,                // Дефолтная модель
    ];

    let lastError: Error | null = null;

    // Пробуем загрузить из разных путей
    for (const path of modelPaths) {
      try {
        console.log(`🎤 DeepFilter: Попытка загрузки модели из ${path}`);
        const response = await fetch(path);
        
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          return new Uint8Array(arrayBuffer);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`🎤 DeepFilter: Не удалось загрузить из ${path}:`, lastError.message);
      }
    }

    // Если все пути не сработали, пытаемся загрузить с GitHub
    try {
      console.log(`🎤 DeepFilter: Попытка загрузки с GitHub...`);
      const githubUrl = `https://github.com/Rikorose/DeepFilterNet/releases/download/v0.5.6/${modelName}.tar.gz`;
      const response = await fetch(githubUrl);
      
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        console.log(`🎤 DeepFilter: Модель загружена с GitHub (${arrayBuffer.byteLength} байт)`);
        return new Uint8Array(arrayBuffer);
      }
    } catch (error) {
      console.warn(`🎤 DeepFilter: Не удалось загрузить с GitHub:`, error);
    }

    // Если ничего не сработало, возвращаем пустую модель (fallback)
    console.warn(`🎤 DeepFilter: Все попытки загрузки модели провалились, используем fallback`);
    return new Uint8Array(0); // Пустая модель - процессор будет работать в passthrough режиме
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