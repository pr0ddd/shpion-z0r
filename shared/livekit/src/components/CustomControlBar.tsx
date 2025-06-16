import React from 'react';
import { ControlBar, ControlBarProps } from '@livekit/components-react';
import { Box } from '@mui/material';

/**
 * CustomControlBar wraps LiveKit's prefab ControlBar but keeps your dark
 * palette and adds subtle scale on hover for buttons.
 */
export const CustomControlBar: React.FC<Partial<ControlBarProps>> = ({ ...rest }) => {
  return (
    <Box
      sx={{
        '--lk-control-bar-background': '#2f3136',
        '--lk-control-bar-height': '48px',
        '--lk-button-background-hover': '#3b3d44',
        '--lk-color-primary': '#5865F2',
        '.lk-button': {
          transition: 'transform 0.15s ease',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
      }}
    >
      <ControlBar {...rest} />
    </Box>
  );
}; 