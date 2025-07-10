import { inviteAPI } from '@shared/data';
import { Server } from '@shared/types';
import { useMutation } from '@tanstack/react-query';
import { useAuthHandlers } from '../model/useAuthHandlers';

interface AcceptInviteDto {
  inviteCode: string;
}

interface AcceptInviteError {
  error: string;
  success: false;
}

const acceptInvite = async ({
  inviteCode,
}: AcceptInviteDto): Promise<Server> => {
  try {
    const res = await inviteAPI.useInvite(inviteCode);
    if (res.success && res.data) return res.data;
    throw new Error('Failed to login');
  } catch (error: any) {
    throw error.response.data.error || error.response.data.errors[0];
  }
};

export const useAcceptInviteMutation = () => {
  const { handleAcceptInviteSuccess } = useAuthHandlers();

  const { mutate, isPending, error } = useMutation<
    Server,
    AcceptInviteError,
    AcceptInviteDto,
    unknown
  >({
    mutationFn: acceptInvite,
    onSuccess: (data) => handleAcceptInviteSuccess(data),
    onError: (error: AcceptInviteError) => {
      console.error(error);
    },
  });

  return {
    mutate,
    isPending,
    error,
  };
};
