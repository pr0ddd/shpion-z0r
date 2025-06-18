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
  selectedServerId: null,
  transition: { active: false, text: null },
  setSelected: (id) => set({ selectedServerId: id }),
  startTransition: (text) => set({ transition: { active: true, text } }),
  endTransition: () => set({ transition: { active: false, text: null } }),
})); 