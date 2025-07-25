import { create } from 'zustand';

interface DeepFilterModelStore {
  loading: boolean;
  loaded: boolean;
  setLoading: (loading: boolean) => void;
  setLoaded: () => void;
}

export const useDeepFilterModelStore = create<DeepFilterModelStore>((set) => ({
  loading: false,
  loaded: false,
  setLoading: (loading: boolean) => set({ loading }),
  setLoaded: () => set({ loading: false, loaded: true }),
})); 