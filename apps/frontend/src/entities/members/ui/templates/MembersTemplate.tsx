import { ServerMembers } from '@entities/members/ui';
import { useServerStore } from '@entities/server/model';
import { useMemberSocketUpdates } from '@entities/members/model/useMemberSocketUpdates';

export const MembersTemplate: React.FC = () => {
  const { selectedServerId } = useServerStore();

  // Подписка на события обновления профиля
  useMemberSocketUpdates();

  return <ServerMembers serverId={selectedServerId!} />;
};
