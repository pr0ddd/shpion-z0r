import { create } from 'zustand';

interface AppState {
  /** id выбранного сервера; null = домашний «@» */
  selectedServerId: string | null;
  /** глобальный оверлей перехода между серверами */
  transition: boolean; // TODO: remove ?
  // --- actions ---
  setSelected: (id: string | null) => void;
  startTransition: () => void;
  endTransition: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedServerId: localStorage.getItem('lastSelectedServerId'),
  transition: false,
  setSelected: (id) => {
    if (id) {
      localStorage.setItem('lastSelectedServerId', id);
    } else {
      localStorage.removeItem('lastSelectedServerId');
    }
    set({ selectedServerId: id });
  },
  startTransition: () => set({ transition: true }),
  endTransition: () => set({ transition: false }),
}));
