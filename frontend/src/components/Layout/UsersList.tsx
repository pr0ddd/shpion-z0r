import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  IconButton,
  Button,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Settings as SettingsIcon,
  SignalCellular4Bar,
  SignalCellular3Bar,
  SignalCellular2Bar,
  SignalCellularOff,
  People as PeopleIcon,
  AccountCircle as UserIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { colors } from '../../theme';
import { VoiceParticipant } from '../../types/socket';
import { useSocket } from '../../contexts/SocketContext';

interface UsersListProps {
  selectedServerId?: string;
  isInLobby: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  participants: VoiceParticipant[];
  connectionError: string | null;
  currentServerId: string | null;
}

const UsersList: React.FC<UsersListProps> = ({ 
  selectedServerId,
  isInLobby,
  isConnected,
  isConnecting,
  participants,
  connectionError,
  currentServerId
}) => {
  // Get WebSocket context for additional data
  const { state: socketState, actions: socketActions } = useSocket();
  
  // Get online users and additional participants data
  const onlineUsers = Array.from(socketState.onlineUsers.values());
  const typingUsers = currentServerId ? (socketState.typingUsers.get(currentServerId) || []) : [];
  
  // Debug logging
  console.log('🔍 UsersList Debug:', {
    selectedServerId,
    currentServerId,
    isInLobby,
    isConnected,
    isConnecting,
    participantsCount: participants.length,
    onlineUsersCount: onlineUsers.length,
    typingUsersCount: typingUsers.length,
    connectionError,
    participants: participants.map(p => ({ id: p.id, username: p.username, isLocal: p.isLocal })),
    onlineUsers: onlineUsers.map(u => ({ id: u.id, username: u.username, status: u.status }))
  });

  const getUserAvatarUrl = (username: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=5865f2&color=fff`;
  };

  const getConnectionIcon = (quality: 'excellent' | 'good' | 'poor' | 'unknown') => {
    switch (quality) {
      case 'excellent':
        return <SignalCellular4Bar sx={{ fontSize: 14, color: '#4caf50' }} />;
      case 'good':
        return <SignalCellular3Bar sx={{ fontSize: 14, color: '#ff9800' }} />;
      case 'poor':
        return <SignalCellular2Bar sx={{ fontSize: 14, color: '#f44336' }} />;
      default:
        return <SignalCellularOff sx={{ fontSize: 14, color: '#9e9e9e' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return '#4caf50';
      case 'away':
        return '#ff9800';
      case 'busy':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const renderVoiceControls = (participant: VoiceParticipant) => (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {/* Microphone status */}
      <IconButton
        size="small"
        sx={{
          p: 0.5,
          color: participant.isMuted ? colors.accent.danger : colors.accent.success,
          backgroundColor: participant.isMuted ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)',
          '&:hover': {
            backgroundColor: participant.isMuted ? 'rgba(244, 67, 54, 0.2)' : 'rgba(76, 175, 80, 0.2)',
          },
        }}
        disabled
        title={participant.isMuted ? "Микрофон выключен" : "Микрофон включен"}
      >
        {participant.isMuted ? <MicOffIcon fontSize="small" /> : <MicIcon fontSize="small" />}
      </IconButton>
      
      {/* Speaker/Deafen status - show for all participants */}
      <IconButton
        size="small"
        sx={{
          p: 0.5,
          color: participant.isDeafened ? colors.accent.danger : colors.accent.success,
          backgroundColor: participant.isDeafened ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)',
          '&:hover': {
            backgroundColor: participant.isDeafened ? 'rgba(244, 67, 54, 0.2)' : 'rgba(76, 175, 80, 0.2)',
          },
        }}
        disabled
        title={participant.isDeafened ? "Звук выключен" : "Звук включен"}
      >
        {participant.isDeafened ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
      </IconButton>
      
      {/* Connection quality indicator */}
      <Box sx={{ ml: 0.5 }}>
        {getConnectionIcon(participant.connectionQuality)}
      </Box>
    </Box>
  );

  const renderSpeakingIndicator = (participant: VoiceParticipant) => {
    if (!participant.isSpeaking) return null;
    
    return (
      <Box
        sx={{
          position: 'absolute',
          top: -3,
          left: -3,
          right: -3,
          bottom: -3,
          borderRadius: '50%',
          border: `3px solid ${colors.accent.success}`,
          animation: 'pulse 1.5s infinite',
          '@keyframes pulse': {
            '0%': {
              opacity: 1,
              transform: 'scale(1)',
            },
            '50%': {
              opacity: 0.7,
              transform: 'scale(1.05)',
            },
            '100%': {
              opacity: 1,
              transform: 'scale(1)',
            },
          },
        }}
      />
    );
  };

  // Handle request presence to get users
  const handleRequestPresence = () => {
    if (currentServerId) {
      socketActions.requestPresence(currentServerId);
    }
  };

  // Determine current state - SIMPLIFIED LOGIC
  const showVoiceParticipants = participants.length > 0;
  const showConnecting = selectedServerId && isConnecting;
  const showConnectionError = selectedServerId && connectionError;
  const showOnlineUsers = selectedServerId && onlineUsers.length > 0;
  const showLobbyMessage = !selectedServerId;

  // Debug the display logic
  console.log('🎭 UsersList Display Logic:', {
    showVoiceParticipants,
    showConnecting,
    showConnectionError,
    showOnlineUsers,
    showLobbyMessage,
    conditions: {
      'selectedServerId': !!selectedServerId,
      'isConnected': isConnected,
      'participants.length > 0': participants.length > 0,
      'onlineUsers.length > 0': onlineUsers.length > 0,
      'isConnecting': isConnecting,
      'connectionError': !!connectionError,
    }
  });

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
          p: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            👥 Участники
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {showLobbyMessage ? (
              'Лобби - выберите сервер'
            ) : showVoiceParticipants ? (
              `${participants.length} участник${participants.length !== 1 ? 'ов' : ''} в голосовом чате`
            ) : showConnecting ? (
              'Подключение к голосовому чату...'
            ) : showConnectionError ? (
              'Ошибка подключения'
            ) : (
              `${onlineUsers.length} пользователей онлайн`
            )}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {currentServerId && (
            <IconButton 
              size="small" 
              onClick={handleRequestPresence}
              title="Обновить список пользователей"
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small">
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        
        {/* Voice channel participants */}
        {showVoiceParticipants && (
          <>
            <Box sx={{ p: 1 }}>
              <Typography variant="overline" sx={{ 
                color: colors.text.muted,
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}>
                <VolumeUpIcon fontSize="small" />
                Голосовой чат — {participants.length}
              </Typography>
            </Box>
            
            <List sx={{ p: 0 }}>
              {participants.map((participant) => (
                <ListItem
                  key={participant.id}
                  sx={{
                    py: 1.5,
                    px: 2,
                    backgroundColor: participant.isLocal 
                      ? 'rgba(88, 101, 242, 0.1)' 
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: participant.isLocal 
                        ? 'rgba(88, 101, 242, 0.15)'
                        : 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 48 }}>
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={participant.avatar ? participant.avatar : getUserAvatarUrl(participant.username)}
                        sx={{ width: 40, height: 40 }}
                      />
                      {renderSpeakingIndicator(participant)}
                    </Box>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={500}>
                          {participant.username}
                        </Typography>
                        {participant.isLocal && (
                          <Chip 
                            label="Вы" 
                            size="small" 
                            sx={{ 
                              height: 20, 
                              fontSize: '0.7rem',
                              backgroundColor: colors.accent.info,
                              color: 'white'
                            }} 
                          />
                        )}
                      </Box>
                    }
                    sx={{ m: 0 }}
                  />
                  
                  <Box sx={{ ml: 'auto' }}>
                    {renderVoiceControls(participant)}
                  </Box>
                </ListItem>
              ))}
            </List>
          </>
        )}

        {/* Online Users (when not in voice or no voice participants) */}
        {showOnlineUsers && (
          <>
            <Box sx={{ p: 1 }}>
              <Typography variant="overline" sx={{ 
                color: colors.text.muted,
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}>
                <UserIcon fontSize="small" />
                Онлайн — {onlineUsers.length}
              </Typography>
            </Box>
            
            <List sx={{ p: 0 }}>
              {onlineUsers.map((user) => (
                <ListItem
                  key={user.id}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 48 }}>
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={user.avatar ? user.avatar : getUserAvatarUrl(user.username)}
                        sx={{ width: 40, height: 40 }}
                      />
                      {/* Online status indicator */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          backgroundColor: getStatusColor(user.status),
                          border: '2px solid',
                          borderColor: colors.background.secondary,
                        }}
                      />
                    </Box>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={500}>
                        {user.username}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="textSecondary">
                        {user.status === 'online' ? 'Онлайн' : 
                         user.status === 'away' ? 'Отошёл' : 
                         user.status === 'busy' ? 'Занят' : 'Оффлайн'}
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {/* Connecting state */}
        {showConnecting && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" gutterBottom>
              🔄 Подключение...
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Устанавливается соединение с голосовым каналом
            </Typography>
          </Box>
        )}

        {/* Connection error */}
        {showConnectionError && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" gutterBottom color="error">
              ❌ Ошибка подключения
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {connectionError}
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleRequestPresence}
              sx={{ mt: 2 }}
            >
              Попробовать снова
            </Button>
          </Box>
        )}

        {/* Empty voice channel but connected */}
        {showLobbyMessage && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" gutterBottom>
              🏠 Лобби
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Выберите сервер для подключения к голосовому каналу
            </Typography>
            {onlineUsers.length > 0 && (
              <Typography variant="caption" color="textSecondary">
                {onlineUsers.length} пользователей онлайн
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default UsersList; 