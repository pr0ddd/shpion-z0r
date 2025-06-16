import React from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@mui/system';

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

export const AppLoader = () => {
  return (
    <Box
      sx={{
        width: '48px',
        height: '48px',
        border: '5px solid #ffffff40',
        borderTop: '5px solid #fff',
        borderRadius: '50%',
        animation: `${spin} 1s linear infinite`,
      }}
    />
  );
}; 