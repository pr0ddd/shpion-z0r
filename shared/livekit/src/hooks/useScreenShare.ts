import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { Room, LocalVideoTrack, LocalAudioTrack, Track } from 'livekit-client';
import { livekitAPI } from '@shared/data';
import { useServer } from '@shared/hooks';

// --- Internal manager (singleton) --------------------------------------------------

type ShareEntry = {
  room: Room;
  instance: number; // 0..2
};

class ScreenShareManager {
  private shares: ShareEntry[] = [];
  private listeners = new Set<() => void>();

  isEnabled() {
    return this.shares.length > 0;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  get count() {
    return this.shares.length;
  }

  async start(serverId: string, serverUrl: string): Promise<void> {
    if (this.shares.length >= 3) return; // limit

    const instance = this.shares.length; // 0..2
    const tokenRes = await livekitAPI.getVoiceToken(serverId, instance);
    if (!tokenRes.success || !tokenRes.data) throw new Error('Failed to obtain LiveKit token');

    // capture display media – try with audio, fallback to video-only if user/browser denies audio capture
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') {
        // retry without audio (video-only) so at least screen is shared
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
          // eslint-disable-next-line no-console
          console.warn('[ScreenShare] Audio capture unavailable, sharing screen without sound:', err);
        } catch (err2) {
          // user may have denied the entire capture; propagate but log nicely
          console.error('[ScreenShare] User denied screen capture:', err2);
          throw err2;
        }
      } else {
        throw err;
      }
    }
    const videoTrack = new LocalVideoTrack(stream.getVideoTracks()[0]);
    let audioTrack: LocalAudioTrack | undefined;
    if (stream.getAudioTracks().length) {
      audioTrack = new LocalAudioTrack(stream.getAudioTracks()[0]);
    }

    const room = new Room();
    await room.connect(serverUrl, tokenRes.data.token, { autoSubscribe: false });

    await room.localParticipant.publishTrack(videoTrack, { source: Track.Source.ScreenShare });
    if (audioTrack) {
      try {
        await room.localParticipant.publishTrack(audioTrack, { source: Track.Source.ScreenShareAudio });
      } catch (e) {
        // some browsers may still reject publishing audio track
        // eslint-disable-next-line no-console
        console.warn('[ScreenShare] Failed to publish audio track:', e);
      }
    }

    // when user stops sharing via browser UI
    stream.getVideoTracks()[0].addEventListener('ended', () => {
      this.stop(instance);
    });

    this.shares.push({ room, instance });
    this.emit();
  }

  list() {
    return this.shares.map((s) => s.instance);
  }

  stop(instance?: number) {
    if (instance === undefined) {
      // stop all
      this.shares.forEach((s) => s.room.disconnect());
      this.shares = [];
    } else {
      const idx = this.shares.findIndex((s) => s.instance === instance);
      if (idx !== -1) {
        this.shares[idx].room.disconnect();
        this.shares.splice(idx, 1);
      }
    }
    this.emit();
  }
}

const manager = new ScreenShareManager();

// --- React hook --------------------------------------------------------------------

export const useScreenShare = () => {
  const { selectedServer } = useServer();

  // compute serverUrl similar to frontend logic
  const serverUrl = (() => {
    if (!selectedServer) return undefined;
    const envUrl = (import.meta as any).env.VITE_LIVEKIT_URL as string;
    if ((import.meta as any).env.DEV) return envUrl;
    return selectedServer.sfu?.url || envUrl;
  })();

  const enabled = useSyncExternalStore(manager.subscribe.bind(manager), () => manager.isEnabled());
  const sharesStr = useSyncExternalStore(manager.subscribe.bind(manager), () => manager.list().join('|'));
  const shares = sharesStr ? sharesStr.split('|').filter(Boolean).map(Number) : [];

  const toggle = useCallback(() => {
    if (!selectedServer || !serverUrl) return;
    if (manager.count < 3) {
      void manager.start(selectedServer.id, serverUrl);
    } else {
      manager.stop();
    }
  }, [selectedServer, serverUrl]);

  const startNew = useCallback(() => {
    if (!selectedServer || !serverUrl) return;
    void manager.start(selectedServer.id, serverUrl);
  }, [selectedServer, serverUrl]);

  const stopShare = useCallback((idx: number) => {
    manager.stop(idx);
  }, []);

  const stopAll = useCallback(() => {
    manager.stop();
  }, []);

  // cleanup on unmount of hook consumers (optional)
  useEffect(() => () => {
    // no-op; manager persists globally
  }, []);

  return { toggle, enabled, shares, count: manager.count, startNew, stopShare, stopAll } as const;
}; 