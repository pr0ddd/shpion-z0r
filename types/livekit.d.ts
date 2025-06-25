import 'livekit-client';
import { TrackPublication } from 'livekit-client';

// Дополняем типы SDK: у RemoteTrackPublication реально есть метод setSubscribed()
declare module 'livekit-client' {
  interface RemoteTrackPublication extends TrackPublication {
    /** подписаться / отписаться от конкретного трека */
    setSubscribed(subscribed: boolean): Promise<void>;
  }
} 