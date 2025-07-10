import { useQuery } from '@tanstack/react-query';
import { inviteAPI } from '@shared/data';
import { QueryFunctionContext } from '@tanstack/react-query';

const fetchInviteInfo = async ({ queryKey }: QueryFunctionContext) => {
  const [, inviteCode] = queryKey as [string, string];
  const res = await inviteAPI.getPublicInviteInfo(inviteCode);
  if (res.success && res.data) return res.data;
  throw new Error('Failed to fetch invite info');
};

export const useInviteInfoQuery = (inviteCode: string) => {
  const { data, error, isFetching } = useQuery({
    queryKey: ['inviteInfo', inviteCode],
    queryFn: fetchInviteInfo,
    retry: false,
    enabled: !!inviteCode,
  });
  return {
    data,
    isFetching,
    error,
  };
};
