import { useState, useEffect, useRef } from 'react';

/**
 * useInactivityHide – показывает флаг `visible` и автоматически прячет его
 * через delay мс невидимости мыши. Навешивает `mousemove` на containerRef.
 */
export const useInactivityHide = (
  containerRef: React.RefObject<HTMLElement | null>,
  delay = 2000,
) => {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const show = () => {
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), delay);
    };

    show();
    container.addEventListener('mousemove', show);
    return () => {
      container.removeEventListener('mousemove', show);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [containerRef, delay]);

  return visible;
}; 