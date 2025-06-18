import { useQuery } from '@tanstack/react-query';

export const useSfuAvailability = (url: string | undefined) =>
  useQuery<boolean, Error>({
    queryKey: ['sfuAvailable', url],
    enabled: !!url,
    staleTime: 0,
    refetchInterval: 10000,
    queryFn: async () => {
      if (!url) return false;
      // convert ws:// -> http://, wss:// -> https://
      const httpUrl = url.replace(/^ws/, 'http');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        const res = await fetch(httpUrl, { method: 'HEAD', signal: controller.signal });
        return res.ok;
      } catch {
        return false;
      } finally {
        clearTimeout(timeout);
      }
    },
  }); 