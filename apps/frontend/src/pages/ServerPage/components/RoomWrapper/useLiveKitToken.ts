import { useQuery } from '@tanstack/react-query';
import { livekitAPI } from '@shared/data';

/**
 * Retrieves a LiveKit access token for the current authenticated user.
 * At the moment this is a thin wrapper around the `GET /livekit/voice/${serverId}/token` endpoint.
 * Replace the implementation with a stronger caching/refresh logic when backend is ready.
 */
export const useLiveKitToken = (server: { id: string } | string | null) => {
  const serverId = typeof server === 'string' ? server : server?.id;
  const {
    data: token,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['livekitToken', serverId],
    enabled: !!serverId,
    queryFn: async () => {
      const res = await livekitAPI.getVoiceToken(serverId!);
      if (res.success && res.data) return res.data.token;
      throw new Error(res.error || 'Failed to fetch LiveKit token');
    },
    // Запрашиваем токен один раз и обновляем его в фоне по расписанию.
    // Первичная загрузка: isLoading=true — это покажет оверлей.
    // Дальнейшие обновления выполняются как background-fetch: isLoading=false, isFetching=true (не используется в UI)
    staleTime: 1000 * 30, // считаем «свежим» не дольше 30 сек, важно для динамического refetchInterval
    retry: 1,
    // вычисляем, когда нужно обновить токен, исходя из payload.exp (в секундах Unix)
    // React-Query позволит передавать число / false. Функция вызывается после каждого успешного запроса.
    refetchInterval: (query) => {
      const data = query.state.data as string | undefined;
      if (!data) return false; // нет токена — не перезапрашивать
      try {
        const payloadB64 = data.split('.')[1];
        const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadJson);
        const expSec: number | undefined = payload.exp;
        if (!expSec) return 60_000; // нет exp ⇒ раз в минуту
        const expiresInMs = expSec * 1000 - Date.now();
        // Обновимся за 15 сек до истечения, но не реже, чем раз в 30 сек.
        const nextRefresh = Math.max(expiresInMs - 15_000, 30_000);
        return nextRefresh;
      } catch {
        // не смогли распарсить — обновляем раз в минуту
        return 60_000;
      }
    },
    refetchIntervalInBackground: true,
    // Prevent automatic refetches that cause UI flicker & audio glitches when the tab regains focus
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return { token: token ?? null, isLoading, error: error as Error | null } as const;
}; 