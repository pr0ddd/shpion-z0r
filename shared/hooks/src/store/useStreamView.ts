import { create } from 'zustand';

interface StreamViewState {
  activeStreamSid: string | null;
  setActiveStream: (sid: string | null) => void;
}

export const useStreamViewStore = create<StreamViewState>((set) => ({
  activeStreamSid: null,
  setActiveStream: (sid) => set({ activeStreamSid: sid }),
})); 