import { useQuery } from '@tanstack/react-query';
import { sfuAPI } from '@shared/data';
import { SfuServer } from '@shared/types';

export const useSfuList = () =>
  useQuery<SfuServer[], Error>({
    queryKey: ['sfuList'],
    queryFn: async () => {
      const res = await sfuAPI.getList();
      if (res.success && res.data) return res.data;
      throw new Error(res.error || 'Failed to fetch SFU list');
    },
    staleTime: 1000 * 60 * 10,
  });
