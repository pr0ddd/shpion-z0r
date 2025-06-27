import { create } from 'zustand';
import { Server, Member, Message } from '@shared/types';

interface ServerStoreState {
  selectedServer: Server | null;
  members: Member[];
  messages: Message[];
  isLoading: boolean;
  areMembersLoading: boolean;
  error: string | null;
  listeningStates: Record<string, boolean>;
  isTransitioning: boolean;
  setTransitioning: (v: boolean) => void;
  setSelectedServer: (server: Server | null) => void;
  setMembers: (members: Member[]) => void;
  setMessages: (messages: Message[]) => void;
  setIsLoading: (v: boolean) => void;
  setMembersLoading: (v: boolean) => void;
  setError: (err: string | null) => void;
  addMessage: (m: Message) => void;
  updateMessage: (m: Message) => void;
  addMessages: (batch: Message[]) => void;
  removeMessage: (id: string) => void;
  setOptimisticMessageStatus: (id: string, status: 'failed') => void;
  setListeningState: (userId: string, listening: boolean) => void;
}

export const useServerStore = create<ServerStoreState>()((set) => ({
  selectedServer: null,
  members: [],
  messages: [],
  isLoading: false,
  areMembersLoading: false,
  error: null,
  listeningStates: {},
  isTransitioning: false,
  setTransitioning: (v) => set({ isTransitioning: v }),
  setSelectedServer: (server) => set({ selectedServer: server }),
  setMembers: (members) => set({ members }),
  setMessages: (messages) => set({ messages }),
  setIsLoading: (v) => set({ isLoading: v }),
  setMembersLoading: (v) => set({ areMembersLoading: v }),
  setError: (err) => set({ error: err }),
  addMessage: (m) =>
    set((state) => {
      const idx = state.messages.findIndex((msg) => msg.id === m.id);
      if (idx >= 0) {
        // replace existing (optimistic or duplicated) message
        const next = [...state.messages];
        next[idx] = { ...state.messages[idx], ...m };
        return { messages: next };
      }
      return { messages: [...state.messages, m] };
    }),
  updateMessage: (m) => set((state: ServerStoreState) => ({ messages: state.messages.map((msg) => (msg.id === m.id ? m : msg)) })),
  addMessages: (batch: Message[]) =>
    set((state: ServerStoreState) => {
      const byId: Record<string, Message> = {};
      state.messages.forEach((m) => (byId[m.id] = m));
      batch.forEach((m) => {
        byId[m.id] = { ...byId[m.id], ...m };
      });
      return { messages: Object.values(byId) };
    }),
  removeMessage: (id) => set((state: ServerStoreState) => ({ messages: state.messages.filter((msg) => msg.id !== id) })),
  setOptimisticMessageStatus: (id, status) =>
    set((state: ServerStoreState) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, status } : msg,
      ),
    })),
  setListeningState: (userId, listening) =>
    set((state: ServerStoreState) => ({
      listeningStates: { ...state.listeningStates, [userId]: listening },
    })),
})); 