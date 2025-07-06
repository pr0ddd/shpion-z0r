import { TrackPublishDefaults } from "livekit-client";
import { LIVEKIT_PRESET_BALANCED } from "./livekit.preset";

/**
 * Maximum simultaneous screen shares (per client)
 */
export const MAX_SHARES = 4;

/**
 * Interval in ms for capturing preview of the stream
 */
export const PREVIEW_CAPTURE_INTERVAL = 1000;

/**
 * LiveKit stream presets
 */
export const STREAM_PRESETS: Record<'balanced', TrackPublishDefaults> = {
  balanced: LIVEKIT_PRESET_BALANCED,
};
