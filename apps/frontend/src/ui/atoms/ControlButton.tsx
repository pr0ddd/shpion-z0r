import React from 'react';
import { IconButton, IconButtonProps } from '@mui/material';

export interface ControlButtonProps extends IconButtonProps {
  /** Background color for normal state */
  bgColor?: string;
  /** Background color for hover state */
  hoverBgColor?: string;
}

/**
 * ControlButton – base styles for media control buttons (Mic, Volume, ScreenShare, Camera, etc.)
 * Ensures consistent sizing (flex:1, 32px height) and unified hover behavior (white icon on hover).
 */
export const ControlButton: React.FC<ControlButtonProps> = ({ bgColor = 'new.muted', hoverBgColor = 'new.hover', sx, ...rest }) => {
  const color = bgColor === 'new.muted' ? 'new.mutedForeground' : 'new.primaryForeground';

  return (
    <IconButton
      {...rest}
      sx={{
        flex: 1,
        minWidth: 60,
        height: 32,
        maxHeight: 32,
        border: '1px solid',
        borderColor: 'new.border',
        borderRadius: 1,
        backgroundColor: bgColor,
        color,
        '&:hover': {
          backgroundColor: hoverBgColor,
          color: 'new.primaryForeground',
        },
        '& .MuiSvgIcon-root': {
          fontSize: '1.2rem',
        },
        ...sx,
      }}
    />
  );
}; 