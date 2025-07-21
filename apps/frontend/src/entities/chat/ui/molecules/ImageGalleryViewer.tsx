import React, { useEffect, useRef } from 'react';
import { Dialog, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useGalleryStore } from '../../model/imageGallery.store';

export const ImageGalleryViewer: React.FC = () => {
  const { isOpen, images, index, close, next, prev } = useGalleryStore();
  const current = index !== null ? images[index] : null;

  const atFirst = index === 0;
  const atLast = index === images.length - 1;

  // keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, close, next, prev]);

  const lastWheel = useRef(0);

  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheel.current < 10) return; // throttle ~0.01s
    if (Math.abs(e.deltaY) < 24) return; // ignore tiny trackpad moves
    lastWheel.current = now;
    if (e.deltaY > 0) next(); else prev();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={close}
      fullScreen
      onWheel={handleWheel}
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.48)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      {isOpen && (
        <>
          {/* Prev */}
          {images.length > 1 && (
            <IconButton
              onClick={prev}
              disabled={atFirst}
              sx={{ position: 'fixed', left: 16, color: 'white', opacity: atFirst ? 0.6 : 1 }}
            >
              <ArrowBackIosNewIcon />
            </IconButton>
          )}

          {/* Next */}
          {images.length > 1 && (
            <IconButton
              onClick={next}
              disabled={atLast}
              sx={{ position: 'fixed', right: 16, color: 'white', opacity: atLast ? 0.3 : 1 }}
            >
              <ArrowForwardIosIcon />
            </IconButton>
          )}

          {/* Close */}
          <IconButton
            onClick={close}
            sx={{ position: 'fixed', top: 16, right: 16, color: 'white' }}
          >
            <CloseIcon />
          </IconButton>

          {/* Image */}
          <Box
            component="img"
            src={current || undefined}
            alt="preview"
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        </>
      )}
    </Dialog>
  );
}; 