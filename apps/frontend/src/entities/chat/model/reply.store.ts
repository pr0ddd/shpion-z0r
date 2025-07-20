import { create } from 'zustand';
import { Message } from '@shared/types';

interface ReplyStore {
  replyTo?: Message;
  setReply: (msg: Message) => void;
  clear: () => void;
}

export const useReplyStore = create<ReplyStore>((set) => ({
  replyTo: undefined,
  setReply: (msg) => set({ replyTo: msg }),
  clear: () => set({ replyTo: undefined }),
})); 