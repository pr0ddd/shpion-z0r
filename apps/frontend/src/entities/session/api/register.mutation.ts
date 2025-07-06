import { authAPI } from '@shared/data';
import { LoginResponseData, LoginResponseError } from '@shared/types';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../model/auth.store';

interface RegisterDto {
  email: string;
  username: string;
  password: string;
}

const register = async ({
  email,
  username,
  password,
}: RegisterDto): Promise<LoginResponseData> => {
  try {
    const res = await authAPI.register(email, username, password);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to login');
  } catch (error) {
    throw error.response?.data.error || error.response?.data.errors[0];
  }
};

export const useRegisterMutation = () => {
  const navigate = useNavigate();
  const setUser = useSessionStore((s) => s.setUser);
  const setToken = useSessionStore((s) => s.setToken);

  const { mutate, isPending, error } = useMutation<
    LoginResponseData,
    LoginResponseError,
    RegisterDto,
    unknown
  >({
    mutationFn: register,
    onSuccess: (data) => {
      // TODO: clear local storage
      setUser(data.user);
      setToken(data.token);
      navigate('/');
    },
    onError: (error: unknown) => {
      console.error(error);
    },
  });

  return {
    mutate,
    isPending,
    error,
  };
};
