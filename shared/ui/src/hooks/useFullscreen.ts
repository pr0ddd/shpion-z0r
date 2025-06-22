import { useState, useCallback, useEffect } from 'react';

/**
 * useFullscreen – отслеживает состояние Fullscreen API для переданного элемента
 * Возвращает текущий флаг полноэкрана и функцию toggle().
 */
export const useFullscreen = (elementRef: React.RefObject<HTMLElement | null>) => {
  const [isFs, setFs] = useState(false);

  const toggle = useCallback(() => {
    const el = elementRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setFs(true));
    } else {
      document.exitFullscreen?.().then(() => setFs(false));
    }
  }, [elementRef]);

  useEffect(() => {
    const handler = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return { isFs, toggle } as const;
}; 