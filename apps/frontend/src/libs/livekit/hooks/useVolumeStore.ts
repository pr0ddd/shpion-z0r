import { create } from 'zustand';

interface VolumeState {
  map: Record<string, number>; // userId(identity) -> volume (0..1)
  setVolume: (userId: string, volume: number) => void;
  getVolume: (userId: string) => number;
}

const DEFAULT_VOLUME = 0.5;

export const useVolumeStore = create<VolumeState>((set, get) => ({
  map: {},
  setVolume: (sid, volume) =>
    set((state) => ({ map: { ...state.map, [sid]: Math.max(0, Math.min(1, volume)) } })),
  getVolume: (sid) => get().map[sid] ?? DEFAULT_VOLUME,
})); 