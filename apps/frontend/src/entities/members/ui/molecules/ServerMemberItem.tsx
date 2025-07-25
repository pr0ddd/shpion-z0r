import { Box, Typography } from '@mui/material';
import { Member } from '@shared/types';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { Avatar } from '@ui/atoms/Avatar';
import { DotIndicator } from '@ui/atoms/DotIndicator';

import { LocalParticipant, RemoteParticipant, Track } from 'livekit-client';
import { useIsMuted } from '@livekit/components-react';
import { useFastIsSpeaking } from '@libs/livekit/hooks/useFastIsSpeaking';
import { useParticipantMetadata } from '@entities/members/model/useLocalParticipantMetadata';

interface ServerMemberItemProps {
  member: Member | undefined;
  participant: LocalParticipant | RemoteParticipant;
  totalStreamCount: number; // video streams (camera + screen share)
  isStreaming: boolean; // any video stream
}

export const ServerMemberItem: React.FC<ServerMemberItemProps> = ({
  member,
  participant,
  totalStreamCount,
  isStreaming,
}) => {
  const isSpeaking = useFastIsSpeaking(participant);
  const isMuted = useIsMuted({ source: Track.Source.Microphone, participant });
  const { getMetadata } = useParticipantMetadata(participant);
  const isVolumeOn = getMetadata('volumeOn') ?? true;
  const displayStreamCount = totalStreamCount;
  const isOwner = member?.role === 'ADMIN';
  const displayName = member?.user.username || participant.name;

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
      <Box sx={{ position: 'relative'}}>
        <Avatar
          src={member?.user.avatar || undefined}
          sx={{ 
            width: 32, 
            height: 32,
            border: isSpeaking ? '2px solid' : '1px solid',
            borderColor: isSpeaking ? 'success.main' : 'new.border',
          }}
        />
        {isStreaming && (
          <DotIndicator sx={{ position: 'absolute', bottom: 0, right: 0 }} withBorder />
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
            {displayName}
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
            {displayStreamCount} stream{displayStreamCount > 1 ? 's' : ''}
          </Typography>
        )}
      </Box>

      {/* Status icons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
