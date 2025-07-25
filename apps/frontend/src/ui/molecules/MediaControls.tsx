import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import MonitorIcon from '@mui/icons-material/Monitor';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import SettingsIcon from '@mui/icons-material/Settings';
import DesktopAccessDisabledIcon from '@mui/icons-material/DesktopAccessDisabled';
import LogoutIcon from '@mui/icons-material/Logout';
import { useScreenShare } from '@entities/members/model/useScreenShare';
import { useLocalParticipantCamera } from '@entities/members/model/useLocalParticipantCamera';
import { useLocalParticipantMic } from '@entities/members/model/useLocalParticipantMic';
import { useLocalParticipantVolume } from '@entities/members/model/useLocalParticipantVolume';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useMediaQuery, useTheme, SwipeableDrawer } from '@mui/material';
import { StreamsTemplate } from '@entities/streams/ui';
import { CameraPIP } from '@ui/molecules/CameraPIP';

/* --------------------------------------------------
 * MediaControls – buttons enabled only when connected
 * -------------------------------------------------- */
export interface MediaControlsProps {
  userId?: string;
  onLeave: () => void;
  onOpenSettings: () => void;
}

export const MediaControls: React.FC<MediaControlsProps> = ({ userId, onLeave, onOpenSettings }) => {
  const {
    startNew: startScreenShare,
    stopAll: stopAllScreenShare,
    enabled: isScreenShareActive,
  } = useScreenShare();
  const { toggleCameraEnabled, isCameraEnabled } = useLocalParticipantCamera();
  const { isMicEnabled, toggleMicEnabled } = useLocalParticipantMic();
  const { isVolumeEnabled, toggleVolumeEnabled } = useLocalParticipantVolume();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('mobile'));
  const [streamsDrawer, setStreamsDrawer] = React.useState(false);

  const handleStartScreenShare = () => {
    if (isMobile) {
      setStreamsDrawer(true);
    } else {
      startScreenShare(userId ?? 'unknown');
    }
  };

  const handleCameraClick = () => {
    if (isCameraEnabled) {
      // Stop camera publication
      if (room && localParticipant) {
        localParticipant.trackPublications.forEach((pub) => {
          if (pub.source === Track.Source.Camera && pub.track) {
            room.localParticipant.unpublishTrack(pub.track);
            pub.track.stop();
          }
        });
      }
      toggleCameraEnabled();
    } else {
      toggleCameraEnabled();
    }
  };
  const handleStopAll = () => {
    stopAllScreenShare();
    if (room && localParticipant) {
      localParticipant.trackPublications.forEach((pub) => {
        if (pub.source === Track.Source.Camera && pub.track) {
          room.localParticipant.unpublishTrack(pub.track);
          pub.track.stop();
        }
      });
    }
    if (isCameraEnabled) toggleCameraEnabled();
  };

  const buttonBaseStyle = {
    minWidth: 60,
    height: 32,
    maxHeight: 32,
    border: '1px solid',
    borderColor: 'new.border',
    borderRadius: 1, // rectangular with subtle rounding
    margin: 0,
    '&.MuiIconButton-root': {
      height: 32,
      maxHeight: 32,
      padding: 0,
    },
    '& .MuiSvgIcon-root': {
      fontSize: '1.2rem',
    },
  } as const;

  const stopAllDisabled = isMobile || (!isScreenShareActive && !isCameraEnabled);

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      {/* Mic */}
      <Tooltip title={isMicEnabled ? 'Mute' : 'Unmute'} placement="top" arrow>
        <IconButton
          onClick={toggleMicEnabled}
          sx={{
            ...buttonBaseStyle,
            backgroundColor: isMicEnabled ? 'new.muted' : 'new.redLight',
            color: isMicEnabled ? 'new.mutedForeground' : 'new.primaryForeground',
            '&:hover': {
              backgroundColor: isMicEnabled ? 'new.hover' : 'new.redLight',
            },
          }}
        >
          {isMicEnabled ? <MicIcon /> : <MicOffIcon />}
        </IconButton>
      </Tooltip>

      {/* Volume */}
      <Tooltip title={isVolumeEnabled ? 'Mute Volume' : 'Unmute Volume'} placement="top" arrow>
        <IconButton
          onClick={toggleVolumeEnabled}
          sx={{
            ...buttonBaseStyle,
            backgroundColor: isVolumeEnabled ? 'new.muted' : 'new.redLight',
            color: isVolumeEnabled ? 'new.mutedForeground' : 'new.primaryForeground',
            '&:hover': {
              backgroundColor: isVolumeEnabled ? 'new.hover' : 'new.redLight',
            },
          }}
        >
          {isVolumeEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
        </IconButton>
      </Tooltip>

      <Box sx={{ width: '1px', height: 24, backgroundColor: 'new.border', mx: 0.5 }} />

      {/* Screen share */}
      <Tooltip title={isMobile ? 'View Streams' : 'Share Screen'} placement="top" arrow>
        <IconButton
          onClick={handleStartScreenShare}
          sx={{
            ...buttonBaseStyle,
            backgroundColor: isScreenShareActive ? 'new.green' : 'new.muted',
            color: isScreenShareActive ? 'new.primaryForeground' : 'new.mutedForeground',
            '&:hover': { backgroundColor: isScreenShareActive ? 'new.green' : 'new.hover' },
          }}
        >
          <MonitorIcon />
        </IconButton>
      </Tooltip>

      {/* Camera */}
      <Tooltip title={isCameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'} placement="top" arrow>
        <IconButton
          onClick={handleCameraClick}
          sx={{
            ...buttonBaseStyle,
            backgroundColor: isCameraEnabled ? 'new.green' : 'new.muted',
            color: isCameraEnabled ? 'new.primaryForeground' : 'new.mutedForeground',
            '&:hover': {
              backgroundColor: isCameraEnabled ? 'new.redLight' : 'new.hover',
            },
            '& .camera-icon-off': { display: 'none' },
            '&:hover .camera-icon-on': { display: 'none' },
            '&:hover .camera-icon-off': { display: 'block' },
          }}
        >
          {isCameraEnabled ? (
            <>
              <VideocamIcon className="camera-icon-on" />
              <VideocamOffIcon className="camera-icon-off" />
            </>
          ) : (
            <VideocamOffIcon />
          )}
        </IconButton>
      </Tooltip>

      {/* Stop all */}
      <Tooltip title="Stop All" placement="top" arrow>
        <IconButton
          onClick={handleStopAll}
          sx={{
            ...buttonBaseStyle,
            backgroundColor: 'new.muted',
            color: 'new.mutedForeground',
            '&:hover': { backgroundColor: 'new.redLight', color: 'new.primaryForeground' },
          }}
          disabled={stopAllDisabled}
        >
          <DesktopAccessDisabledIcon />
        </IconButton>
      </Tooltip>
      {isMobile && (
        <SwipeableDrawer
          anchor="bottom"
          open={streamsDrawer}
          onOpen={() => setStreamsDrawer(true)}
          onClose={() => setStreamsDrawer(false)}
          swipeAreaWidth={20}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { height: '80vh', backgroundColor: 'new.background' } }}
        >
          <StreamsTemplate />
        </SwipeableDrawer>
      )}
      {isMobile && isCameraEnabled && <CameraPIP />}
    </Box>
  );
};

/* ---------------------------- Disabled stub ---------------------------- */
export const PlaceholderControls: React.FC = () => {
  const base = {
    minWidth: 60,
    height: 32,
    maxHeight: 32,
    border: '1px solid',
    borderColor: 'new.border',
    borderRadius: 1, // rectangular with subtle rounding
    margin: 0,
    '&.MuiIconButton-root': {
      height: 32,
      maxHeight: 32,
      padding: 0,
    },
    '& .MuiSvgIcon-root': {
      fontSize: '1.2rem',
    },
  } as const;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      {/* Mic */}
      <IconButton disabled sx={base}><MicIcon /></IconButton>
      {/* Volume */}
      <IconButton disabled sx={base}><VolumeUpIcon /></IconButton>

      <Box sx={{ width: '1px', height: 24, backgroundColor: 'new.border', mx: 0.5 }} />

      {/* Screen share */}
      <IconButton disabled sx={base}><MonitorIcon /></IconButton>
      {/* Camera */}
      <IconButton disabled sx={base}><VideocamIcon /></IconButton>
      {/* Stop all */}
      <IconButton disabled sx={base}><DesktopAccessDisabledIcon /></IconButton>



    </Box>
  );
}; 