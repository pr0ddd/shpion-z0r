import React from 'react';
import { Box, Typography, Button, Chip, Paper } from '@mui/material';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../hooks/useAuth';

const SocketTest: React.FC = () => {
  const { user } = useAuth();
  const { isConnected, state, actions } = useSocket();

  const handleJoinServer = () => {
    actions.joinServer('test-server-1');
  };

  const handleJoinVoice = () => {
    actions.joinVoice('test-server-1');
  };

  const handleToggleMute = () => {
    actions.toggleMute();
  };

  const handleToggleDeafen = () => {
    actions.toggleDeafen();
  };

  const handleSendMessage = () => {
    actions.sendMessage('test-server-1', 'Hello from WebSocket!');
  };

  const handleRequestPresence = () => {
    actions.requestPresence(state.currentServerId || undefined);
  };

  const participantsForCurrentServer = state.currentServerId 
    ? state.voiceParticipants.get(state.currentServerId) || []
    : [];

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h5" gutterBottom>
        🔌 WebSocket Test Dashboard
      </Typography>
      
      {/* Connection Status */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Connection Status:</Typography>
        <Chip 
          label={isConnected ? '✅ Connected' : '❌ Disconnected'} 
          color={isConnected ? 'success' : 'error'} 
        />
      </Box>

      {/* User Info */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">User Info:</Typography>
        <Typography>ID: {user?.id}</Typography>
        <Typography>Username: {user?.username}</Typography>
      </Box>

      {/* Current State */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Current State:</Typography>
        <Typography>Server: {state.currentServerId || 'None'}</Typography>
        <Typography>Muted: {state.currentUserVoiceState.isMuted ? '🔇' : '🎤'}</Typography>
        <Typography>Deafened: {state.currentUserVoiceState.isDeafened ? '🔇' : '🔊'}</Typography>
        <Typography>Online Users: {state.onlineUsers.size}</Typography>
        <Typography>Voice Participants: {participantsForCurrentServer.length}</Typography>
      </Box>

      {/* Voice Participants */}
      {participantsForCurrentServer.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Voice Participants:</Typography>
          {participantsForCurrentServer.map((participant) => (
            <Box key={participant.id} sx={{ ml: 2 }}>
              <Typography>
                {participant.username} 
                {participant.isMuted ? ' 🔇' : ' 🎤'}
                {participant.isDeafened ? ' 🔇' : ' 🔊'}
                {participant.isSpeaking ? ' 🗣️' : ''}
                {participant.isLocal ? ' (You)' : ''}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Online Users */}
      {state.onlineUsers.size > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Online Users:</Typography>
          {Array.from(state.onlineUsers.values()).map((user) => (
            <Box key={user.id} sx={{ ml: 2 }}>
              <Typography>
                {user.username} - {user.status}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Test Actions */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>Actions:</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={handleJoinServer}>
            Join Test Server
          </Button>
          <Button variant="outlined" onClick={handleJoinVoice}>
            Join Voice
          </Button>
          <Button variant="outlined" onClick={handleToggleMute}>
            Toggle Mute
          </Button>
          <Button variant="outlined" onClick={handleToggleDeafen}>
            Toggle Deafen
          </Button>
          <Button variant="outlined" onClick={handleSendMessage}>
            Send Test Message
          </Button>
          <Button variant="contained" onClick={handleRequestPresence}>
            🔄 Request Presence
          </Button>
        </Box>
      </Box>

      {/* Debug Info */}
      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>Debug Info:</Typography>
        <Typography variant="caption" component="pre" sx={{ fontSize: '0.7rem' }}>
          {JSON.stringify({
            isConnected,
            currentServerId: state.currentServerId,
            voiceState: state.currentUserVoiceState,
            onlineUsersCount: state.onlineUsers.size,
            voiceParticipantsCount: participantsForCurrentServer.length,
            onlineUsersList: Array.from(state.onlineUsers.values()).map(u => u.username),
            voiceParticipantsList: participantsForCurrentServer.map(p => p.username),
          }, null, 2)}
        </Typography>
      </Box>
    </Paper>
  );
};

export default SocketTest; 