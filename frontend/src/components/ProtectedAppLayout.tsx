import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import ServersSidebar from './ServersSidebar';
import ServerContent from './ServerContent';
import ServerMembers from './ServerMembers';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedAppLayout() {
  const { user, logout } = useAuth();

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <ServersSidebar />
      <ServerMembers />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Typography variant="h5" component="h1">
            Shpion Voice Chat
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1">
              Привет, {user?.username}!
            </Typography>
            <Button variant="outlined" size="small" onClick={logout}>
              Выйти
            </Button>
          </Box>
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <ServerContent />
        </Box>
      </Box>
    </Box>
  );
} 