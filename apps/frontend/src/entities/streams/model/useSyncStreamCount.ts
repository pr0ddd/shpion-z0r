import { useEffect } from 'react';
import { useStream } from './useStream';
import { useServerStore } from '@entities/server/model';
import { useServerActivity } from '@entities/servers/model/useServerActivity';

/**
 * Syncs current stream count in the active server to sidebar store.
 * Works only for the server that user is currently connected to (LiveKitRoom).
 */
export const useSyncStreamCount = () => {
  const { streamTracks } = useStream();
  const selectedServerId = useServerStore((s) => s.selectedServerId);
  const { setStreamCount } = useServerActivity();

  useEffect(() => {
    if (!selectedServerId) return;
    // debug
    console.debug('sync stream count', selectedServerId, streamTracks.length);
    setStreamCount(selectedServerId, streamTracks.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServerId, streamTracks.length]);
}; 