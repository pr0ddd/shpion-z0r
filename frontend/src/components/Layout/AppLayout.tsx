import React from 'react';
import { Box } from '@mui/material';
import { colors } from '../../theme';
import ServerSidebar from './ServerSidebar';
import UsersList from './UsersList';
import MainContent from './MainContent';
import VoiceControls from '../VoiceControls';
import { useVoiceChannelV2 } from '../../hooks/useVoiceChannelV2';
import { useSocket } from '../../contexts/SocketContext';

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  // Use new WebSocket architecture
  const { isConnected: socketConnected } = useSocket();
  
  const { 
    selectServer, 
    leaveServer, 
    currentServerId, 
    isInLobby,
    isConnected,
    isConnecting,
    participants,
    connectionError,
    isMuted,
    isDeafened,
    toggleMute,
    toggleDeafen
  } = useVoiceChannelV2();

  // Handle server selection
  const handleServerSelect = async (serverId: string | undefined) => {
    if (serverId) {
      // Auto-connect to voice channel when selecting server
      await selectServer(serverId);
    } else {
      // Return to lobby when deselecting
      await leaveServer();
    }
  };

  console.log('🏗️ AppLayout State:', {
    socketConnected,
    isInLobby,
    currentServerId,
    isConnected,
    participantsCount: participants.length,
  });

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: colors.background.primary,
        position: 'relative',
      }}
    >
      {/* Левая колонка - Серверы (72px) */}
      <Box
        sx={{
          width: 72,
          flexShrink: 0,
          backgroundColor: colors.background.tertiary,
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <ServerSidebar 
          selectedServerId={currentServerId || undefined}
          onServerSelect={handleServerSelect}
        />
      </Box>

      {/* Центральная колонка - Участники (280px) */}
      <Box
        sx={{
          width: 280,
          flexShrink: 0,
          backgroundColor: colors.background.secondary,
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <UsersList 
          selectedServerId={currentServerId || undefined}
          isInLobby={isInLobby}
          isConnected={isConnected}
          isConnecting={isConnecting}
          participants={participants}
          connectionError={connectionError}
          currentServerId={currentServerId}
        />
      </Box>

      {/* Правая область - Основной контент (flex) */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: colors.background.primary,
          overflow: 'hidden',
        }}
      >
        <MainContent selectedServerId={currentServerId || undefined}>{children}</MainContent>
      </Box>

      {/* Голосовые элементы управления */}
      <VoiceControls 
        isMuted={isMuted}
        isDeafened={isDeafened}
        toggleMute={toggleMute}
        toggleDeafen={toggleDeafen}
        isConnected={isConnected}
        currentServerId={currentServerId}
        isInLobby={isInLobby}
      />
    </Box>
  );
};

export default AppLayout; 