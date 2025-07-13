import React from 'react';
import { Box, BoxProps } from '@mui/material';
import { motion } from 'framer-motion';

export interface AnimatedContainerProps extends BoxProps {
  /** CSS gradient background */
  gradient?: string;
  /** Fade-in duration (s) */
  duration?: number;
}

/**
 * Full-screen flex container with fade-in and configurable gradient backdrop.
 * Children are automatically placed above the gradient.
 */
export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  gradient = 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
  duration = 1,
  sx = {},
  ...rest
}) => {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, ease: 'easeInOut' }}
      sx={{
        position: 'relative',
        flex: 1,
        width: '100%',
        minHeight: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        color: 'new.foreground',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: gradient,
          zIndex: 0,
        },
        ...sx,
      }}
      {...rest}
    >
      {/* Elevate children above gradient */}
      <Box sx={{ zIndex: 1, width: '100%' }}>{children}</Box>
    </Box>
  );
}; 