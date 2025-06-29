import { create } from 'zustand';

interface StreamViewState {
  activeStreamSid: string | null;
  multiView: boolean;
  gridCols: number | 'auto';
  chatSidebar: boolean;
  showStats: boolean;
  fullscreen: boolean;
  setActiveStream: (sid: string | null) => void;
  setMultiView: (on: boolean) => void;
  setGridCols: (cols: number | 'auto') => void;
  toggleChatSidebar: () => void;
  toggleShowStats: () => void;
  toggleFullscreen: () => void;
  resetView: () => void;
}

export const useStreamViewStore = create<StreamViewState>((set) => ({
  activeStreamSid: null,
  multiView: false,
  gridCols: 'auto',
  chatSidebar: false,
  showStats: false,
  fullscreen: false,
  setActiveStream: (sid) => set({ activeStreamSid: sid, multiView: false }),
  setMultiView: (on) => set({ multiView: on, activeStreamSid: null }),
  setGridCols: (cols) => set({ gridCols: cols }),
  toggleChatSidebar: () => set((s)=>({ chatSidebar: !s.chatSidebar })),
  toggleShowStats: () => set((s)=>({ showStats: !s.showStats })),
  toggleFullscreen: () => set((s)=>({ fullscreen: !s.fullscreen, chatSidebar: s.fullscreen ? s.chatSidebar : false })),
  resetView: () => set({ activeStreamSid: null, multiView: false, gridCols:'auto', chatSidebar:false, showStats:false, fullscreen:false }),
})); 