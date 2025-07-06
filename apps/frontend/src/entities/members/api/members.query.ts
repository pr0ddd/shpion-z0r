import { serverAPI } from '@shared/data';
import { QueryFunctionContext, useQuery } from '@tanstack/react-query';

const fetchMembers = async ({ queryKey }: QueryFunctionContext) => {
  const [, serverId] = queryKey as [string, string];
  const res = await serverAPI.getServerMembers(serverId);
  if (res.success && res.data) return res.data;
  throw new Error(res.error || 'Failed to fetch members');
};

export const useMembersQuery = (serverId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['members', serverId],
    queryFn: fetchMembers,
  });

  return { data, isLoading, error };
};
