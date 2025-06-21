import { useQuery } from '@tanstack/react-query';

export const useSfuAvailability = (url: string | undefined) =>
  useQuery<boolean, Error>({
    queryKey: ['sfuAvailable', url],
    enabled: !!url,
    staleTime: 0,
    refetchInterval: 10000,
    queryFn: async () => {
      if (!url) return false;
      // Convert ws:// → http:// and ensure we hit a health endpoint that returns 200.
      // LiveKit ≥ v2.4 exposes /rtc/validate , older versions expose /livekit/healthz.
      const baseHttpUrl = url.replace(/^ws/, 'http').replace(/\/rtc.*/, '/rtc');
      const httpUrl = `${baseHttpUrl}/validate`;  // First try /rtc/validate
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        let res = await fetch(httpUrl, { method: 'HEAD', signal: controller.signal });
        if (!res.ok && httpUrl.endsWith('/validate')) {
          // Fallback for older LiveKit builds
          const fallbackUrl = `${baseHttpUrl}/livekit/healthz`;
          res = await fetch(fallbackUrl, { method: 'HEAD', signal: controller.signal });
        }
        return res.ok;
      } catch {
        return false;
      } finally {
        clearTimeout(timeout);
      }
    },
  }); 