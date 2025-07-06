import { AudioPresets, TrackPublishDefaults } from "livekit-client";

export const LIVEKIT_PRESET_BALANCED: TrackPublishDefaults = {
  videoCodec: 'av1',
  videoEncoding: {
    maxBitrate: 3_000_000,
    maxFramerate: 30,
  },
  audioPreset: AudioPresets.speech,
  dtx: false,
  red: false,
};
