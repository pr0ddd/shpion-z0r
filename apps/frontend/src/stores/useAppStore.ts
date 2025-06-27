import { create } from 'zustand';

interface TransitionState {
  active: boolean;
  text: string | null;
}

interface AppState {
  /** id выбранного сервера; null = домашний «@» */
  selectedServerId: string | null;
  /** глобальный оверлей перехода между серверами */
  transition: TransitionState;
  // --- actions ---
  setSelected: (id: string | null) => void;
  startTransition: (text: string) => void;
  endTransition: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedServerId: localStorage.getItem('lastSelectedServerId'),
  transition: { active: false, text: null },
  setSelected: (id) => {
    if (id) {
      localStorage.setItem('lastSelectedServerId', id);
    } else {
      localStorage.removeItem('lastSelectedServerId');
    }
    set({ selectedServerId: id });
  },
  startTransition: (text) => set({ transition: { active: true, text } }),
  endTransition: () => set({ transition: { active: false, text: null } }),
}));
