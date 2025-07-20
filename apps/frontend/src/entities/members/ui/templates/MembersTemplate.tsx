import { ServerMembers } from '@entities/members/ui';
import { useServerStore } from '@entities/server/model';
import { useMemberSocketUpdates } from '@entities/members/model/useMemberSocketUpdates';
import { useMemberJoinLeaveSound } from '@entities/members/model/useMemberJoinLeaveSound';

export const MembersTemplate: React.FC = () => {
  const { selectedServerId } = useServerStore();

  // Подписка на события обновления профиля
  useMemberSocketUpdates();
  // Звук при входе/выходе участников
  useMemberJoinLeaveSound(selectedServerId);

  return <ServerMembers serverId={selectedServerId!} />;
};
