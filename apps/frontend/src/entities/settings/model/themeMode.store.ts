import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light';

interface ThemeModeState {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
}

const STORAGE_KEY = 'ui.themeMode';

const load = (): ThemeMode => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === 'light' ? 'light' : 'dark';
};

export const useThemeModeStore = create<ThemeModeState>((set) => ({
  mode: load(),
  setMode: (m) => {
    localStorage.setItem(STORAGE_KEY, m);
    set({ mode: m });
  },
  toggle: () =>
    set((s) => {
      const next: ThemeMode = s.mode === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      return { mode: next };
    }),
})); 