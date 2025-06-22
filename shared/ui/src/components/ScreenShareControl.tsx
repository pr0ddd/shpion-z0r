import React, { useState } from 'react';
import { IconButton, Tooltip, Menu, MenuItem, Badge } from '@mui/material';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import { useScreenShare } from '@shared/livekit';

/**
 * Кнопка управления трансляциями экрана.
 * Открывает меню, где можно запустить до трёх экранов и остановить каждый отдельно.
 */
export const ScreenShareControl: React.FC = () => {
  const { shares, count, startNew, stopShare, stopAll } = useScreenShare();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleButtonClick = (e: React.MouseEvent<HTMLElement>) => {
    if (count === 0) {
      startNew();
    } else {
      setAnchorEl(e.currentTarget);
    }
  };

  const closeMenu = () => setAnchorEl(null);

  const handleStart = () => {
    startNew();
    closeMenu();
  };

  const handleStopAll = () => {
    stopAll();
    closeMenu();
  };

  return (
    <>
      <Tooltip title={count > 0 ? 'Управление трансляциями экрана' : 'Поделиться экраном'} placement="top" arrow>
        <IconButton onClick={handleButtonClick} size="small" sx={{ color: count > 0 ? '#4caf50' : 'white' }}>
          <Badge color="secondary" badgeContent={count > 0 ? count : undefined} overlap="circular">
            {count > 0 ? <StopScreenShareIcon /> : <ScreenShareIcon />}
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {count < 3 && <MenuItem onClick={handleStart}>Поделиться ещё экраном</MenuItem>}
        {shares.map((idx) => (
          <MenuItem key={idx} onClick={() => { stopShare(idx); closeMenu(); }}>
            Остановить экран {idx + 1}
          </MenuItem>
        ))}
        {count > 1 && <MenuItem onClick={handleStopAll}>Остановить все</MenuItem>}
      </Menu>
    </>
  );
}; 