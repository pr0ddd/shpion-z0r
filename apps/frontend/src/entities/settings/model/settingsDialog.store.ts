import { create } from 'zustand';

export type SettingsSection =
  | 'account'
  | 'equipment'
  | 'hotkeys'
  | 'appearance';

interface SettingsDialogState {
  isOpen: boolean;
  activeSection: SettingsSection;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setSection: (s: SettingsSection) => void;
}

export const useSettingsDialogStore = create<SettingsDialogState>((set) => ({
  isOpen: false,
  activeSection: 'account',
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setSection: (s) => set({ activeSection: s }),
})); 