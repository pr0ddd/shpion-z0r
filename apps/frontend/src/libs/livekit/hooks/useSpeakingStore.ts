import { create } from 'zustand';

interface SpeakingState {
  map: Record<string, boolean>;
  setSpeaking: (sid: string, on: boolean) => void;
}

export const useSpeakingStore = create<SpeakingState>((set) => ({
  map: {},
  setSpeaking: (sid, on) =>
    set((s) => ({ map: { ...s.map, [sid]: on } })),
})); 