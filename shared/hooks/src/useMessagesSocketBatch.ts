import { useEffect, useRef } from 'react';
import { useSocket } from './contexts/SocketContext';
import { useServerStore } from './store/useServerStore';
import { Message } from '@shared/types';

// Hook: batch incoming socket messages to reduce re-renders
export const useMessagesSocketBatch = (pendingMap: Record<string, string>) => {
  const { socket } = useSocket();
  const addBatch = useServerStore((s) => s.addMessages);
  const updateMessage = useServerStore((s) => s.updateMessage);
  const removeMessage = useServerStore((s) => s.removeMessage);

  // Refs to keep mutable values without re-subscribing effect
  const bufRef = useRef<Message[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!socket) return;

    const flush = () => {
      if (bufRef.current.length === 0) return;
      const toInsert: Message[] = [];
      bufRef.current.forEach((m: any) => {
        if (m.clientNonce && pendingMap[m.clientNonce]) {
          const tempId = pendingMap[m.clientNonce];
          delete pendingMap[m.clientNonce];
          updateMessage({ ...m, id: tempId });
        } else {
          toInsert.push(m);
        }
      });
      if (toInsert.length) addBatch(toInsert);
      bufRef.current = [];
      timerRef.current = null;
    };

    const onNew = (m: Message) => {
      bufRef.current.push(m);
      if (!timerRef.current) {
        timerRef.current = setTimeout(flush, 50);
      }
    };
    const onUpdated = (m: Message) => updateMessage(m);
    const onDeleted = (id: string) => removeMessage(id);

    socket.on('message:new', onNew as any);
    socket.on('message:updated', onUpdated as any);
    socket.on('message:deleted', onDeleted as any);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      socket.off('message:new', onNew as any);
      socket.off('message:updated', onUpdated as any);
      socket.off('message:deleted', onDeleted as any);
    };
  }, [socket, addBatch, updateMessage, removeMessage, pendingMap]);
}; 