import { useEffect, useState } from 'react';
import type { Participant } from 'livekit-client';

/**
 * useLivekitRtt – periodically fetches RTT (round-trip time in ms) for a participant
 * using WebRTC stats API available on a published local track.
 *
 * @param participant LiveKit participant (local)
 * @param interval polling interval, ms. default 4000
 */
export const useLivekitRtt = (participant?: Participant, interval = 4000) => {
  const [rtt, setRtt] = useState<number | null>(null);

  useEffect(() => {
    if (!participant) return;
    let timer: ReturnType<typeof setInterval>;

    const update = async () => {
      try {
        // pick first track that supports getRTCStatsReport()
        const pubs = Array.from(participant.trackPublications.values());
        const firstPub = pubs.find(
          (p: any) => p.track && typeof (p.track as any).getRTCStatsReport === 'function',
        );
        if (!firstPub) return;
        const report: RTCStatsReport | undefined = await (firstPub.track as any).getRTCStatsReport?.();
        if (!report) return;
        report.forEach((stat: any) => {
          if ('roundTripTime' in stat && typeof stat.roundTripTime === 'number') {
            setRtt(Math.round(stat.roundTripTime * 1000));
          } else if (
            'currentRoundTripTime' in stat &&
            typeof stat.currentRoundTripTime === 'number'
          ) {
            setRtt(Math.round(stat.currentRoundTripTime * 1000));
          }
        });
      } catch {
        /* ignore */
      }
    };

    update();
    timer = setInterval(update, interval);
    return () => clearInterval(timer);
  }, [participant, interval]);

  return rtt;
}; 