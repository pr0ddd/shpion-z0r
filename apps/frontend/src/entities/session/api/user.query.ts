import { useQuery } from '@tanstack/react-query';
import { authAPI } from '@shared/data';
import type { QueryFunctionContext } from '@tanstack/react-query';
import { useSessionStore } from '../model/auth.store';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const fetchUser = async (_: QueryFunctionContext) => {
  const res = await authAPI.me();
  if (res.success && res.data) return res.data;
  throw new Error('Failed to fetch user');
};

export const useUserQuery = () => {
  const navigate = useNavigate();
  const currentUser = useSessionStore((s) => s.user);
  const setUser = useSessionStore((s) => s.setUser);

  const { data, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
  });

  useEffect(() => {
    if (data && data.id !== currentUser?.id) {
      setUser(data);
      navigate('/');
    }
  }, [currentUser, data, setUser]);

  useEffect(() => {
    if (error) {
      navigate('/login');
    }
  }, [error]);

  return {
    data,
    isLoading,
    error,
  };
};
