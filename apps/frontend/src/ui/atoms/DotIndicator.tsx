import React from 'react';
import { Box } from '@mui/material';
import { SxProps, Theme } from '@mui/system';

export interface DotIndicatorProps {
  /** Diameter of the dot in pixels */
  size?: number;
  /** Adds white border around the dot – useful when placed over avatars */
  withBorder?: boolean;
  /** Additional MUI sx styles */
  sx?: SxProps<Theme>;
}

/**
 * Animated red pulsing dot used to indicate active streaming / recording states.
 */
export const DotIndicator: React.FC<DotIndicatorProps> = ({ size = 10, withBorder = false, sx }) => (
  <Box
    sx={{
      width: size,
      height: size,
      borderRadius: '50%',
      bgcolor: 'error.main',
      ...(withBorder && {
        border: '2px solid',
        borderColor: 'background.paper',
      }),
      '@keyframes pulse': {
        '0%, 100%': {
          transform: 'scale(1)',
          opacity: 1,
        },
        '50%': {
          transform: 'scale(1.25)',
          opacity: 0.6,
        },
      },
      animation: 'pulse 1.5s ease-in-out infinite',
      ...sx,
    }}
  />
);
