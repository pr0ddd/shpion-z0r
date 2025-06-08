import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Divider,
  Button
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { RemoteParticipant, Track } from 'livekit-client';
import { useServer } from '../contexts/ServerContext';
import { useSocket } from '../contexts/SocketContext';
import { serverAPI } from '../services/api';
import InviteManager from './InviteManager';

export default function ServerMembers() {
  const { selectedServer, room, activeSpeakers, isLocalSpeaking } = useServer();
  const { serverUsers, serverVoiceStates, socket } = useSocket();
  const [members, setMembers] = useState<any[]>([]);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [inviteManagerOpen, setInviteManagerOpen] = useState(false);

  // Обновляем участников сервера из сокетов
  useEffect(() => {
    if (selectedServer) {
      const users = serverUsers.get(selectedServer.id) || [];
      const voiceStates = serverVoiceStates.get(selectedServer.id) || [];
      
      // Объединяем данные пользователей с их голосовыми состояниями
      const membersWithVoice = users.map(user => {
        const voiceState = voiceStates.find(v => v.userId === user.id);
        return {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          status: user.status,
          inVoice: !!voiceState,
          isMuted: voiceState?.isMuted || false,
          isDeafened: voiceState?.isDeafened || false,
          role: 'MEMBER' // TODO: добавить роли если нужно
        };
      });
      
      setMembers(membersWithVoice);
      console.log('📋 Updated members from socket:', membersWithVoice);
      console.log('🎤 Voice states from socket:', voiceStates);
    } else {
      setMembers([]);
    }
  }, [selectedServer, serverUsers, serverVoiceStates]);

  // Следим за участниками голосового чата
  useEffect(() => {
    if (room) {
      const updateParticipants = () => {
        setParticipants(Array.from(room.remoteParticipants.values()));
      };

      room.on('participantConnected', updateParticipants);
      room.on('participantDisconnected', updateParticipants);
      
      updateParticipants();

      return () => {
        room.off('participantConnected', updateParticipants);
        room.off('participantDisconnected', updateParticipants);
      };
    }
  }, [room]);

  // Отслеживаем состояние микрофона и звука
  useEffect(() => {
    if (room?.localParticipant) {
      // Инициализируем состояние микрофона
      const initialMicState = room.localParticipant.isMicrophoneEnabled;
      setIsMicEnabled(initialMicState);
      console.log('🎤 Initial microphone state:', initialMicState);
      
      // Получаем ID текущего пользователя из identity LiveKit
      const identity = room.localParticipant.identity;
      // Identity в формате "userId:username", берем первую часть
      const userId = identity.split(':')[0];
      setCurrentUserId(userId);
      console.log(`👤 Current user ID set from LiveKit identity: ${identity} -> ${userId}`);
      
      // Обновляем статус при изменениях
      const updateStatus = () => {
        const newState = room.localParticipant.isMicrophoneEnabled;
        console.log('🎤 Microphone state changed to:', newState);
        setIsMicEnabled(newState);
      };
      
      // Также слушаем события треков
      const updateTrackStatus = () => {
        const micPublication = room.localParticipant.getTrackPublication(Track.Source.Microphone);
        if (micPublication) {
          const isEnabled = !micPublication.isMuted;
          console.log('🎤 Track-based microphone state:', isEnabled);
          setIsMicEnabled(isEnabled);
        }
      };
      
      room.localParticipant.on('trackMuted', updateTrackStatus);
      room.localParticipant.on('trackUnmuted', updateTrackStatus);
      room.localParticipant.on('trackPublished', updateStatus);
      room.localParticipant.on('trackUnpublished', updateStatus);
      
      return () => {
        room.localParticipant.off('trackMuted', updateTrackStatus);
        room.localParticipant.off('trackUnmuted', updateTrackStatus);
        room.localParticipant.off('trackPublished', updateStatus);
        room.localParticipant.off('trackUnpublished', updateStatus);
      };
    }
  }, [room]);

  // Проверяем является ли участник активным говорящим
  const isSpeaking = (memberId: string) => {
    // Проверяем, является ли это текущим пользователем и говорит ли он
    if (currentUserId && memberId === currentUserId) {
      return isLocalSpeaking;
    }
    
    // Для остальных участников проверяем в activeSpeakers
    return activeSpeakers.some(speaker => {
      const speakerId = speaker.identity.split(':')[0];
      return speakerId === memberId;
    });
  };

  // Обработчики для кнопок управления
  const toggleMicrophone = async () => {
    if (room?.localParticipant) {
      try {
        const newState = !isMicEnabled;
        console.log(`🎤 Toggling microphone from ${isMicEnabled} to ${newState}`);
        
        await room.localParticipant.setMicrophoneEnabled(newState);
        
        // Принудительно обновляем состояние
        setIsMicEnabled(newState);
        
        // Уведомляем сокеты об изменении состояния микрофона
        if (socket && selectedServer && currentUserId) {
          const userStr = localStorage.getItem('user');
          const user = userStr ? JSON.parse(userStr) : null;
          
          if (user) {
            socket.emit('voice:user_muted', {
              serverId: selectedServer.id,
              userId: user.id,
              username: user.username,
              isMuted: !newState, // isMuted = противоположность включенности микрофона
              timestamp: Date.now()
            });
            console.log(`🔔 Socket notified: microphone ${newState ? 'enabled' : 'disabled'}`);
          }
        }
        
        console.log(`✅ Microphone ${newState ? 'enabled' : 'disabled'}`);
      } catch (error) {
        console.error('❌ Failed to toggle microphone:', error);
        
        // При ошибке запрашиваем разрешения заново
        if ((error as Error).message?.includes('permission') || (error as Error).message?.includes('denied')) {
          try {
            console.log('🔄 Requesting microphone permissions...');
            await navigator.mediaDevices.getUserMedia({ audio: true });
            await room.localParticipant.setMicrophoneEnabled(true);
            setIsMicEnabled(true);
          } catch (permError) {
            console.error('❌ Failed to get microphone permissions:', permError);
            alert('Микрофон заблокирован! Разрешите доступ к микрофону в настройках браузера.');
          }
        }
      }
    }
  };

  const toggleAudio = () => {
    if (room) {
      try {
        if (isAudioEnabled) {
          // Выключаем звук - отключаем все аудио треки
          room.remoteParticipants.forEach(participant => {
            participant.audioTrackPublications.forEach(pub => {
              if (pub.track) {
                pub.track.stop();
              }
            });
          });
        } else {
          // Включаем звук - возобновляем все аудио треки
          room.remoteParticipants.forEach(participant => {
            participant.audioTrackPublications.forEach(pub => {
              if (pub.track) {
                pub.track.start();
              }
            });
          });
        }
        setIsAudioEnabled(!isAudioEnabled);
      } catch (error) {
        console.error('Failed to toggle audio:', error);
      }
    }
  };

  if (!selectedServer) {
    return (
      <Box 
        sx={{ 
          width: 240,
          height: '100vh',
          bgcolor: '#2f3136',
          borderRight: '1px solid #202225',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Выберите сервер
        </Typography>
      </Box>
    );
  }

  const MemberItem = React.memo(({ member, isVoiceParticipant = false }: { member: any, isVoiceParticipant?: boolean }) => {
    const speaking = isSpeaking(member.id || member.userId);
    
    return (
              <ListItem
        sx={{
          py: 0.5,
          px: 2,
          '&:hover': {
            bgcolor: 'rgba(79, 84, 92, 0.16)',
          }
        }}
      >
        <ListItemAvatar sx={{ minWidth: 40 }}>
          <Avatar
            sx={{ 
              width: 32, 
              height: 32,
              border: speaking 
                ? '3px solid #faa61a' // Оранжевая рамка для говорящих
                : isVoiceParticipant 
                  ? '1px solid #57f287' // Тонкая зеленая рамка для участников голоса
                  : 'none',
              boxShadow: speaking ? '0 0 10px rgba(250, 166, 26, 0.5)' : 'none',
              transition: 'all 0.2s ease'
            }}
            src={member.avatar}
          >
            {member.username?.charAt(0)?.toUpperCase() || '?'}
          </Avatar>
        </ListItemAvatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: speaking 
                ? '#faa61a' // Оранжевый текст для говорящих
                : '#dcddde', // Обычный цвет для всех остальных
              fontWeight: speaking ? 700 : 400,
              fontSize: '0.875rem'
            }}
          >
            {member.username || 'Unknown'}
            {speaking && ' 🗣️'}
          </Typography>
          {member.inVoice && (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {member.isMuted ? (
                  <MicOffIcon sx={{ fontSize: 14, color: '#ed4245' }} />
                ) : (
                  <MicIcon sx={{ fontSize: 14, color: '#57f287' }} />
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {member.isDeafened ? (
                  <VolumeOffIcon sx={{ fontSize: 14, color: '#ed4245' }} />
                ) : (
                  <VolumeUpIcon sx={{ fontSize: 14, color: '#57f287' }} />
                )}
              </Box>
            </Box>
          )}
        </Box>
        {member.role === 'OWNER' && (
          <Box
            sx={{ 
              height: 18, 
              minWidth: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            👑
          </Box>
        )}
      </ListItem>
    );
  });

  return (
    <Box 
      sx={{ 
        width: 240,
        height: '100vh',
        bgcolor: '#2f3136',
        borderRight: '1px solid #202225',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #202225' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ color: '#8e9297', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>
            Участники — {members.length}
          </Typography>
          <IconButton
            onClick={() => setInviteManagerOpen(true)}
            size="small"
            sx={{ 
              color: '#b9bbbe',
              '&:hover': { 
                color: '#dcddde',
                bgcolor: 'rgba(79, 84, 92, 0.16)' 
              }
            }}
          >
            <PersonAddIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Members List */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <List dense sx={{ py: 0 }}>
          {members.map((member) => (
            <MemberItem 
              key={member.id} 
              member={member} 
              isVoiceParticipant={member.inVoice}
            />
          ))}
        </List>
      </Box>

      {/* Voice Controls Panel */}
      {room && (
        <Box 
          sx={{ 
            borderTop: '1px solid #202225',
            bgcolor: '#292b2f',
            p: 1,
            display: 'flex',
            justifyContent: 'center',
            gap: 1
          }}
        >
          {/* Microphone Toggle */}
          <IconButton
            onClick={toggleMicrophone}
            sx={{
              bgcolor: isMicEnabled ? '#57f287' : '#ed4245',
              color: '#fff',
              width: 36,
              height: 36,
              '&:hover': {
                bgcolor: isMicEnabled ? '#4fb375' : '#c23133',
              },
              transition: 'all 0.2s ease'
            }}
          >
            {isMicEnabled ? <MicIcon /> : <MicOffIcon />}
          </IconButton>

          {/* Audio Toggle */}
          <IconButton
            onClick={toggleAudio}
            sx={{
              bgcolor: isAudioEnabled ? '#57f287' : '#ed4245',
              color: '#fff',
              width: 36,
              height: 36,
              '&:hover': {
                bgcolor: isAudioEnabled ? '#4fb375' : '#c23133',
              },
              transition: 'all 0.2s ease'
            }}
          >
            {isAudioEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
          </IconButton>
        </Box>
      )}

      {/* Invite Manager Dialog */}
      <InviteManager
        open={inviteManagerOpen}
        onClose={() => setInviteManagerOpen(false)}
        serverId={selectedServer.id}
        serverName={selectedServer.name}
      />
    </Box>
  );
} 