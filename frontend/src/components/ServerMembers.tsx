import React, { useMemo, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar, Skeleton, Slider, Stack } from '@mui/material';
import { useParticipants, useIsSpeaking, useIsMuted, useTracks, AudioTrack } from '@livekit/components-react';
import { useServer } from '../contexts/ServerContext';
import { MaterialControlBar } from './MaterialControlBar';
import { Participant, Track } from 'livekit-client';
import { User } from '../types';
import Mic from '@mui/icons-material/Mic';
import MicOff from '@mui/icons-material/MicOff';
import VolumeDown from '@mui/icons-material/VolumeDown';
import VolumeUp from '@mui/icons-material/VolumeUp';

const MemberSkeleton = () => (
  <ListItem>
    <ListItemAvatar>
      <Skeleton variant="circular" width={40} height={40} />
    </ListItemAvatar>
    <ListItemText primary={<Skeleton variant="text" width="80%" />} />
  </ListItem>
);

const MemberListItem: React.FC<{ participant: Participant, user: User }> = ({ participant, user }) => {
    const isSpeaking = useIsSpeaking(participant);
    const isMuted = useIsMuted({ source: Track.Source.Microphone, participant });
    const [volume, setVolume] = useState(1);
    const tracks = useTracks([Track.Source.Microphone]);
    
    const audioTrack = useMemo(
        () => tracks.find(track => track.participant.identity === participant.identity),
        [tracks, participant.identity]
    );
  
    return (
      <ListItem key={user.id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        {audioTrack && (
            <AudioTrack trackRef={audioTrack} volume={volume} />
        )}
        <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
            <ListItemAvatar>
              <Avatar 
                src={user.avatar || undefined} 
                sx={{
                  border: isSpeaking ? '2px solid #4ade80' : '2px solid transparent',
                  boxShadow: isSpeaking ? '0 0 8px #4ade80' : 'none',
                  transition: 'all 0.2s ease-in-out',
                }}
              />
            </ListItemAvatar>
            <ListItemText 
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.username}
                  </Typography>
                  {isMuted ? <MicOff sx={{ fontSize: 16, color: 'text.secondary' }} /> : <Mic sx={{ fontSize: 16, color: 'text.secondary' }} />}
                </Box>
              } 
            />
        </Box>
        <Stack spacing={2} direction="row" sx={{ width: '100%', px: 2, pt: 1 }} alignItems="center">
            <VolumeDown />
            <Slider 
                aria-label="Volume" 
                value={volume} 
                onChange={(e, newValue) => setVolume(newValue as number)}
                min={0}
                max={1}
                step={0.01}
            />
            <VolumeUp />
        </Stack>
      </ListItem>
    );
};

export const ServerMembers = () => {
  const { members: allServerMembers, areMembersLoading } = useServer();
  const participants = useParticipants();

  const onlineMembers = useMemo(() => {
    const memberMap = new Map(allServerMembers.map(m => [m.user.id, m.user]));
    return participants
      .map(p => ({
        participant: p,
        user: memberMap.get(p.identity)
      }))
      .filter(item => item.user !== undefined) as { participant: Participant, user: User }[];
  }, [allServerMembers, participants]);

  return (
    <Box sx={{ 
      width: 240, 
      borderRight: '1px solid rgba(255, 255, 255, 0.12)', 
      padding: '1rem', 
      color: 'white', 
      background: '#2f3136',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Typography variant="h6" sx={{ marginBottom: '1rem', flexShrink: 0 }}>Участники ({onlineMembers.length})</Typography>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
        <List>
          {areMembersLoading && onlineMembers.length === 0 ? (
            <>
              <MemberSkeleton />
              <MemberSkeleton />
            </>
          ) : (
            onlineMembers.map(({ participant, user }) => (
                <MemberListItem key={participant.sid} participant={participant} user={user} />
            ))
          )}
        </List>
      </Box>
      <Box sx={{ flexShrink: 0, pt: 2 }}>
        <MaterialControlBar />
      </Box>
    </Box>
  );
}; 