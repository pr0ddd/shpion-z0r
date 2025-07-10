import { useQuery } from '@tanstack/react-query';
import { authAPI } from '@shared/data';
import { QueryFunctionContext } from '@tanstack/react-query';
import { useSessionStore } from '../model/auth.store';
import { useEffect } from 'react';

const fetchUser = async (_: QueryFunctionContext) => {
  const res = await authAPI.me();
  if (res.success && res.data) return res.data;
  throw new Error('Failed to fetch user');
};

export const useUserQuery = () => {
  const token = useSessionStore((s) => s.token);
  const currentUser = useSessionStore((s) => s.user);
  const setUser = useSessionStore((s) => s.setUser);
  const clearSession = useSessionStore((s) => s.clearSession);

  const { data, isError, isFetching, status } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    retry: false,
    enabled: !!token && !currentUser,
  });

  useEffect(() => {
    if (status === 'success' && data) {
      setUser(data);
    }
  }, [status, data]);

  useEffect(() => {
    if (isError) {
      clearSession();
    }
  }, [isError]);

  return {
    data,
    isFetching,
  };
};
