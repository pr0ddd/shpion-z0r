import { useQuery } from "@tanstack/react-query";
import { serverAPI } from "@shared/data";

const fetchServers = async () => {
  const res = await serverAPI.getServers();
  if (res.success && res.data) return res.data;
  throw new Error(res.error || 'Failed to fetch servers');
};

export const useServersQuery = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['servers'],
    queryFn: fetchServers,
  });

  return { data, isLoading, error };
};