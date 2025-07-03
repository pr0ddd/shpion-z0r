import { Avatar, Box, Chip, Typography } from '@mui/material';
import { dicebearAvatar } from '@shared/lib';
import { Member } from '@shared/types';
import MicOffIcon from '@mui/icons-material/MicOff';
import HeadsetOffIcon from '@mui/icons-material/HeadsetOff';
import { LocalParticipant, RemoteParticipant, Track } from 'livekit-client';
import { AudioTrack, TrackReference, useIsMuted, useIsSpeaking } from '@livekit/components-react';
import { useParticipantMetadata } from '@entities/members/model/useLocalParticipantMetadata';

interface ServerMemberItemProps {
  member: Member | undefined;
  participant: LocalParticipant | RemoteParticipant;
  audioTrack: TrackReference | undefined;
  streamTrack: TrackReference | undefined; // TODO: support multiple streams
}

export const ServerMemberItem: React.FC<ServerMemberItemProps> = ({
  member,
  participant,
  audioTrack,
  streamTrack,
}) => {
  const isSpeaking = useIsSpeaking(participant);
  const isMuted = useIsMuted({ source: Track.Source.Microphone, participant });
  const { getMetadata } = useParticipantMetadata(participant);
  const isVolumeOn = getMetadata('volumeOn') ?? true;

  const participantScreenShares = [];
  const isStreaming = !!streamTrack;

  return (
    <>
      {audioTrack && !audioTrack?.participant.isLocal && (
        <AudioTrack trackRef={audioTrack} volume={isVolumeOn ? 1 : 0} />
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          px: 1,
          py: 1,
          mb: 0.9,
          borderRadius: 1,
          border: '1px solid rgba(255,255,255,0.05)',
          backgroundColor: '#2B2D31',
        }}
      >
        <Avatar
          src={member?.user.avatar || dicebearAvatar(participant?.identity || '')}
          sx={{
            width: 34,
            height: 34,
            border: isSpeaking
              ? '2px solid #4ade80'
              : '1px solid rgba(255, 255, 255, 0.7)',
            boxShadow: isSpeaking ? '0 0 6px #4ade80' : 'none',
            transition: 'all 0.2s ease-in-out',
            backgroundColor: '#2B2D31',
          }}
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
    </>
  );
};
