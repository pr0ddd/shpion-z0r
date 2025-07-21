import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messageAPI } from '@shared/data';
import { removeMessageFromCache } from './removeMessageFromCache';

export const useDeleteMessageMutation = (serverId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const res = await messageAPI.deleteMessage(messageId);
      if (res.success) return null;
      const msg = 'error' in res && res.error ? String(res.error) : 'Failed to delete message';
      throw new Error(msg);
    },
    onSuccess: (_, messageId) => {
      removeMessageFromCache(qc, serverId, messageId);
    },
  });
}; 