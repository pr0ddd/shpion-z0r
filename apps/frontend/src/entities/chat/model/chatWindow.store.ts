import { create } from 'zustand';

// Persist key
const STORAGE_KEY = 'chatWindowState';

// Helpers to load / save
const loadState = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const defaultPos = { x: typeof window !== 'undefined' ? window.innerWidth - 420 : 100, y: 100 };
const defaultSize = { width: 380, height: 500 };
const defaultOpacity = 1;

interface ChatWindowStore {
  isOpen: boolean;
  pos: { x: number; y: number };
  size: { width: number; height: number };
  opacity: number;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setPos: (pos: { x: number; y: number }) => void;
  setSize: (size: { width: number; height: number }) => void;
  setOpacity: (opacity: number) => void;
}

// Initial state – merge stored values with defaults
const persisted = loadState();

export const useChatWindowStore = create<ChatWindowStore>((set) => ({
  isOpen: persisted?.isOpen ?? false,
  pos: persisted?.pos ?? defaultPos,
  size: persisted?.size ?? defaultSize,
  opacity: persisted?.opacity ?? defaultOpacity,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setPos: (pos) => set({ pos }),
  setSize: (size) => set({ size }),
  setOpacity: (opacity) => set({ opacity }),
}));

// Persist on every change
if (typeof window !== 'undefined') {
  useChatWindowStore.subscribe((state) => {
    const { isOpen, pos, size, opacity } = state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ isOpen, pos, size, opacity }));
    } catch {}
  });
} 