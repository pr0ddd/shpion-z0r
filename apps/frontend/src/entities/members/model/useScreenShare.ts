import { useCallback, useEffect, useSyncExternalStore, useRef } from 'react';
import { Room, LocalVideoTrack, LocalAudioTrack, Track, RoomEvent } from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';
import { useServer } from '@features/servers';
import { MAX_SHARES } from '@config/streaming';

type ShareEntry = {
  room: Room;
  instance: number; // 0..2
  videoTrack: LocalVideoTrack;
  audioTrack?: LocalAudioTrack;
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

  async start(room: Room, userId: string): Promise<void> {
    if (this.shares.length >= MAX_SHARES) return; // limit

    if (room.state !== 'connected') {
      console.warn('[ScreenShare] Room not connected');
      return;
    }

    const instance = this.shares.length; // 0..MAX_SHARES-1

    // For the very first share we include audio, subsequent shares are video-only to prevent duplicated audio
    // const allowAudio = this.shares.length === 0;

    const allowAudio = true;

    // capture display media – request audio only if allowed, otherwise request silent capture
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: allowAudio });
    } catch (err: any) {
      if (allowAudio && (err?.name === 'NotAllowedError' || err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError')) {
        // retry without audio so at least screen is shared
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
          // eslint-disable-next-line no-console
          console.warn('[ScreenShare] Audio capture unavailable, sharing screen without sound:', err);
        } catch (err2) {
          console.error('[ScreenShare] User denied screen capture:', err2);
          throw err2;
        }
      } else {
        throw err;
      }
    }

    const videoTrack = new LocalVideoTrack(stream.getVideoTracks()[0]);
    let audioTrack: LocalAudioTrack | undefined;

    console.log({allowAudio})
    if (allowAudio && stream.getAudioTracks().length) {
      audioTrack = new LocalAudioTrack(stream.getAudioTracks()[0]);
    }

    // Формируем читаемое название шэра
    const rawLabel = videoTrack.mediaStreamTrack?.label ?? '';
    const settings: any = videoTrack.mediaStreamTrack?.getSettings?.() ?? {};
    const surface = settings.displaySurface as string | undefined;

    let title: string;

    const isGeneric = (str: string) => {
      if (!str) return true;
      const lower = str.toLowerCase();
      return (
        lower.startsWith('web-contents-media-stream') ||
        lower.startsWith('screen:') ||
        /window:\d+/i.test(lower)
      );
    };

    switch (surface) {
      case 'monitor':
        // Всегда нумеруем мониторы, как Google Meet
        title = `Экран ${instance + 1}`;
        break;
      case 'window': {
        const cleaned = rawLabel.replace(/^Window:\s*/i, '').trim();
        title = isGeneric(cleaned) ? `Окно` : cleaned;
        break;
      }
      case 'browser': {
        const cleaned = rawLabel.replace(/^(Tab):\s*/i, '').trim();
        title = isGeneric(cleaned) ? `Вкладка` : cleaned;
        break;
      }
      case 'application': {
        const cleaned = rawLabel.trim();
        title = isGeneric(cleaned) ? `Приложение` : cleaned;
        break;
      }
      default:
        title = isGeneric(rawLabel) ? 'Экран' : rawLabel;
    }

    // укоротим, чтобы не ломать UI
    if (title.length > 40) title = title.slice(0, 40) + '…';

    const streamName = `screen-share-${userId}-${new Date().getTime()}`;

    await room.localParticipant.publishTrack(videoTrack, {
      source: Track.Source.ScreenShare,
      name: title,
      stream: streamName,
    });
    if (audioTrack) {
      try {
        await room.localParticipant.publishTrack(audioTrack, {
          source: Track.Source.ScreenShareAudio,
          stream: streamName,
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[ScreenShare] Failed to publish audio track:', e);
      }
    }

    // stop share when user ends capture from browser UI
    stream.getVideoTracks()[0].addEventListener('ended', () => {
      this.stop(instance);
    });

    this.shares.push({ room, instance, videoTrack, audioTrack });
    this.emit();
  }

  list() {
    return this.shares.map((s) => s.instance);
  }

  stop(instance?: number) {
    const stopShare = (s: ShareEntry) => {
      if (s.videoTrack) {
        s.room.localParticipant.unpublishTrack(s.videoTrack);
        s.videoTrack.stop();
      }
      if (s.audioTrack) {
        s.room.localParticipant.unpublishTrack(s.audioTrack);
        s.audioTrack.stop();
      }
    };

    if (instance === undefined) {
      // stop all shares
      this.shares.forEach(stopShare);
      this.shares = [];
    } else {
      const idx = this.shares.findIndex((s) => s.instance === instance);
      if (idx !== -1) {
        stopShare(this.shares[idx]);
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
  const room = useRoomContext();

  const enabled = useSyncExternalStore(manager.subscribe.bind(manager), () => manager.isEnabled());
  const sharesStr = useSyncExternalStore(manager.subscribe.bind(manager), () => manager.list().join('|'));
  const shares = sharesStr ? sharesStr.split('|').filter(Boolean).map(Number) : [];

  const toggle = useCallback(() => {
    if (!selectedServer || !room) return;
    if (manager.count < MAX_SHARES) {
      void manager.start(room);
    } else {
      manager.stop();
    }
  }, [selectedServer, room]);

  const startNew = useCallback((userId: string) => {
    if (!selectedServer || !room) return;
    void manager.start(room, userId);
  }, [selectedServer, room]);

  const stopShare = useCallback((idx: number) => {
    manager.stop(idx);
  }, []);

  const stopAll = useCallback(() => {
    manager.stop();
  }, []);

  // Авто-остановка всех локальных шэров при выходе из комнаты
  useEffect(() => {
    if (!room) return;
    const handleDisconnect = () => manager.stop();
    room.on(RoomEvent.Disconnected, handleDisconnect);
    return () => {
      room.off(RoomEvent.Disconnected, handleDisconnect);
    };
  }, [room]);

  // Если пользователь сменил комнату (room объект поменялся), прекращаем все локальные шэринги,
  // чтобы счётчик корректно обнулился и треки не остались висеть в старой комнате.
  const prevRoomRef = useRef<Room | null>(null);
  useEffect(() => {
    if (prevRoomRef.current && room && prevRoomRef.current !== room) {
      manager.stop();
    }
    prevRoomRef.current = room ?? null;
  }, [room]);

  // Остановка всех шэрингов, когда компонент с хуком размонтируется (смена комнаты / выход).
  useEffect(() => {
    return () => {
      manager.stop();
    };
  }, []);

  return { toggle, enabled, shares, count: manager.count, startNew, stopShare, stopAll } as const;
}; 