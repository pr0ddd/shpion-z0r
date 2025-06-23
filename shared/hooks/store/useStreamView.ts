import { create } from 'zustand';

interface StreamViewState {
  activeStreamSid: string | null;
  multiView: boolean;
  setActiveStream: (sid: string | null) => void;
  setMultiView: (on: boolean) => void;
  resetView: () => void;
}

export const useStreamViewStore = create<StreamViewState>((set) => ({
  activeStreamSid: null,
  multiView: false,
  setActiveStream: (sid) => set({ activeStreamSid: sid, multiView: false }),
  setMultiView: (on) => set({ multiView: on, activeStreamSid: null }),
  resetView: () => set({ activeStreamSid: null, multiView: false }),
})); 