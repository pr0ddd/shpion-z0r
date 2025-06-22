import { useState, useEffect } from 'react';

/**
 * usePictureInPicture – следит за входом/выходом из PiP.
 * Просто выдаёт булев флаг isPip.
 */
export const usePictureInPicture = () => {
  const [isPip, setIsPip] = useState(false);

  useEffect(() => {
    const onChange = () => setIsPip(Boolean(document.pictureInPictureElement));
    document.addEventListener('enterpictureinpicture', onChange);
    document.addEventListener('leavepictureinpicture', onChange);
    return () => {
      document.removeEventListener('enterpictureinpicture', onChange);
      document.removeEventListener('leavepictureinpicture', onChange);
    };
  }, []);

  return isPip;
}; 