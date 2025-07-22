import { Box, Typography, useTheme } from '@mui/material';
import LobbyButton from '../molecules/LobbyButton';
import ServersList from '../organisms/ServersList';
import CreateServerButton from '../molecules/CreateServerButton';
// import LogoutButton from '@entities/session/ui/molecules/LogoutButton';
import { MediaControlPanel } from '@entities/server';
import { StreamControlPanel } from '@entities/streams/ui';
import { useScreenShare } from '@entities/members/model/useScreenShare';
import { useSessionStore } from '@entities/session';
import { useLocalParticipantCamera } from '@entities/members/model/useLocalParticipantCamera';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useServersQuery } from '@entities/servers/api';
import { useState } from 'react';

// Controls subsection separated to safely use LiveKit hooks only when rendered inside LiveKitRoom
const MediaControlsSection: React.FC = () => {
  const user = useSessionStore((s) => s.user);
  const { startNew, stopAll: stopAllScreenShare } = useScreenShare();
  const { toggleCameraEnabled, isCameraEnabled } = useLocalParticipantCamera();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  const handleStartScreenShare = () => startNew(user?.id ?? 'unknown');
  const handleStartCamera = () => {
    if (!isCameraEnabled) toggleCameraEnabled();
  };
  const handleStopAll = () => {
    stopAllScreenShare();

    if (!room || !localParticipant) return;

    // Stop camera tracks immediately
    localParticipant.trackPublications.forEach((pub) => {
      if (pub.source === Track.Source.Camera && pub.track) {
        room.localParticipant.unpublishTrack(pub.track);
        pub.track.stop();
      }
    });

    if (isCameraEnabled) toggleCameraEnabled();
  };

  return (
    <>
      <StreamControlPanel
        onStartScreenShare={handleStartScreenShare}
        onStartCamera={handleStartCamera}
        onStopAll={handleStopAll}
      />
      <MediaControlPanel />
    </>
  );
};

export const ServersTemplate: React.FC<{ showControls?: boolean }> = ({ showControls = false }) => {
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const theme = useTheme();
  const bgDark = 'linear-gradient(135deg, #111827 0%, #1f2937 100%)';
  const bgLight = 'linear-gradient(135deg, #ffffff 0%, #f7f7f7 100%)';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'new.card',
        borderRight: '1px solid',
        borderColor: 'new.border',
        width: '260px',
        flexShrink: 0,
        pb: 2
      }}
    >
      {/* Header */}
      <HeaderSection />

      {/* Quick access buttons removed; Lobby in header */}

      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, px: 1, minHeight:0 }}>
        <Box sx={{ flex:1, overflowY:'auto', minHeight:0 }}>
          <ServersList />
        </Box>
        <Box sx={{ mt: 'auto', pt: 2, width:'100%' }}>
          {showControls && (
            <Box
              sx={{
                border:'1px solid',
                borderColor:'new.border',
                borderRadius:2,
                background: theme.palette.mode === 'dark' ? bgDark : bgLight,
                overflow:'hidden',
              }}
            >
              <MediaControlsSection />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

const HeaderSection: React.FC = () => {
  const { data: servers } = useServersQuery();
  const totalMembers = servers?.reduce((sum, s) => sum + (s._count?.members ?? 0), 0) || 0;

  return (
    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'new.border' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Servers
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Choose your workspace
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <LobbyButton />
          <CreateServerButton />
        </Box>
      </Box>
    </Box>
  );
};

// removed ConditionalMediaControls – logic moved to parent
