import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, SwipeableDrawer, useTheme } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import SettingsIcon from '@mui/icons-material/Settings';
import { ChatMessages } from '@entities/chat';
import { StreamsTemplate } from '@entities/streams/ui';
import { useScreenShare } from '@entities/members/model/useScreenShare';
import { useLocalParticipantCamera } from '@entities/members/model/useLocalParticipantCamera';
import { useLocalParticipantMic } from '@entities/members/model/useLocalParticipantMic';
import { useLocalParticipantVolume } from '@entities/members/model/useLocalParticipantVolume';
import { useSettingsDialogStore, SettingsDialog, GlobalHotkeys } from '@entities/settings';
import { useSessionStore } from '@entities/session';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useServerStore } from '@entities/server/model';
import { CameraPIP } from '@ui/molecules/CameraPIP';

export const MobileBottomBar: React.FC = () => {
  const theme = useTheme();
  const [mobileSheet, setMobileSheet] = useState<'chat' | 'streams' | null>(null);

  // LiveKit / state hooks
  const user = useSessionStore((s) => s.user);
  const { startNew: startScreenShare, stopAll: stopAllScreenShare } = useScreenShare();
  const { toggleCameraEnabled, isCameraEnabled } = useLocalParticipantCamera();
  const { isMicEnabled, toggleMicEnabled } = useLocalParticipantMic();
  const { isVolumeEnabled, toggleVolumeEnabled } = useLocalParticipantVolume();
  const toggleSettings = useSettingsDialogStore((s) => s.toggle);
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const { setSelectedServerId } = useServerStore();

  useEffect(() => {
    if (!isCameraEnabled) {
      return;
    }
    const camPub = localParticipant?.getTrackPublication(Track.Source.Camera);
    const mediaTrack = camPub?.track?.mediaStreamTrack as MediaStreamTrack | undefined;
    if (mediaTrack) {
      const stream = new MediaStream([mediaTrack]);
      // videoRef.current.srcObject = stream; // This line is removed
      // videoRef.current.play().catch(() => {}); // This line is removed
    }
  }, [isCameraEnabled, localParticipant]);

  const handleStartScreen = () => startScreenShare(user?.id ?? 'unknown');
  const handleStartCamera = () => {
    if (!isCameraEnabled) toggleCameraEnabled();
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

  const buttons = [
    { label: 'Chat', icon: <ChatIcon />, onClick: () => setMobileSheet('chat') },
    { label: 'Streams', icon: <VideocamIcon />, onClick: () => setMobileSheet('streams') },
    {
      label: 'Camera',
      icon: <VideocamIcon />,
      onClick: () => {
        if (isCameraEnabled) {
          handleStopAll();
        } else {
          handleStartCamera();
        }
      },
    },
    { label: 'Mic', icon: isMicEnabled ? <MicIcon /> : <MicOffIcon />, onClick: toggleMicEnabled },
    { label: 'Vol', icon: isVolumeEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />, onClick: toggleVolumeEnabled },
    { label: 'Settings', icon: <SettingsIcon />, onClick: toggleSettings },
  ];

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar,
          backgroundColor: 'new.card',
          borderTop: '1px solid',
          borderColor: 'new.border',
          display: 'flex',
        }}
      >
        {buttons.map((btn, idx) => {
          const active = btn.label === 'Camera' && isCameraEnabled;
          return (
          <Box
            key={idx}
            component="button"
            onClick={btn.onClick}
            sx={{
              flex: 1,
              py: 1,
              background: 'unset',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              color: active ? 'success.main' : 'new.foreground',
              '& svg': { color: active ? 'success.main' : 'new.foreground' },
            }}
          >
            {btn.icon}
            <span style={{ fontSize: 12 }}>{btn.label}</span>
          </Box>
          );
        })}
      </Box>

      {/* Camera PIP preview */}
      {isCameraEnabled && (
        <CameraPIP />
      )}

      <SwipeableDrawer
        anchor="bottom"
        open={mobileSheet === 'chat'}
        onClose={() => setMobileSheet(null)}
        onOpen={() => setMobileSheet('chat')}
        disableSwipeToOpen={false}
        ModalProps={{ keepMounted: true }}
        slotProps={{ paper: { sx: { height: '75vh' } } }}
      >
        <ChatMessages />
      </SwipeableDrawer>

      <SwipeableDrawer
        anchor="bottom"
        open={mobileSheet === 'streams'}
        onClose={() => setMobileSheet(null)}
        onOpen={() => setMobileSheet('streams')}
        disableSwipeToOpen={false}
        ModalProps={{ keepMounted: true }}
        slotProps={{ paper: { sx: { height: '85vh' } } }}
      >
        <StreamsTemplate />
      </SwipeableDrawer>

      <SettingsDialog />
      <GlobalHotkeys />
    </>
  );
}; 