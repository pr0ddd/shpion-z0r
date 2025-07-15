import { create } from 'zustand';

export type HotkeyAction =
  | 'toggle-mic'
  | 'toggle-camera'
  | 'toggle-screen'
  | 'stop-streams'
  | 'toggle-speaker';
// Map может быть неполным – пользователю не обязательно назначать все сочетания
export type HotkeyMap = Partial<Record<HotkeyAction, string>>;

const STORAGE_KEY = 'settings.hotkeys';

export const defaultHotkeys: HotkeyMap = {
  'toggle-mic': 'Ctrl+M',
  'toggle-camera': 'Ctrl+Shift+V',
  'toggle-screen': 'Ctrl+Shift+S',
  'stop-streams': 'Ctrl+Shift+X',
  'toggle-speaker': 'Ctrl+Shift+A',
};

const load = (): HotkeyMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultHotkeys };
    return { ...defaultHotkeys, ...(JSON.parse(raw) as HotkeyMap) };
  } catch {
    return { ...defaultHotkeys };
  }
};

export const useHotkeysStore = create<{
  hotkeys: HotkeyMap;
  setHotkey: (action: HotkeyAction, code: string) => void;
  setAllHotkeys: (map: HotkeyMap) => void;
  resetHotkeys: () => void;
}>((set) => ({
  hotkeys: load(),
  setHotkey: (action, code) =>
    set((state) => {
      const updated = { ...state.hotkeys, [action]: code } as HotkeyMap;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return { hotkeys: updated };
    }),
  setAllHotkeys: (map) =>
    set(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
      } catch {}
      return { hotkeys: map };
    }),
  resetHotkeys: () =>
    set(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultHotkeys));
      } catch {}
      return { hotkeys: { ...defaultHotkeys } };
    }),
}));

// Флаг «сейчас идёт захват сочетания» — нужен, чтобы GlobalHotkeys временно не срабатывали.
export const useHotkeyCaptureStore = create<{
  isCapturing: boolean;
  setCapturing: (v: boolean) => void;
}>((set) => ({
  isCapturing: false,
  setCapturing: (v) => set({ isCapturing: v }),
})); 