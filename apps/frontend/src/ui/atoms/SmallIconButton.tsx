import React from 'react';
import { IconButton, IconButtonProps } from '@mui/material';

export const SmallIconButton: React.FC<IconButtonProps> = ({ sx, ...rest }) => (
  <IconButton
    size="small"
    sx={{
      width: 32,
      height: 32,
      border: '1px solid',
      borderColor: 'new.border',
      backgroundColor: 'new.muted',
      color: 'new.mutedForeground',
      '&:hover': {
        backgroundColor: 'new.hover',
        color: 'new.primaryForeground',
      },
      ...sx,
    }}
    {...rest}
  />
); 