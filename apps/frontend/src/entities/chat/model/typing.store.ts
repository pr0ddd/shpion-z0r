import { create } from 'zustand';

interface TypingState {
  [userId: string]: { username: string; typing: boolean };
}

export const useTypingStore = create<{ state: TypingState; set: (uId:string, username:string, typing:boolean)=>void }>((set) => ({
  state: {},
  set: (id, username, typing) => set((s) => ({ state: { ...s.state, [id]: { username, typing } } })),
})); 