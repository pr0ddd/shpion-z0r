import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography } from '@mui/material';
import { Server } from '../types';
import './ServerTransition.css';

interface ServerTransitionProps {
  server: Server;
}

const transitionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.5, delay: 0.5 } },
};

export const ServerTransition: React.FC<ServerTransitionProps> = ({ server }) => {
  return (
    <motion.div
      key="transition-screen"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#202225',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      variants={transitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Box sx={{ textAlign: 'center', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="loader">
          <div className="inner one"></div>
          <div className="inner two"></div>
          <div className="inner three"></div>
        </div>
        <Typography variant="h4" sx={{ mt: 3, fontWeight: 'bold' }}>
          Влетаем с ноги на сервер:
        </Typography>
        <Typography variant="h5" sx={{ mt: 1 }}>
          {server.name}
        </Typography>
      </Box>
    </motion.div>
  );
}; 