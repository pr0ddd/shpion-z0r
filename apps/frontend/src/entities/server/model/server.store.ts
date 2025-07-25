import { create } from 'zustand';
import { createGlobalAudioContext } from '@libs/audioContext';
import { modelLoader } from '@libs/deepFilterNet/modelLoader';

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
    // Это вызывается в обработчике клика по серверу, т.е. внутри пользовательского
    // жеста → можем безопасно «разлочить» AudioContext.
    try {
      const ctx = createGlobalAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {/* ignore */});
      }
    } catch {/* ignore */}

    // Модель будет загружена лениво при первом заходе на сервер (RequireDeepFilter).

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
