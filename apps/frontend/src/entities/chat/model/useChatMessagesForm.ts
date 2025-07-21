import { useRef, useState } from 'react';

import { hasAgentTag } from '../utils/hasAgentTag';

import { useSendMessageMutation } from '../api/sendMessage.mutation';
import { useReplyStore } from '../model/reply.store';
import { useSendMessageToAgent } from '../api/sendMessageToAgent';

export const useChatMessagesForm = (serverId: string) => {
  const { mutate } = useSendMessageMutation(serverId);
  const replyTo = useReplyStore(s=>s.replyTo);
  const clearReply = useReplyStore(s=>s.clear);
  const { send: sendMessageToAgent } = useSendMessageToAgent(serverId);

  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      doSend();
    }
  };

  const doSend = async (explicit?: { attachment?: string; type?: 'IMAGE' | 'FILE' }) => {
    const value = text.trim();

    // when sending attachment only, allow empty text
    if (!value && !explicit?.attachment) return;

    if (explicit?.attachment) {
      mutate('', explicit, replyTo);
    } else {
      mutate(value, undefined, replyTo);

      if(replyTo) clearReply();
      if (hasAgentTag(value)) {
        sendMessageToAgent(value);
      }
      setText('');
    }
  };

  return { text, setText, inputRef, handleSubmit, handleKeyDown, sendMessage: doSend };
};
