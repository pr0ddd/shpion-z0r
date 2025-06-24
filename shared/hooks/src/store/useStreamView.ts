import { create } from 'zustand';

interface StreamViewState {
  activeStreamSid: string | null;
  multiView: boolean;
  selectedSids: string[];
  gridCols: number | 'auto';
  chatSidebar: boolean;
  showStats: boolean;
  fullscreen: boolean;
  setActiveStream: (sid: string | null) => void;
  setMultiView: (on: boolean, initialSid?: string | null) => void;
  addToMultiView: (sid: string) => void;
  removeFromMultiView: (sid: string) => void;
  setGridCols: (cols: number | 'auto') => void;
  toggleChatSidebar: () => void;
  toggleShowStats: () => void;
  toggleFullscreen: () => void;
  resetView: () => void;
}

export const useStreamViewStore = create<StreamViewState>((set) => ({
  activeStreamSid: null,
  multiView: false,
  selectedSids: [],
  gridCols: 'auto',
  chatSidebar: false,
  showStats: false,
  fullscreen: false,
  setActiveStream: (sid) => set({ activeStreamSid: sid, multiView: false, selectedSids: [] }),
  setMultiView: (on, initialSid=null) => set((s)=>({ multiView: on, activeStreamSid: null, selectedSids: on ? (initialSid ? Array.from(new Set([...s.selectedSids, initialSid])) : s.selectedSids) : [] })),
  addToMultiView: (sid) => set((s)=>({ selectedSids: s.selectedSids.includes(sid) ? s.selectedSids : [...s.selectedSids, sid], multiView:true, activeStreamSid:null })),
  removeFromMultiView: (sid) => set((s)=>{
    const arr = s.selectedSids.filter((x)=> x!==sid);
    return { selectedSids: arr, multiView: arr.length>0 };
  }),
  setGridCols: (cols) => set({ gridCols: cols }),
  toggleChatSidebar: () => set((s)=>({ chatSidebar: !s.chatSidebar })),
  toggleShowStats: () => set((s)=>({ showStats: !s.showStats })),
  toggleFullscreen: () => set((s)=>({ fullscreen: !s.fullscreen, chatSidebar: s.fullscreen ? s.chatSidebar : false })),
  resetView: () => set({ activeStreamSid: null, multiView: false, selectedSids: [], gridCols:'auto', chatSidebar:false, showStats:false, fullscreen:false }),
})); 