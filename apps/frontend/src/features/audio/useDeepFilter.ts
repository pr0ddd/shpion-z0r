import { useEffect, useState, useCallback, useRef } from 'react';
import { loadDeepFilterModel } from './modelLoader';

export interface DeepFilterOptions {
  enabled: boolean;
  attenLim?: number;      // Лимит ослабления в дБ (10-200)
  postFilterBeta?: number; // Пост-фильтр (0-0.1)
}

export interface DeepFilterState {
  processor: AudioWorkletNode | null;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  stats: {
    framesProcessed: number;
    lastSnr?: number;
  };
}

/**
 * React хук для управления DeepFilterNet аудиопроцессором
 * Интегрируется с LiveKit AudioCaptureOptions.processor
 */
export const useDeepFilter = (options: DeepFilterOptions): DeepFilterState => {
  const [state, setState] = useState<DeepFilterState>({
    processor: null,
    isLoading: false,
    isReady: false,
    error: null,
    stats: { framesProcessed: 0 }
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Инициализация DeepFilter
  const initializeDeepFilter = useCallback(async () => {
    if (!options.enabled) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Создаем или получаем AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const audioContext = audioContextRef.current;
      
      // Проверяем, что контекст не suspended
      if (audioContext.state === 'suspended') {
        try {
          await audioContext.resume();
        } catch (e) {
          // Браузер не разрешил запуск аудио без жеста пользователя.
          // Дождёмся первого клика/нажатия клавиши и повторим resume.
          console.warn('🎤 DeepFilter: AudioContext resume отложен до жеста пользователя');

          await new Promise<void>((resolve) => {
            const unlock = async () => {
              try {
                await audioContext.resume();
                document.removeEventListener('pointerdown', unlock);
                document.removeEventListener('keydown', unlock);
                resolve();
              } catch {}
            };
            document.addEventListener('pointerdown', unlock, { once: true });
            document.addEventListener('keydown', unlock, { once: true });
          });
        }
      }

      // Загружаем AudioWorklet процессор
      await audioContext.audioWorklet.addModule('/deepfilter-processor.js');

      // 🎯 Загружаем модель DeepFilterNet3
      console.log('🎤 DeepFilter: Загружаем модель...');
      const modelBytes = await loadDeepFilterModel('DeepFilterNet3');
      console.log(`🎤 DeepFilter: Модель загружена (${modelBytes.length} байт)`);

      // Создаем AudioWorkletNode
      const processorNode = new AudioWorkletNode(
        audioContext,
        'deepfilter-processor',
        {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          channelCount: 1,
          channelCountMode: 'explicit',
          channelInterpretation: 'speakers',
          processorOptions: {
            attenLim: options.attenLim || 100,
            postFilterBeta: options.postFilterBeta || 0.05,
            modelBytes: modelBytes, // 🎯 Передаем модель в процессор
          }
        }
      );

      // Слушаем сообщения от процессора
      processorNode.port.onmessage = (event) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'stats':
            setState(prev => ({
              ...prev,
              stats: { ...prev.stats, ...data }
            }));
            break;
          case 'error':
            console.error('🎤 DeepFilter Processor Error:', data);
            setState(prev => ({ ...prev, error: data.message }));
            break;
          case 'ready':
            setState(prev => ({ ...prev, isReady: true }));
            break;
        }
      };

      // Cleanup функция
      cleanupRef.current = () => {
        processorNode.disconnect();
        processorNode.port.close();
      };

      setState(prev => ({
        ...prev,
        processor: processorNode,
        isLoading: false,
        isReady: true,
        error: null
      }));

      console.log('🎤 DeepFilter: Успешно инициализирован');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('🎤 DeepFilter: Ошибка инициализации:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isReady: false,
        error: errorMessage
      }));
    }
  }, [options.enabled, options.attenLim, options.postFilterBeta]);

  // Очистка ресурсов
  const cleanup = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    setState({
      processor: null,
      isLoading: false,
      isReady: false,
      error: null,
      stats: { framesProcessed: 0 }
    });
  }, []);

  // Эффект для инициализации/очистки
  useEffect(() => {
    if (options.enabled) {
      initializeDeepFilter();
    } else {
      cleanup();
    }

    return cleanup;
  }, [options.enabled, initializeDeepFilter, cleanup]);

  // Обновление параметров процессора
  useEffect(() => {
    if (state.processor && state.isReady) {
      const { attenLim = 100, postFilterBeta = 0.05 } = options;
      
      // Отправляем новые параметры процессору
      state.processor.port.postMessage({
        type: 'updateParams',
        data: { attenLim, postFilterBeta }
      });
    }
  }, [state.processor, state.isReady, options.attenLim, options.postFilterBeta]);

  // Методы управления
  const setAttenuation = useCallback((attenLim: number) => {
    if (state.processor && state.isReady) {
      state.processor.port.postMessage({
        type: 'setAttenuation',
        data: { attenLim }
      });
    }
  }, [state.processor, state.isReady]);

  const setPostFilter = useCallback((beta: number) => {
    if (state.processor && state.isReady) {
      state.processor.port.postMessage({
        type: 'setPostFilter',
        data: { beta }
      });
    }
  }, [state.processor, state.isReady]);

  return {
    ...state,
    setAttenuation,
    setPostFilter,
  } as DeepFilterState & {
    setAttenuation: (attenLim: number) => void;
    setPostFilter: (beta: number) => void;
  };
}; 