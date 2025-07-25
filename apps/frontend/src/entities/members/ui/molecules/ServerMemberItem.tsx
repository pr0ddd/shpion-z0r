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
import { useVolumeStore } from '@libs/livekit/hooks/useVolumeStore';
import { VolumeMenu } from '@entities/volumes/ui/VolumeMenu';
import { useParticipantMetadata } from '@entities/members/model/useLocalParticipantMetadata';
import { useState, useRef, useEffect, useCallback } from 'react';
import { volumeAPI } from '@shared/data';
import { useMutation } from '@tanstack/react-query';

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
  const volume = useVolumeStore((s) => s.map[participant.identity] ?? 0.5);
  const setVolume = useVolumeStore((s) => s.setVolume);
  const isSelf = participant.isLocal;

  const { getMetadata } = useParticipantMetadata(participant);
  const isVolumeOn = getMetadata('volumeOn') ?? true;
  const displayStreamCount = totalStreamCount;
  const isOwner = member?.role === 'ADMIN';
  const displayName = member?.user.username || participant.name;

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (isSelf) return; // disable for self
    if (anchorEl) {
      setAnchorEl(null);
    } else {
      setAnchorEl(e.currentTarget);
    }
  };

  const handleClose = () => setAnchorEl(null);

  const { mutate: persistVolume } = useMutation({
    mutationFn: async (v: number) => {
      return await volumeAPI.setPreference(participant.identity, v);
    },
  });

  // --- Debounce persistence ---
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const persistDebounced = useCallback(
    (v: number) => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = setTimeout(() => {
        persistVolume(v);
      }, 300);
    },
    [persistVolume]
  );

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, []);

  const handleSliderChange = (val: number | number[]) => {
    if (isSelf) return; // prevent self-change
    const v = Array.isArray(val) ? val[0] : val;
    const internal = (v as number);
    setVolume(participant.identity, internal);
    persistDebounced(internal);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        borderRadius: 1,
        overflow: 'hidden',
        cursor: isSelf ? 'default' : 'pointer',
        '&:hover': {
          backgroundColor: isSelf ? 'transparent' : 'action.hover',
        },
      }}
      onClick={handleClick}
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
      <VolumeMenu
        open={!isSelf && Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        volume={volume}
        onVolumeChange={handleSliderChange as any}
      />
    </Box>
  );
};
