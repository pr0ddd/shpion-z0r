import { Box, Typography } from '@mui/material';
import { Server } from '@shared/types';
import { Avatar } from '@ui/atoms/Avatar';
import { dicebearAvatar } from '@libs/dicebearAvatar';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import { useServerActivityStore } from '@entities/servers/model/useServerActivity';

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
  const streamCount = useServerActivityStore((s) => s.activities[server.id]?.streamCount ?? 0);

  return (
    <Box
      onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        onSetMenuAnchor(e.currentTarget);
        onSetMenuServer(server);
      }}
    >
      <Box
        onClick={() => onSelectServer(server)}
        sx={(theme) => {
          const defaultGradient = 'linear-gradient(135deg, rgba(59,130,246,0.20) 0%, rgba(168,85,247,0.20) 100%)'; // blue-500/20 to purple-500/20
          const selectedGradient = 'linear-gradient(135deg, #111827 0%, #1f2937 100%)';
          return {
            p: 0,
            borderRadius: '8px',
            cursor: 'pointer',
            background: active ? defaultGradient : selectedGradient,
            border: '1px solid',
            borderColor: 'new.border',
            backdropFilter: 'blur(6px)',
          };
        }}
      >

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              src={server.icon || dicebearAvatar(server.id)}
              sx={{ width: 40, height: 40, borderRadius: '7px 0 0 7px' }}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body1" noWrap sx={{ maxWidth: 160 }}>
              {server.name}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

