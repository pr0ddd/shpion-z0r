import { Room } from 'livekit-client';
import { useEffect, useState } from 'react';

export interface RtcStats {
  bitrateKbps: number;
  fps: number;
  packetLoss: number;
  rtt: number;
  simulcastLayer?: string;
  qualityLimitation?: string;
  width: number;
  height: number;
}

/**
 * Collect outbound video RTP stats from the underlying RTCPeerConnection.
 * Works for Chrome / Edge / Firefox. Safari lacks some fields but basic bitrate will still show.
 */
export function useRtcStats(room: Room | null, interval = 2000): RtcStats | null {
  const [stats, setStats] = useState<RtcStats | null>(null);

  useEffect(() => {
    if (!room) return;

    // Try multiple internal paths – LiveKit's internals shift between versions.
    // 1. engine.client.pc (<= v2.0)
    // 2. engine.pcManager.publisher._pc (>= v2.2)
    // 3. engine.pcManager.subscriber._pc (fallback)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pc: RTCPeerConnection | undefined = (room as any)?.engine?.client?.pc;
    if (!pc) {
      const pub = (room as any)?.engine?.pcManager?.publisher;
      pc = pub?._pc ?? pub?.pc; // private via underscore or getter
    }
    if (!pc) {
      const sub = (room as any)?.engine?.pcManager?.subscriber;
      pc = sub?._pc ?? sub?.pc;
    }

    if (!pc) {
      // eslint-disable-next-line no-console
      console.warn('[useRtcStats] PeerConnection not found via known paths');
      return;
    }

    let lastBytes = 0;
    let lastFrames = 0;
    let lastTs = performance.now();
    let width = 0;
    let height = 0;

    const id = window.setInterval(async () => {
      const report = await pc.getStats();
      let bytes = 0;
      let frames = 0;
      let packetsLost = 0;
      let packetsSent = 0;
      let rttMs = 0;
      let layer = '';
      let qualityLimitation: string | undefined;

      report.forEach((s) => {
        // outbound-rtp stats for video
        if (s.type === 'outbound-rtp' && (s as any).kind === 'video') {
          bytes += (s as any).bytesSent ?? 0;
          frames += (s as any).framesEncoded ?? 0;
          packetsLost += (s as any).packetsLost ?? 0;
          packetsSent += (s as any).packetsSent ?? 0;
          layer = (s as any).rid ?? layer;
          qualityLimitation = (s as any).qualityLimitationReason ?? qualityLimitation;
          width = (s as any).frameWidth ?? width;
          height = (s as any).frameHeight ?? height;
        }
        // candidate pair (Chrome) or remote-inbound-rtp (Firefox) for RTT
        if (s.type === 'candidate-pair' && (s as any).state === 'succeeded') {
          rttMs = ((s as any).currentRoundTripTime ?? 0) * 1000;
        }
      });

      const now = performance.now();
      const elapsedSec = (now - lastTs) / 1000;
      const bitrate = elapsedSec > 0 ? ((bytes - lastBytes) * 8) / elapsedSec / 1000 : 0;
      const fps = elapsedSec > 0 ? (frames - lastFrames) / elapsedSec : 0;
      const loss = packetsSent > 0 ? (packetsLost / packetsSent) * 100 : 0;

      setStats({
        bitrateKbps: Math.round(bitrate),
        fps: Math.round(fps),
        packetLoss: parseFloat(loss.toFixed(2)),
        rtt: Math.round(rttMs),
        simulcastLayer: layer,
        qualityLimitation,
        width,
        height,
      });

      // debug log once every interval
      if ((import.meta as any).env?.DEV) {
        console.debug('[RtcStats]', {
          bitrateKbps: Math.round(bitrate),
          fps: Math.round(fps),
          width,
          height,
          layer,
          qualityLimitation,
        });
      }

      lastBytes = bytes;
      lastFrames = frames;
      lastTs = now;
    }, interval);

    return () => {
      clearInterval(id);
    };
  }, [room, interval]);

  return stats;
} 