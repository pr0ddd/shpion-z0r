import { useQuery } from '@tanstack/react-query';
import { livekitAPI } from '@shared/data';

/**
 * Retrieves a LiveKit access token for the current authenticated user.
 * At the moment this is a thin wrapper around the `GET /voice/token` endpoint.
 * Replace the implementation with a stronger caching/refresh logic when backend is ready.
 */
export const useLiveKitToken = (server: { id: string } | string | null) => {
  const serverId = typeof server === 'string' ? server : server?.id;
  const {
    data: token,
    isFetching: isLoading,
    error,
  } = useQuery({
    queryKey: ['livekitToken', serverId],
    enabled: !!serverId,
    queryFn: async () => {
      const res = await livekitAPI.getVoiceToken(serverId!);
      if (res.success && res.data) return res.data.token;
      throw new Error(res.error || 'Failed to fetch LiveKit token');
    },
    staleTime: 1000 * 60, // 1 minute
    retry: 1,
  });

  return { token: token ?? null, isLoading, error: error as Error | null } as const;
}; 