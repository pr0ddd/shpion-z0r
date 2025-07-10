import { authAPI } from '@shared/data';
import { LoginResponseData, LoginResponseError } from '@shared/types';
import { useMutation } from '@tanstack/react-query';
import { useAuthHandlers } from '../model/useAuthHandlers';

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
  const { handleLoginSuccess } = useAuthHandlers();

  const { mutate, isPending, error } = useMutation<
    LoginResponseData,
    LoginResponseError,
    RegisterDto,
    unknown
  >({
    mutationFn: register,
    onSuccess: (data) => handleLoginSuccess(data),
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
