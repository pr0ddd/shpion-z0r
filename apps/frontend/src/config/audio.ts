import { AudioCaptureOptions } from "livekit-client";

export const AUDIO_CAPTURE_DEFAULTS: AudioCaptureOptions = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: true,
  voiceIsolation: true,
};