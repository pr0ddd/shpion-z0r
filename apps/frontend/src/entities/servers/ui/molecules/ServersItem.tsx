import { Box, Typography } from '@mui/material';
import { Server } from '@shared/types';
import { IconButton } from '@ui/atoms/IconButton';

interface ServersItemProps {
  /**
   * сервер
   */
  server: Server;
  /**
   * true = сервер выбран
   */
  active: boolean;
  /**
   * вызывается при клике на сервер, выбирает сервер
   */
  onSelectServer: (server: Server) => void;
  /**
   * вызывается при клике правой кнопкой мыши на сервер, открывает меню
   */
  onSetMenuAnchor: (anchorEl: HTMLElement) => void;
  /**
   * вызывается при клике правой кнопкой мыши на сервер, устанавливает сервер для меню
   */
  onSetMenuServer: (server: Server) => void;
}

export const ServersItem: React.FC<ServersItemProps> = ({
  server,
  active,
  onSelectServer,
  onSetMenuAnchor,
  onSetMenuServer,
}) => {
  return (
    <IconButton
      hasBorder={false}
      sx={{ p: 0, borderRadius: 1 }}
      icon={
        server.icon ? (
          <Box
            component="img"
            src={server.icon}
            alt={server.name}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 1,
              pointerEvents: 'none',
            }}
          />
        ) : (
          <Typography component="strong" variant="body1" sx={{ fontWeight: 600 }}>
            {server.name.slice(0, 2)}
          </Typography>
        )
      }
      color={active ? ('primary' as any) : ('accent' as any)}
      onClick={() => onSelectServer(server)}
      onContextMenu={(e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        onSetMenuAnchor(e.currentTarget);
        onSetMenuServer(server);
      }}
    />
  );
};
