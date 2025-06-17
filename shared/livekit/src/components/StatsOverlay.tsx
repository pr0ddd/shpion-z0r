import React from 'react';
import { Room } from 'livekit-client';
import { useRtcStats } from '../hooks/useRtcStats';
import { useRoomContext } from '@livekit/components-react';

interface StatsOverlayProps {
  room?: Room | null;
}

export const StatsOverlay: React.FC<StatsOverlayProps> = ({ room }) => {
  const contextRoom = useRoomContext?.();
  const stats = useRtcStats(room ?? contextRoom ?? null, 2000);

  if (!stats) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 90,
        right: 8,
        fontSize: 12,
        background: 'rgba(0,0,0,0.6)',
        color: '#fff',
        padding: '6px 8px',
        borderRadius: 4,
        zIndex: 5000,
        fontFamily: 'monospace',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {stats.bitrateKbps} kbps&nbsp;|&nbsp;
      {stats.fps} fps&nbsp;|&nbsp;
      loss {stats.packetLoss}%&nbsp;|&nbsp;
      RTT {stats.rtt} ms
      {stats.simulcastLayer && ` | layer ${stats.simulcastLayer}`}
      {stats.qualityLimitation && ` | limit ${stats.qualityLimitation}`}
      {stats.width && stats.height && ` | ${stats.width}×${stats.height}`}
    </div>
  );
}; 