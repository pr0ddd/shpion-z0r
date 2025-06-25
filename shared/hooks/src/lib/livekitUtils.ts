import { TrackPublication } from 'livekit-client';

export function isRemotePublication(pub: TrackPublication): pub is import('livekit-client').RemoteTrackPublication {
  return typeof (pub as any).setSubscribed === 'function';
} 