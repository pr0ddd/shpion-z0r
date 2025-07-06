import { ServerMembers } from '@entities/members/ui';
import { useServerStore } from '@entities/server/model';

export const MembersTemplate: React.FC = () => {
  const { selectedServerId } = useServerStore();

  return <ServerMembers serverId={selectedServerId!} />;
};
