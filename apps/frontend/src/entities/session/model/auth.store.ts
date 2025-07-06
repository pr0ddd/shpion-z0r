import { User } from '@shared/types';
import { create } from 'zustand';

interface SessionStore {
  user: User | null;
  token: string | null;
  error: string | null;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  user: null,
  token: localStorage.getItem('authToken') || null,
  error: null,
  setUser: (user: User) => set({ user }),
  setToken: (token: string) => {
    localStorage.setItem('authToken', token);
    set({ token });
  },
}));
