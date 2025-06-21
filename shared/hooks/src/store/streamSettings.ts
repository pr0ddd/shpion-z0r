import { create } from 'zustand';

export type VideoCodec = 'vp8' | 'h264' | 'vp9' | 'av1';
export interface StreamSettings {
  codec: VideoCodec;
  resolution: '540p' | '720p' | '1080p' | '1440p' | '2160p';
  fps: number;
  maxBitrate: number; // in bps
  dynacast: boolean;
  adaptiveStream: boolean;
}

const defaultSettings: StreamSettings = {
  codec: 'h264',
  resolution: '1080p',
  fps: 60,
  maxBitrate: 3_000_000,
  dynacast: false,
  adaptiveStream: false,
};

interface Store {
  settings: StreamSettings;
  setSettings: (s: StreamSettings) => void;
}

export const useStreamSettingsStore = create<Store>((set) => ({
  settings: defaultSettings,
  setSettings: (s) => set({ settings: s }),
})); 