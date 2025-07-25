import React from 'react';
import { Box, Menu, Slider } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

interface VolumeMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  volume: number; // internal 0..1
  onVolumeChange: (volume: number) => void;
}

export const VolumeMenu: React.FC<VolumeMenuProps> = ({
  anchorEl,
  open,
  onClose,
  volume,
  onVolumeChange,
}) => {
  const handleSliderChange = (_: unknown, value: number | number[]) => {
    const v = Array.isArray(value) ? value[0] : value;
    onVolumeChange(v / 200);
  };

  return (
    <Menu
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      slotProps={{
        list: { dense: true, sx: { p: 1 } },
        paper: { sx: { borderRadius: 1 } },
      }}
    >
      <Box sx={{ width: 180, p: 1, pt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <VolumeUpIcon fontSize="small" sx={{ color: 'text.secondary', flexShrink: 0 }} />
          <Slider
            value={volume * 200}
            min={0}
            max={200}
            step={5}
            onChange={handleSliderChange}
            aria-labelledby="volume-slider"
            valueLabelDisplay="on"
            valueLabelFormat={(v) => `${Math.round(v)}%`}
            sx={{
              flexGrow: 1,
              '& .MuiSlider-valueLabel': {
                top: -5,
                backgroundColor: 'grey.800',
                color: 'common.white',
                borderRadius: 1,
                px: 0.5,
                py: 0.5,
              },
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
                '&.Mui-active, &.Mui-focusVisible': {
                  boxShadow: 'none',
                },
                '&:hover': {
                  boxShadow: 'none',
                },
              },
            }}
          />
        </Box>
      </Box>
    </Menu>
  );
}; 