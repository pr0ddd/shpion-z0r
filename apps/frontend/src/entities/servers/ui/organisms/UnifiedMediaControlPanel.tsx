import React, { useMemo, useEffect, useState } from 'react';
    import { Box, Typography, Chip, Tooltip } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { ConfirmDialog } from '@ui/molecules/ConfirmDialog';
import { useSessionStore } from '@entities/session';
import { useServerStore } from '@entities/server/model';
import { useSettingsDialogStore } from '@entities/settings';
import { SectionAction, SectionActionBar } from '@ui/molecules/SectionActionBar';
import { useLocalParticipant, useRoomContext, useConnectionState, ConnectionState as LKConnectionState } from '@livekit/components-react';
import { useSelectedServerName } from '@hooks/useSelectedServerName';
import { MediaControls, PlaceholderControls } from '@ui/molecules/MediaControls';
import { ActiveStreamsBanner } from '@entities/streams/ui/atoms/ActiveStreamsBanner';
import { QualityIndicator } from '@ui/atoms/QualityIndicator';
import { Avatar } from '@ui/atoms/Avatar';

export const UnifiedMediaControlPanel: React.FC = () => {
  /* ------------ hooks ------------- */
  const user = useSessionStore((s) => s.user);
  const connectionState = useConnectionState();
  const rawServerName = useSelectedServerName();
  const isNameLong = rawServerName ? rawServerName.length > 20 : false;
  const serverName = isNameLong ? `${rawServerName!.slice(0, 16)}…` : rawServerName;
  const toggleSettings = useSettingsDialogStore((s) => s.toggle);
  const { selectedServerId, setSelectedServerId } = useServerStore();
  const [leaveOpen, setLeaveOpen] = useState(false);

  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext(); // needed for status only maybe

  const statusColor = useMemo(() => {
    const colorMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
      connected: 'success',
      connecting: 'warning',
      reconnecting: 'warning',
      disconnected: 'error',
    };
    return colorMap[String(connectionState)] ?? 'info';
  }, [connectionState]);

  const isConnected = connectionState === 'connected';

  /* ------------ session timer ------------- */
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState<string>('00:00');

  // Track connection start
  useEffect(() => {
    if (isConnected && !startTime) {
      setStartTime(new Date());
    }
    if (!isConnected) {
      setStartTime(null);
      setElapsed('00:00');
    }
  }, [isConnected]);

  /* ------------ server actions (invite/settings/leave) ------------- */
  const serverActions: SectionAction[] = [
    {
      key: 'settings',
      icon: <SettingsIcon fontSize="small" />,
      tooltip: 'Settings',
      onClick: () => toggleSettings(),
    },
    {
      key: 'leave',
      icon: <LogoutIcon fontSize="small" />,
      tooltip: 'Leave server',
      danger: true,
      onClick: () => setLeaveOpen(true),
    },
  ];
  return (
    <>
    {/* Wrapper to place banner above control panel */}
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>

      {/* Active Streams Banner displayed above the control panel */}
      <ActiveStreamsBanner />

      {/* Control panel container */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        px: 2,
        py: 1.5,
        backgroundColor: 'new.sidebar',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'new.border',
        width: '100%',
        maxWidth: 480,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>

      {/* User info row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Avatar
          src={user?.avatar || undefined}
          sx={{ width: 36, height: 36 }}
        />
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* first line – username + quality */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
              {user?.username || 'Пользователь'}
            </Typography>
            {isConnected && localParticipant && (
              <QualityIndicator participant={localParticipant} />
            )}
          </Box>

          {/* second line – server name and connection status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25, minWidth: 0 }}>
            {serverName && (
              <Tooltip
                title={isNameLong ? rawServerName : ''}
                disableHoverListener={!isNameLong}
                placement="top-start"
                arrow
                PopperProps={{
                  modifiers: [
                    {
                      name: 'offset',
                      options: { offset: [0, -8] },
                    },
                  ],
                }}
                disableInteractive
              >
                <Typography component="span" variant="caption" noWrap sx={{ color: 'text.secondary', display: 'inline-block' }}>
                  {serverName}
                </Typography>
              </Tooltip>
            )}
            <Chip
              label={<LKConnectionState />}
              color={statusColor}
              size="small"
              sx={{ height: 18, fontSize: '0.7rem' }}
            />
          </Box>
        </Box>
        {/* Action buttons inline */}
        <Box sx={{ ml: 'auto' }}>
          <SectionActionBar actions={serverActions} />
        </Box>
      </Box>

      {/* Controls row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
        {isConnected ? (
          <MediaControls
            userId={user?.id}
            onOpenSettings={toggleSettings}
            onLeave={() => setSelectedServerId(null)}
          />
        ) : (
          <PlaceholderControls />
        )}
      </Box>
    </Box>

    {/* Close wrapper */}
    </Box>

    {/* Leave confirmation dialog */}
    <ConfirmDialog
      open={leaveOpen}
      title="Leave server?"
      description="Are you sure you want to leave this server?"
      confirmLabel="Leave"
      cancelLabel="Cancel"
      danger
      onClose={() => setLeaveOpen(false)}
      onConfirm={() => {
        setLeaveOpen(false);
        setSelectedServerId(null);
      }}
    />
    </>
  );
};