import React from 'react';
import { Box } from '@mui/material';
import { CustomChat } from './CustomChat';

const ServerContent: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', height: '100%', flexDirection: 'column', minWidth: 0 }}>
      <CustomChat />
    </Box>
  );
};

export default ServerContent;