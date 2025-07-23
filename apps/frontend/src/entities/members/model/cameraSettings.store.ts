import { create } from 'zustand';

export type CameraFacing = 'front' | 'back';

interface CameraSettingsState {
  preferredCamera: CameraFacing;
  setPreferredCamera: (facing: CameraFacing) => void;
}

export const useCameraSettingsStore = create<CameraSettingsState>((set) => ({
  preferredCamera: 'front',
  setPreferredCamera: (facing) => set({ preferredCamera: facing }),
})); 