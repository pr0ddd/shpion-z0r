import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messageAPI } from '@shared/data';
import { updateMessagesCache } from './updateMessagesCache';
import { Message } from '@shared/types';

export const useEditMessageMutation = (serverId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const res = await messageAPI.editMessage(id, content);
      if (res.success) return res.data as Message;
      const msg = 'error' in res && res.error ? String(res.error) : 'Failed to edit';
      throw new Error(msg);
    },
    onSuccess: (msg) => {
      updateMessagesCache(qc, serverId, (msgs) => msgs.map((m) => (m.id === msg.id ? msg : m)));
    },
  });
}; 