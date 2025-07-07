import { Box, Typography } from '@mui/material';
import { dicebearAvatar } from '@libs/dicebearAvatar';
import { Member } from '@shared/types';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { Avatar } from '@ui/atoms/Avatar';

import { LocalParticipant, RemoteParticipant, Track } from 'livekit-client';
import {
  useIsMuted,
  useIsSpeaking,
} from '@livekit/components-react';
import { useParticipantMetadata } from '@entities/members/model/useLocalParticipantMetadata';

interface ServerMemberItemProps {
  member: Member | undefined;
  participant: LocalParticipant | RemoteParticipant;
  cameraCount: number; // number of active camera video tracks
  totalStreamCount: number; // camera + screen shares
  isStreaming: boolean; // any video stream
}

export const ServerMemberItem: React.FC<ServerMemberItemProps> = ({
  member,
  participant,
  cameraCount,
  totalStreamCount,
  isStreaming,
}) => {
  const isSpeaking = useIsSpeaking(participant);
  const isMuted = useIsMuted({ source: Track.Source.Microphone, participant });
  const { getMetadata } = useParticipantMetadata(participant);
  const isVolumeOn = getMetadata('volumeOn') ?? true;
  const displayStreamCount = totalStreamCount;
  const isOwner = member?.role === 'ADMIN';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        borderRadius: 1,
        overflow: 'hidden',
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
    >
      {/* Avatar with streaming indicator */}
      <Box sx={{ position: 'relative' }}>
        <Avatar
          src={member?.user.avatar || dicebearAvatar(participant?.identity || '')}
          borderColor={isSpeaking ? 'new.green' : 'new.border'}
          borderWidth={isSpeaking ? 3 : 1}
        />
        {isStreaming && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: 'error.main',
              border: '2px solid',
              borderColor: 'background.paper',
              '@keyframes pulse': {
                '0%, 100%': {
                  transform: 'scale(1)',
                  opacity: 1,
                },
                '50%': {
                  transform: 'scale(1.25)',
                  opacity: 0.6,
                },
              },
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        )}
      </Box>

      {/* Name & stream info */}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
          <Typography
            variant="body2"
            noWrap
            sx={{ color: 'text.primary', fontWeight: 500, flexShrink: 1 }}
          >
            {participant.name}
          </Typography>
          {isOwner && (
            <WorkspacePremiumIcon sx={{ fontSize: 14, color: 'warning.main', flexShrink: 0 }} />
          )}
        </Box>
        {displayStreamCount > 0 && (
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary' }}
          >
            {displayStreamCount} стрим{displayStreamCount > 1 ? 'а' : ''}
          </Typography>
        )}
      </Box>

      {/* Status icons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {cameraCount > 0 ? (
          <VideocamIcon fontSize="small" sx={{ color: 'success.main' }} />
        ) : (
          <VideocamOffIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        )}

        {isMuted ? (
          <MicOffIcon fontSize="small" sx={{ color: 'error.main' }} />
        ) : (
          <MicIcon fontSize="small" sx={{ color: 'success.main' }} />
        )}

        {isVolumeOn ? (
          <VolumeUpIcon fontSize="small" sx={{ color: 'success.main' }} />
        ) : (
          <VolumeOffIcon fontSize="small" sx={{ color: 'error.main' }} />
        )}
      </Box>
    </Box>
  );
};
