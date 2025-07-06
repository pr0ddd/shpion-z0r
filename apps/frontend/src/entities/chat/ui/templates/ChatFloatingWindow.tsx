import React from 'react';
import ReactDOM from 'react-dom';
import { Box, Typography, Popover, Slider } from '@mui/material';
import { ChatMessages, useChatWindowStore } from '@entities/chat';
import { IconButton } from '@ui/atoms/IconButton';
import { Close, Settings } from '@mui/icons-material';

export const ChatFloatingWindow: React.FC = () => {
  const isOpen = useChatWindowStore((s) => s.isOpen);
  const close = useChatWindowStore((s) => s.close);

  const pos = useChatWindowStore((s) => s.pos);
  const size = useChatWindowStore((s) => s.size);
  const setPos = useChatWindowStore((s) => s.setPos);
  const setSize = useChatWindowStore((s) => s.setSize);
  const opacity = useChatWindowStore((s) => s.opacity);
  const setOpacity = useChatWindowStore((s) => s.setOpacity);

  const draggingRef = React.useRef(false);
  const offsetRef = React.useRef({ x: 0, y: 0 });

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    draggingRef.current = true;
    offsetRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!draggingRef.current) return;
    setPos({ x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y });
  };

  const onMouseUp = () => {
    draggingRef.current = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  // --- Resize (any edge) ---
  type ResizeInfo = {
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startPosX: number;
    startPosY: number;
    dirX: -1 | 0 | 1; // -1 = left, 1 = right
    dirY: -1 | 0 | 1; // -1 = top, 1 = bottom
  };

  const resizingRef = React.useRef(false);
  const resizeInfoRef = React.useRef<ResizeInfo | null>(null);

  const beginResize = (dirX: -1 | 0 | 1, dirY: -1 | 0 | 1) => (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    resizingRef.current = true;
    resizeInfoRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
      startPosX: pos.x,
      startPosY: pos.y,
      dirX,
      dirY,
    };
    document.addEventListener('mousemove', onResizeMouseMove);
    document.addEventListener('mouseup', onResizeMouseUp);
  };

  const onResizeMouseMove = (e: MouseEvent) => {
    if (!resizingRef.current || !resizeInfoRef.current) return;
    const {
      startX,
      startY,
      startWidth,
      startHeight,
      startPosX,
      startPosY,
      dirX,
      dirY,
    } = resizeInfoRef.current;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newWidth = startWidth;
    let newHeight = startHeight;
    let newPosX = startPosX;
    let newPosY = startPosY;

    if (dirX === 1) {
      // right edge
      newWidth = Math.max(300, startWidth + dx);
    } else if (dirX === -1) {
      // left edge
      newWidth = Math.max(300, startWidth - dx);
      newPosX = startPosX + dx;
    }

    if (dirY === 1) {
      // bottom edge
      newHeight = Math.max(300, startHeight + dy);
    } else if (dirY === -1) {
      // top edge
      newHeight = Math.max(300, startHeight - dy);
      newPosY = startPosY + dy;
    }

    setSize({ width: newWidth, height: newHeight });
    setPos({ x: newPosX, y: newPosY });
  };

  const onResizeMouseUp = () => {
    resizingRef.current = false;
    resizeInfoRef.current = null;
    document.removeEventListener('mousemove', onResizeMouseMove);
    document.removeEventListener('mouseup', onResizeMouseUp);
  };

  const [settingsAnchor, setSettingsAnchor] = React.useState<null | HTMLElement>(null);
  const openSettings = (e: React.MouseEvent<HTMLElement>) => setSettingsAnchor(e.currentTarget);
  const closeSettings = () => setSettingsAnchor(null);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <Box
      sx={{
        position: 'fixed',
        top: pos.y,
        left: pos.x,
        width: size.width,
        height: size.height,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        backgroundColor: 'new.card',
        border: '1px solid',
        borderColor: 'new.border',
        zIndex: 1300,
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        opacity,
      }}
    >
      <Box
        onMouseDown={onMouseDown}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'move',
          p: 1,
          backgroundColor: 'new.sidebarAccent',
          borderBottom: '1px solid',
          borderColor: 'new.border',
        }}
      >
        <Typography variant="h4" color="new.foreground">
          Chat
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            icon={<Settings sx={{ fontSize: 18 }} />}
            hasBorder={false}
            color="default"
            onClick={openSettings}
          />
          <IconButton
            icon={<Close sx={{ fontSize: 18 }} />}
            hasBorder={false}
            color="default"
            onClick={close}
          />
        </Box>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <ChatMessages />
      </Box>

      {/* Invisible resize edges */}
      {/* Top */}
      <Box
        onMouseDown={beginResize(0, -1)}
        sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize' }}
      />
      {/* Right */}
      <Box
        onMouseDown={beginResize(1, 0)}
        sx={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 6, cursor: 'ew-resize' }}
      />
      {/* Bottom */}
      <Box
        onMouseDown={beginResize(0, 1)}
        sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize' }}
      />
      {/* Left */}
      <Box
        onMouseDown={beginResize(-1, 0)}
        sx={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 6, cursor: 'ew-resize' }}
      />

      {/* Settings popover */}
      <Popover
        open={Boolean(settingsAnchor)}
        anchorEl={settingsAnchor}
        onClose={closeSettings}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, width: 180 }}>
          <Typography variant="body2" color="new.foreground" sx={{ mb: 1 }}>
            Прозрачность
          </Typography>
          <Slider
            value={opacity}
            onChange={(_, val) => setOpacity(Array.isArray(val) ? val[0] : (val as number))}
            min={0.2}
            max={1}
            step={0.05}
          />
        </Box>
      </Popover>
    </Box>,
    document.body,
  );
}; 