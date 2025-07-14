import { AudioPresets, TrackPublishDefaults } from "livekit-client";

export const LIVEKIT_PRESET_BALANCED: TrackPublishDefaults = {
  videoCodec: 'av1',
  videoEncoding: {
    maxBitrate: 3_000_000,
    maxFramerate: 30,
    // @ts-ignore – experimental WebRTC field
    degradationPreference: 'maintain-framerate',
  },
  // Use the same limits for screen-share tracks
  screenShareEncoding: {
    maxBitrate: 3_000_000,
    maxFramerate: 30,
    // @ts-ignore – experimental WebRTC field
    degradationPreference: 'maintain-framerate',
  }, 
  audioPreset: AudioPresets.speech,
  dtx: false,
  red: false,
};
