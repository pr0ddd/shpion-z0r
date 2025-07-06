import { useSocket } from '@libs/socket';
import { Message } from '@shared/types';
import {
  QueryClient,
  useQueryClient,
} from '@tanstack/react-query';
import { useRef } from 'react';
import { useSessionStore } from '@entities/session';
import { createOptimisticMessage } from '../utils/createOptimisticMessage';
import { updateMessagesCache } from './updateMessagesCache';


const addMessageToCache = (
  qc: QueryClient,
  serverId: string,
  message: Message
) => {
  updateMessagesCache(qc, serverId, (msgs) => [...msgs, message]);
};

const patchMessageInCache = (
  qc: QueryClient,
  serverId: string,
  message: Message
) => {
  updateMessagesCache(qc, serverId, (msgs) =>
    msgs.map((m) => (m.id === message.id ? message : m))
  );
};

export const useSendMessageMutation = (serverId: string) => {
  const user = useSessionStore(s => s.user);
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const pendingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const mutate = (text: string) => {
    console.log(1)
    const message = createOptimisticMessage(text, user!, serverId);

    addMessageToCache(queryClient, serverId, message);

    const clientNonce = message.id.slice(5);
    const payload = {
      serverId,
      content: message.content,
      clientNonce,
    } as any;

    socket?.emit('message:send', payload, (response: { success: boolean }) => {
      if (response.success) {
        // real message will arrive via 'message:new'; remove temp if still there after timeout fallback.
        clearTimeout(pendingTimeout.current);
        pendingTimeout.current = undefined;
      } else {
        console.error('sendMessage failed', response);
      }
    });

    pendingTimeout.current = setTimeout(() => {
      patchMessageInCache(queryClient, serverId, {
        ...message,
        status: 'failed',
      });
    }, 4000);
  };

  return { mutate };
};
