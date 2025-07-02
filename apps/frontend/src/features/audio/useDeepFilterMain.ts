import { useEffect, useState, useCallback, useRef } from 'react';
import { loadDeepFilterModel } from './modelLoader';

// Загрузка WASM скрипта через DOM (обход ограничений Vite)
const loadWasmScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Проверяем, не загружен ли уже
    if (typeof (window as any).wasm_bindgen !== 'undefined') {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
};

export interface DeepFilterMainOptions {
  enabled: boolean;
  attenLim?: number;
  postFilterBeta?: number;
}

export interface DeepFilterMainState {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  processor: ((inputBuffer: Float32Array) => Float32Array) | null;
}

/**
 * DeepFilterNet в основном потоке (обходим ограничения AudioWorklet)
 * Работает с MediaStream через Web Audio API
 */
export const useDeepFilterMain = (options: DeepFilterMainOptions): DeepFilterMainState => {
  const [state, setState] = useState<DeepFilterMainState>({
    isReady: false,
    isLoading: false,
    error: null,
    processor: null,
  });

  const wasmRef = useRef<any>(null);
  const dfStateRef = useRef<number | null>(null);

  const initializeWasm = useCallback(async () => {
    if (!options.enabled) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Загружаем WASM модуль в основном потоке
      console.log('🎤 DeepFilter Main: Загружаем WASM...');
      
      // Загружаем WASM скрипт через script tag (обход ограничений Vite)
      await loadWasmScript('/wasm/df.js');
      
      // Проверяем что модуль загружен
      if (typeof (window as any).wasm_bindgen === 'undefined') {
        throw new Error('WASM модуль не загружен');
      }
      
      // Инициализируем WASM
      await (window as any).wasm_bindgen('/wasm/df_bg.wasm');
      wasmRef.current = (window as any).wasm_bindgen;
      
      console.log('🎤 DeepFilter Main: WASM загружен');

      // Загружаем модель
      console.log('🎤 DeepFilter Main: Загружаем модель...');
      const modelBytes = await loadDeepFilterModel('DeepFilterNet3');
      
      if (modelBytes.length === 0) {
        throw new Error('Модель не загружена');
      }

      console.log(`🎤 DeepFilter Main: Модель загружена (${modelBytes.length} байт)`);

      // Создаем состояние DeepFilterNet
      const dfState = wasmRef.current.df_create(modelBytes, options.attenLim || 100);
      dfStateRef.current = dfState;

      const frameLength = wasmRef.current.df_get_frame_length(dfState);
      wasmRef.current.df_set_post_filter_beta(dfState, options.postFilterBeta || 0.05);

      console.log(`🎤 DeepFilter Main: Инициализирован, frame_length=${frameLength}`);

      // Создаем функцию-процессор
      const processor = (inputBuffer: Float32Array): Float32Array => {
        try {
          if (!wasmRef.current || !dfStateRef.current) {
            return inputBuffer; // passthrough
          }

          // Обрабатываем через DeepFilterNet
          const outputBuffer = wasmRef.current.df_process_frame(
            dfStateRef.current,
            inputBuffer
          );

          return outputBuffer || inputBuffer;
        } catch (error) {
          console.error('🎤 DeepFilter Main: Ошибка обработки:', error);
          return inputBuffer; // fallback
        }
      };

      setState({
        isReady: true,
        isLoading: false,
        error: null,
        processor: processor,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('🎤 DeepFilter Main: Ошибка инициализации:', error);
      
      setState({
        isReady: false,
        isLoading: false,
        error: errorMessage,
        processor: null,
      });
    }
  }, [options.enabled, options.attenLim, options.postFilterBeta]);

  const cleanup = useCallback(() => {
    if (dfStateRef.current && wasmRef.current) {
      try {
        wasmRef.current.df_free(dfStateRef.current);
      } catch (error) {
        console.warn('🎤 DeepFilter Main: Ошибка очистки:', error);
      }
    }
    
    wasmRef.current = null;
    dfStateRef.current = null;
    
    setState({
      isReady: false,
      isLoading: false,
      error: null,
      processor: null,
    });
  }, []);

  useEffect(() => {
    if (options.enabled) {
      initializeWasm();
    } else {
      cleanup();
    }

    return cleanup;
  }, [options.enabled, initializeWasm, cleanup]);

  return state;
}; 