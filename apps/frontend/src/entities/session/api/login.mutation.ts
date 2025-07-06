import { authAPI } from '@shared/data';
import { LoginResponseData, LoginResponseError } from '@shared/types';
import { useMutation } from '@tanstack/react-query';
import { useSessionStore } from '../model/auth.store';
import { useNavigate } from 'react-router-dom';

interface LoginDto {
  email: string;
  password: string;
}

const login = async ({
  email,
  password,
}: LoginDto): Promise<LoginResponseData> => {
  try {
    const res = await authAPI.login(email, password);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to login');
  } catch (error: any) {
    throw error.response.data.error || error.response.data.errors[0];
  }
};

export const useLoginMutation = () => {
  const navigate = useNavigate();
  const setUser = useSessionStore((s) => s.setUser);
  const setToken = useSessionStore((s) => s.setToken);

  const { mutate, isPending, error } = useMutation<
    LoginResponseData,
    LoginResponseError,
    LoginDto,
    unknown
  >({
    mutationFn: login,
    onSuccess: (data) => {
      // TODO: clear local storage
      setUser(data.user);
      setToken(data.token);
      navigate('/');
    },
    onError: (error: any) => {
      console.error(error);
    },
  });

  return {
    mutate,
    isPending,
    error,
  };
};
