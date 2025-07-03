import { create } from 'zustand';

interface ServerStore {
  selectedServerId: string | null;
  setSelectedServerId: (serverId: string | null) => void;
}

export const useServerStore = create<ServerStore>((set) => ({
  selectedServerId: localStorage.getItem('lastSelectedServerId') || null,
  setSelectedServerId: (serverId: string | null) => {
    if (serverId) {
      localStorage.setItem('lastSelectedServerId', serverId);
    } else {
      localStorage.removeItem('lastSelectedServerId');
    }
    set({ selectedServerId: serverId })
  },
}));
