import { create } from 'zustand';

interface UnreadStore {
  counts: Record<string, number>;
  inc: (serverId: string) => void;
  clear: (serverId: string) => void;
}

export const useUnreadStore = create<UnreadStore>((set) => ({
  counts: {},
  inc: (id) => set((s) => ({ counts: { ...s.counts, [id]: (s.counts[id] || 0) + 1 } })),
  clear: (id) => set((s) => {
    if (!(id in s.counts)) return s;
    const { [id]: _, ...rest } = s.counts;
    return { counts: rest };
  }),
})); 