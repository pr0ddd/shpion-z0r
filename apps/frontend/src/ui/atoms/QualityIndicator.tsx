import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { useConnectionQualityIndicator } from '@livekit/components-react';
import type { Participant } from 'livekit-client';
import { useLivekitRtt } from '@hooks/useLivekitRtt';

interface QualityIndicatorProps {
  participant: Participant;
}

export const QualityIndicator: React.FC<QualityIndicatorProps> = ({ participant }) => {
  const { quality } = useConnectionQualityIndicator({ participant });
  const rtt = useLivekitRtt(participant);

  const cfg = {
    excellent: { bars: 3, color: 'success.main', label: 'Excellent connection (<50 ms)' },
    good: { bars: 2, color: 'warning.main', label: 'Good connection (≈100 ms)' },
    poor: { bars: 1, color: 'error.main', label: 'Poor connection (>200 ms)' },
    unknown: { bars: 0, color: 'text.disabled', label: 'No data' },
  } as const;

  const q = cfg[(quality ?? 'unknown') as keyof typeof cfg];

  return (
    <Tooltip title={rtt != null ? `${rtt} ms` : q.label} placement="top" arrow>
      <Box sx={{ display: 'flex', gap: '2px', alignItems: 'flex-end' }}>
        {Array.from({ length: 3 }, (_, i) => (
          <Box
            key={i}
            sx={{
              width: 3,
              height: 3 + i * 4,
              borderRadius: 1,
              backgroundColor: i < q.bars ? q.color : 'new.mutedForeground',
            }}
          />
        ))}
      </Box>
    </Tooltip>
  );
}; 