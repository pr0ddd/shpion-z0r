import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Chat as ChatIcon,
  VideoCall as VideoCallIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  NotificationsNone as NotificationsIcon,
  Help as HelpIcon,
  Mic as MicIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { colors } from '../../theme';
import { Server } from '../../types';
import { serverAPI } from '../../services/api';
import { InviteDialog } from '../dialogs/InviteDialog';

interface MainContentProps {
  children?: React.ReactNode;
  selectedServerId?: string;
}

const MainContent: React.FC<MainContentProps> = ({ children, selectedServerId }) => {
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  useEffect(() => {
    const loadServer = async () => {
      if (selectedServerId) {
        try {
          const response = await serverAPI.getServer(selectedServerId);
          if (response.success && response.data) {
            setSelectedServer(response.data);
          }
        } catch (error) {
          console.error('Failed to load server:', error);
          setSelectedServer(null);
        }
      } else {
        setSelectedServer(null);
      }
    };

    loadServer();
  }, [selectedServerId]);

  const getHeaderTitle = () => {
    if (selectedServer) {
      return selectedServer.name;
    }
    return 'Домашняя страница';
  };

  const getHeaderIcon = () => {
    if (selectedServer) {
      return <MicIcon sx={{ color: colors.text.secondary }} />;
    }
    return <ChatIcon sx={{ color: colors.text.secondary }} />;
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          height: 60,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: colors.background.primary,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getHeaderIcon()}
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {getHeaderTitle()}
          </Typography>
          {selectedServer && (
            <Typography variant="caption" sx={{ color: colors.text.muted }}>
              {selectedServer.description}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Invite button for selected server */}
          {selectedServer && (
            <IconButton 
              size="small" 
              onClick={() => setIsInviteDialogOpen(true)}
              sx={{ 
                color: colors.primary,
                '&:hover': { bgcolor: 'rgba(88, 101, 242, 0.1)' }
              }}
            >
              <PersonAddIcon />
            </IconButton>
          )}
          
          <IconButton size="small" sx={{ color: colors.text.secondary }}>
            <SearchIcon />
          </IconButton>
          <IconButton size="small" sx={{ color: colors.text.secondary }}>
            <NotificationsIcon />
          </IconButton>
          <IconButton size="small" sx={{ color: colors.text.secondary }}>
            <HelpIcon />
          </IconButton>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
          
          <IconButton size="small" sx={{ color: colors.text.secondary }}>
            <VideoCallIcon />
          </IconButton>
          <IconButton size="small" sx={{ color: colors.text.secondary }}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Main content area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children || (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: 'center',
                backgroundColor: colors.background.secondary,
                border: `1px solid rgba(255, 255, 255, 0.1)`,
                borderRadius: 3,
                maxWidth: 400,
              }}
            >
              {selectedServer ? (
                <>
                  <MicIcon 
                    sx={{ 
                      fontSize: 64, 
                      color: colors.primary, 
                      mb: 3 
                    }} 
                  />
                  
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 2,
                      color: colors.text.primary 
                    }}
                  >
                    Сервер: {selectedServer.name}
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: colors.text.secondary,
                      mb: 3,
                      lineHeight: 1.6
                    }}
                  >
                    {selectedServer.description || 'Подключитесь к голосовому каналу или начните общение в чате.'}
                  </Typography>
                  
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      gap: 2,
                      flexWrap: 'wrap'
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: colors.text.muted 
                      }}
                    >
                      <MicIcon fontSize="small" />
                      Голосовой канал: {selectedServer.voiceChannelName}
                    </Typography>
                    
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: colors.text.muted 
                      }}
                    >
                      <ChatIcon fontSize="small" />
                      Текстовый канал: {selectedServer.textChannelName}
                    </Typography>
                  </Box>
                </>
              ) : (
                <>
                  <ChatIcon 
                    sx={{ 
                      fontSize: 64, 
                      color: colors.text.muted, 
                      mb: 3 
                    }} 
                  />
                  
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 2,
                      color: colors.text.primary 
                    }}
                  >
                    Добро пожаловать в Shpion
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: colors.text.secondary,
                      mb: 3,
                      lineHeight: 1.6
                    }}
                  >
                    Выберите сервер слева для начала общения, или создайте новый сервер для ваших друзей.
                  </Typography>
                  
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      gap: 2,
                      flexWrap: 'wrap'
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: colors.text.muted 
                      }}
                    >
                      <ChatIcon fontSize="small" />
                      Текстовые чаты
                    </Typography>
                    
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: colors.text.muted 
                      }}
                    >
                      <VideoCallIcon fontSize="small" />
                      Голосовые каналы
                    </Typography>
                  </Box>
                </>
              )}
            </Paper>
          </Box>
        )}
      </Box>

      {/* Invite Dialog */}
      {selectedServer && (
        <InviteDialog
          open={isInviteDialogOpen}
          onClose={() => setIsInviteDialogOpen(false)}
          serverId={selectedServer.id}
          serverName={selectedServer.name}
        />
      )}
    </Box>
  );
};

export default MainContent; 