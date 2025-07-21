import { create } from 'zustand';
import { Message } from '@shared/types';

interface EditStore {
  editing?: Message;
  setEdit: (msg: Message) => void;
  clear: () => void;
}

export const useEditStore = create<EditStore>((set) => ({
  editing: undefined,
  setEdit: (m) => set({ editing: m }),
  clear: () => set({ editing: undefined }),
})); 