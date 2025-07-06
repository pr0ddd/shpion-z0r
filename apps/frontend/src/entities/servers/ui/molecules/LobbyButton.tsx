import { useServerStore } from '@entities/server/model';
import { IconButton } from '@ui/atoms/IconButton';

const LobbyButton: React.FC = () => {
  const { setSelectedServerId } = useServerStore();

  return (
    <IconButton
      hasBorder={false}
      tooltip="Космическое пространство"
      icon={<img width={24} height={24} src="/lobby.png" alt="Lobby" />}
      onClick={() => setSelectedServerId(null)}
    />
  );
};

export default LobbyButton;
