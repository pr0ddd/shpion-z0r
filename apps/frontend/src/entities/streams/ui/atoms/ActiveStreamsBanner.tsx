import React from 'react';
import { Paper, Typography, Box, Tooltip } from '@mui/material';
import DesktopAccessDisabledIcon from '@mui/icons-material/DesktopAccessDisabled';
import { SmallIconButton } from '@ui/atoms/SmallIconButton';
import { DotIndicator } from '@ui/atoms/DotIndicator';

import { useStream } from '@entities/streams/model/useStream';
import { useScreenShare } from '@entities/members/model/useScreenShare';
import { useSessionStore } from '@entities/session/model/auth.store';

export const ActiveStreamsBanner: React.FC = () => {
  const { streamTracks } = useStream();
  const userId = useSessionStore((s)=>s.user?.id);
  const myTracks = streamTracks.filter(t=>t.participant.identity===userId);
  const count = myTracks.length;
  const { stopAll: stopAllScreenShare } = useScreenShare();
  if (count === 0) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: 480,
        px: 2,
        py: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        bgcolor: 'new.sidebar', // match control panel background
        border: '1px solid',
        borderColor: 'new.border',
        borderRadius: 1,
      }}
    >
      <DotIndicator size={8} withBorder={false} />
      <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary' }}>
        {count} active stream{count === 1 ? '' : 's'}
      </Typography>
      <Box sx={{ flexGrow: 1 }} />
      <Tooltip title="Stop all streams" placement="top" arrow>
        <SmallIconButton
          onClick={() => stopAllScreenShare()}
          sx={{
            backgroundColor: 'new.redLight',
            color: 'new.mutedForeground',
            '&:hover': {
              backgroundColor: 'new.redLight',
              color: 'new.primaryForeground',
            },
          }}
        >
          <DesktopAccessDisabledIcon />
        </SmallIconButton>
      </Tooltip>
    </Paper>
  );
}; 