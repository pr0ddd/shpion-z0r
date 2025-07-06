import { useQuery } from '@tanstack/react-query';
import { livekitAPI } from '@shared/data';
import type { QueryFunctionContext } from '@tanstack/react-query';

/**
 * Retrieves a LiveKit access token for the current authenticated user.
 * At the moment this is a thin wrapper around the `GET /livekit/voice/${serverId}/token` endpoint.
 * Replace the implementation with a stronger caching/refresh logic when backend is ready.
 */

// The query function now conforms to React-Query's expected signature.
// serverId is taken from the second element of the queryKey tuple: ['livekitToken', serverId].
const fetchLiveKitToken = async ({ queryKey }: QueryFunctionContext) => {
  const [, serverId] = queryKey as [string, string];
  const res = await livekitAPI.getVoiceToken(serverId);
  if (res.success && res.data) return res.data.token;
  throw new Error('Failed to fetch LiveKit token');
};

export const useLiveKitTokenQuery = (serverId: string | null) => {
  const { data, isLoading, error } = useQuery<string, Error>({
    queryKey: ['livekitToken', serverId],
    queryFn: fetchLiveKitToken,
    enabled: !!serverId,
  });

  return {
    data,
    isLoading,
    error,
  };
};
