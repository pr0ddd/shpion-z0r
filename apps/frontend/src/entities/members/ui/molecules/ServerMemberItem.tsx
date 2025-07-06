import { Box, Chip, Typography } from '@mui/material';
import { dicebearAvatar } from '@shared/lib';
import { Member } from '@shared/types';
import MicOffIcon from '@mui/icons-material/MicOff';
import HeadsetOffIcon from '@mui/icons-material/HeadsetOff';
import { Avatar } from '@ui/atoms/Avatar';

import { LocalParticipant, RemoteParticipant, Track } from 'livekit-client';
import {
  TrackReference,
  useIsMuted,
  useIsSpeaking,
} from '@livekit/components-react';
import { useParticipantMetadata } from '@entities/members/model/useLocalParticipantMetadata';

interface ServerMemberItemProps {
  member: Member | undefined;
  participant: LocalParticipant | RemoteParticipant;
  streamTrack: TrackReference | undefined; // TODO: use metadata to get isStreaming
}

export const ServerMemberItem: React.FC<ServerMemberItemProps> = ({
  member,
  participant,
  streamTrack,
}) => {
  const isSpeaking = useIsSpeaking(participant);
  const isMuted = useIsMuted({ source: Track.Source.Microphone, participant });
  const { getMetadata } = useParticipantMetadata(participant);
  const isVolumeOn = getMetadata('volumeOn') ?? true;

  const participantScreenShares = [];
  const isStreaming = !!streamTrack;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <Avatar
        src={member?.user.avatar || dicebearAvatar(participant?.identity || '')}
        borderColor={isSpeaking ? 'new.green' : 'new.border'}
        borderWidth={isSpeaking ? 3 : 1}
      />
      <Box sx={{ ml: 1, flexGrow: 1, overflow: 'hidden' }}>
        <Typography
          variant="body2"
          noWrap
          sx={{ color: 'text.primary', fontWeight: 500 }}
        >
          {participant.name}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          ml: 'auto',
          mr: 1,
        }}
      >
        {isStreaming && (
          <Chip
            label={`В эфире${
              participantScreenShares.length > 1
                ? ` (${participantScreenShares.length})`
                : ''
            }`}
            size="small"
            color="error"
          />
        )}
        {isMuted && (
          <MicOffIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        )}
        {!isVolumeOn && (
          <HeadsetOffIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        )}
      </Box>
    </Box>
  );
};
