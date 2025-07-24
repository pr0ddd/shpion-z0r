import { useServerStore } from '@entities/server/model';
import { IconButton } from '@ui/atoms/IconButton';

const LobbyButton: React.FC = () => {
  const { setSelectedServerId } = useServerStore();

  return (
    <IconButton
      hasBorder={false}
      size="small"
      tooltip="Космическое пространство"
      icon={<img width={44} height={44} src="/lobby.png" alt="Lobby" />}
      onClick={() => setSelectedServerId(null)}
      sx={{ width:44, height:44, p:0, borderRadius:1, border:'1px solid', borderColor:'new.border', backgroundColor:'new.card' }}
    />
  );
};

export default LobbyButton;
