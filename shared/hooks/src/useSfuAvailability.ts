import { useQuery } from '@tanstack/react-query';

export const useSfuAvailability = (url: string | undefined) =>
  useQuery<boolean, Error>({
    queryKey: ['sfuAvailable', url],
    enabled: !!url,
    staleTime: 0,
    refetchInterval: 10000,
    queryFn: async () => {
      if (!url) return false;
      // 1. Превращаем ws(s) → http(s)
      let base = url.replace(/^wss?/, 'https').replace(/^ws/, 'http');

      // 2. Удаляем всё после /rtc (включительно), если оно уже есть,
      //    чтобы не получить дублирующее /rtc/rtc
      base = base.replace(/\/rtc(?:\/.*)?$/, '');

      // 3. Формируем итоговый health-URL
      const httpUrl = `${base}/rtc/validate`;

      // LiveKit < v2.4 имел только /livekit/healthz, оставляем это как fallback.

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        let res = await fetch(httpUrl, { method: 'HEAD', signal: controller.signal });
        if (!res.ok && httpUrl.endsWith('/validate')) {
          // Fallback for older LiveKit builds
          const fallbackUrl = `${base}/livekit/healthz`;
          res = await fetch(fallbackUrl, { method: 'HEAD', signal: controller.signal });
        }
        // LiveKit может отвечать 401 (требует JWT), 403 (запрещён) или 405 на HEAD.
        // Для нашей простой health-проверки считаем эти ответы признаком «жив».
        return res.ok || [401, 403, 405].includes(res.status);
      } catch {
        return false;
      } finally {
        clearTimeout(timeout);
      }
    },
  }); 