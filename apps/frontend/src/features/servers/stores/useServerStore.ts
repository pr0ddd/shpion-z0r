import { create } from 'zustand';
import { Message } from '@shared/types';

import { ServerStoreState } from '../server.types';

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
  updateMessage: (m) =>
    set((state: ServerStoreState) => ({
      messages: state.messages.map((msg) => (msg.id === m.id ? m : msg)),
    })),
  addMessages: (batch) =>
    set((state: ServerStoreState) => {
      const byId: Record<string, Message> = {};
      state.messages.forEach((m) => (byId[m.id] = m));
      batch.forEach((m) => {
        byId[m.id] = { ...byId[m.id], ...m };
      });
      return { messages: Object.values(byId) };
    }),
  removeMessage: (id) =>
    set((state: ServerStoreState) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    })),
  setOptimisticMessageStatus: (id, status) =>
    set((state: ServerStoreState) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, status } : msg
      ),
    })),
  setListeningState: (userId, listening) =>
    set((state: ServerStoreState) => ({
      listeningStates: { ...state.listeningStates, [userId]: listening },
    })),
}));
