import { useRef, useState } from 'react';

import { hasAgentTag } from '../utils/hasAgentTag';

import { useSendMessageMutation } from '../api/sendMessage.mutation';
import { useSendMessageToAgent } from '../api/sendMessageToAgent';

export const useChatMessagesForm = (serverId: string) => {
  const { mutate: sendMessage } = useSendMessageMutation(serverId);
  const { send: sendMessageToAgent } = useSendMessageToAgent(serverId);

  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  const doSend = async () => {
    const value = text.trim();
    if (!value) return;

    sendMessage(value);
  
    if (hasAgentTag(value)) {
      sendMessageToAgent(value);
    }
    setText('');
  };

  return { text, setText, inputRef, handleSubmit, handleKeyDown };
};
