import { create } from 'zustand';

interface GalleryState {
  images: string[];       // absolute URLs in display order (newest/oldest like messages array)
  index: number | null;   // currently viewed image index
  isOpen: boolean;
  open: (images: string[], index: number) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  images: [],
  index: null,
  isOpen: false,
  open: (images, index) => set({ images, index, isOpen: true }),
  close: () => set({ isOpen: false, index: null }),
  next: () =>
    set((state) => {
      if (!state.isOpen || state.index === null) return state;
      if (state.index >= state.images.length - 1) return state; // already last
      return { index: state.index + 1 } as Partial<GalleryState>;
    }),
  prev: () =>
    set((state) => {
      if (!state.isOpen || state.index === null) return state;
      if (state.index <= 0) return state; // already first
      return { index: state.index - 1 } as Partial<GalleryState>;
    }),
})); 