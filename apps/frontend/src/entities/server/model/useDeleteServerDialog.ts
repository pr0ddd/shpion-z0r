import { useDeleteServerMutation } from '../api';

export function useDeleteServerDialog() {
  const { mutate, isPending } = useDeleteServerMutation();

  const handleSubmit = async (serverId: string) => {
    mutate({ serverId });
  };

  return {
    isPending,
    handleSubmit,
  };
}
