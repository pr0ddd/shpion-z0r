import { Avatar, Tooltip, Typography } from '@mui/material';
import { Server } from '@shared/types';
import { ServerButton } from './ServersSidebar.styles';

interface ServerItemProps {
  server: Server;
  isSelected: boolean;
  currentUserId: string | undefined;
  onClick: (server: Server) => void;
  onOpenMenu: (server: Server, anchorEl: HTMLElement) => void;
}

const ServerItem: React.FC<ServerItemProps> = ({
  server,
  isSelected,
  currentUserId,
  onClick,
  onOpenMenu,
}: ServerItemProps) => {
  return (
    <Tooltip title={server.name} placement="right">
      <ServerButton
        className="allow-context"
        isSelected={isSelected.toString()}
        onClick={() => onClick(server)}
        onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
          e.preventDefault();
          if (server.ownerId !== currentUserId) return;
          onOpenMenu(server, e.currentTarget);
        }}
      >
        {server.icon ? (
          <Avatar
            src={server.icon}
            variant="square"
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1.5,
              objectFit: 'cover',
            }}
          />
        ) : (
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {server.name.charAt(0).toUpperCase()}
          </Typography>
        )}
      </ServerButton>
    </Tooltip>
  );
};

export default ServerItem;
