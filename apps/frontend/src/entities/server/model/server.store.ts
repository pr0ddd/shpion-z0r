import { create } from 'zustand';

interface ServerStore {
  isConnected: boolean;
  setIsConnected: (isConnected: boolean) => void;

  selectedServerId: string | null;
  setSelectedServerId: (serverId: string | null) => void;
}

export const useServerStore = create<ServerStore>((set) => ({
  isConnected: false,
  setIsConnected: (isConnected: boolean) => set({ isConnected }),

  selectedServerId: localStorage.getItem('lastSelectedServerId') || null,
  setSelectedServerId: (serverId: string | null) => {
    if (serverId) {
      localStorage.setItem('lastSelectedServerId', serverId);
    } else {
      localStorage.removeItem('lastSelectedServerId');
    }
    set({
      isConnected: false,
      selectedServerId: serverId,
    })
  },
}));
