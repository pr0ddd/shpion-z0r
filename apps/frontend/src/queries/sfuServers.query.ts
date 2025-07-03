import { useQuery } from '@tanstack/react-query';
import { sfuAPI } from '@shared/data';
import { SfuServer } from '@shared/types';

const fetchSfuServers = async (): Promise<SfuServer[]> => {
  const res = await sfuAPI.getList();
  if (res.success && res.data) return res.data;
  throw new Error(res.error || 'Failed to fetch SFU list');
};

export const useSfuServersQuery = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['sfuList'],
    queryFn: fetchSfuServers,
  });

  return { data, isLoading };
};
