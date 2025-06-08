import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  Box,
  Avatar,
  Tooltip,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { serverAPI } from '../services/api';
import { useServer } from '../contexts/ServerContext';
import { CreateServerDialog } from './CreateServerDialog';

export default function ServersSidebar() {
  const { 
    servers, 
    selectedServer, 
    isLoading, 
    error,
    isConnecting,
    setServers, 
    selectServer, 
    setLoading, 
    setError,
    restoreUserState
  } = useServer();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      restoreUserState();
      hasInitialized.current = true;
    }
  }, [restoreUserState]);

  const handleServerClick = useCallback((server: any) => {
    selectServer(server);
  }, [selectServer]);

  const handleCreateServer = useCallback((newServer: any) => {
    // Добавляем новый сервер в список
    setServers([...(servers || []), newServer]);
    // Автоматически выбираем новый сервер
    selectServer(newServer);
  }, [servers, setServers, selectServer]);

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          width: 72,
          height: '100vh',
          bgcolor: 'background.paper',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRight: '1px solid',
          borderColor: 'divider'
        }}
      >
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        sx={{ 
          width: 72,
          height: '100vh',
          bgcolor: 'background.paper',
          p: 1,
          borderRight: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Alert severity="error" sx={{ fontSize: '0.75rem' }}>
          Error
        </Alert>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        width: 72,
        height: '100vh',
        bgcolor: '#202225', // Discord sidebar color
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 1,
        gap: 1,
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#2f3136',
          borderRadius: '4px',
        },
      }}
    >
      {/* Home/Direct Messages icon */}
      <Tooltip title="Direct Messages" placement="right">
        <Avatar
          sx={{
            width: 48,
            height: 48,
            bgcolor: '#5865f2', // Discord blurple
            cursor: 'pointer',
            transition: 'border-radius 0.2s ease',
            borderRadius: selectedServer === null ? '30%' : '50%',
            '&:hover': {
              borderRadius: '30%',
              bgcolor: '#4752c4',
            }
          }}
          onClick={() => selectServer(null)}
        >
          🏠
        </Avatar>
      </Tooltip>

      <Divider 
        sx={{ 
          width: 32, 
          bgcolor: '#36393f',
          my: 0.5
        }} 
      />

      {/* Server icons */}
      {servers && servers.map((server) => (
        <Tooltip key={server.id} title={server.name} placement="right">
          <Box sx={{ position: 'relative' }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: 'primary.main',
                cursor: 'pointer',
                transition: 'border-radius 0.2s ease',
                borderRadius: selectedServer?.id === server.id ? '30%' : '50%',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                '&:hover': {
                  borderRadius: '30%',
                }
              }}
              onClick={() => handleServerClick(server)}
            >
              {server.name.charAt(0).toUpperCase()}
            </Avatar>
            
            {/* Connection loading indicator */}
            {isConnecting && selectedServer?.id === server.id && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(0,0,0,0.7)',
                  borderRadius: '30%',
                }}
              >
                <CircularProgress size={20} sx={{ color: 'white' }} />
              </Box>
            )}
            
            {/* Active server indicator */}
            {selectedServer?.id === server.id && (
              <Box
                sx={{
                  position: 'absolute',
                  left: -12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 8,
                  height: 40,
                  bgcolor: '#ffffff',
                  borderRadius: '0 4px 4px 0',
                }}
              />
            )}
            
            {/* Voice participants indicator */}
            {server.voiceParticipants && server.voiceParticipants.length > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  minWidth: 16,
                  height: 16,
                  bgcolor: '#57f287', // Discord green
                  color: '#000',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  border: '2px solid #202225',
                }}
              >
                {server.voiceParticipants.length}
              </Box>
            )}
          </Box>
        </Tooltip>
      ))}

      {/* Create Server Button */}
      <Tooltip title="Создать сервер" placement="right">
        <Avatar
          sx={{
            width: 48,
            height: 48,
            bgcolor: '#43b581', // Discord green
            cursor: 'pointer',
            transition: 'border-radius 0.2s ease',
            borderRadius: '50%',
            '&:hover': {
              borderRadius: '30%',
              bgcolor: '#3ca374',
            }
          }}
          onClick={() => setCreateDialogOpen(true)}
        >
          <AddIcon />
        </Avatar>
      </Tooltip>

      {/* Create Server Dialog */}
      <CreateServerDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateServer}
      />
    </Box>
  );
} 