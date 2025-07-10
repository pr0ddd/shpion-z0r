import { MAX_SHARES } from '@configs';
import { LocalAudioTrack, LocalVideoTrack, Room, Track } from 'livekit-client';

type ShareEntry = {
  room: Room;
  instance: number; // 0..2
  videoTrack: LocalVideoTrack;
  audioTrack?: LocalAudioTrack;
};

export class ScreenShareManager {
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
    if (this.shares.length >= MAX_SHARES) {
      alert('Max shares reached');
      return;
    }

    const instance = this.shares.length; // 0..MAX_SHARES-1

    const allowAudio = true;

    // capture display media – request audio only if allowed, otherwise request silent capture
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: allowAudio,
      });

      if (!stream) {
        console.warn('Screen share cancelled');
      }

      const videoTrack = new LocalVideoTrack(stream.getVideoTracks()[0]);
      // const rawLabel = videoTrack.mediaStreamTrack?.label ?? '';
      let audioTrack: LocalAudioTrack | undefined;

      console.log({ allowAudio });
      if (allowAudio && stream.getAudioTracks().length) {
        audioTrack = new LocalAudioTrack(stream.getAudioTracks()[0]);
      }

      const streamName = `screen-share-${userId}-${new Date().getTime()}`;
      await room.localParticipant.publishTrack(videoTrack, {
        source: Track.Source.ScreenShare,
        name: streamName,
        stream: streamName,
      });
      if (audioTrack) {
        try {
          await room.localParticipant.publishTrack(audioTrack, {
            source: Track.Source.ScreenShareAudio,
            stream: streamName,
          });
        } catch (e) {
          console.warn('[ScreenShare] Failed to publish audio track:', e);
        }
      }

      // stop share when user ends capture from browser UI
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stop(instance);
      });

      this.shares.push({ room, instance, videoTrack, audioTrack });
      this.emit();
    } catch (err: any) {
      console.error(err);
    }
  }

  list() {
    return this.shares.map((s) => s.instance);
  }

  /**
   * Stop share by published video track SID.
   * Returns true if share was found and stopped.
   */
  stopByTrackSid(videoSid: string): boolean {
    const share = this.shares.find((s) => s.videoTrack.sid === videoSid);
    if (!share) return false;
    this.stop(share.instance);
    return true;
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
