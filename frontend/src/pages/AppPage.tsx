import React from 'react';
import { Box } from '@mui/material';
import AppLayout from '../components/Layout/AppLayout';
import SocketTest from '../components/SocketTest';

const AppPage: React.FC = () => {
  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      <AppLayout>
        <SocketTest />
      </AppLayout>
    </Box>
  );
};

export default AppPage; 