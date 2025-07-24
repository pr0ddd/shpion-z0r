import { Box, Typography, Tooltip } from '@mui/material';
import { Server } from '@shared/types';
import { Avatar } from '@ui/atoms/Avatar';
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
  /**
   * компактный режим – только аватар без имени
   */
  compact?: boolean;
}

export const ServersItem: React.FC<ServersItemProps> = ({
  server,
  active,
  onSelectServer,
  onSetMenuAnchor,
  onSetMenuServer,
  compact = false,
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
      <Tooltip title={server.name} placement="right" arrow>
        <Box
          onClick={() => onSelectServer(server)}
          sx={(theme) => {
            const defaultGradient = 'linear-gradient(135deg, rgba(59,130,246,0.20) 0%, rgba(168,85,247,0.20) 100%)'; // blue-500/20 to purple-500/20
            const selectedGradient = 'linear-gradient(135deg, #111827 0%, #1f2937 100%)';

            return {
              width: 44,
              height: 44,
              marginInline: 'auto',
              my: 0.25,
              borderRadius: 1,
              overflow: 'visible',
              cursor: 'pointer',
              position: 'relative',
              background: active ? defaultGradient : selectedGradient,
              border: '1px solid',
              borderColor: 'new.border',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            };
          }}
        >
          <Avatar src={server.icon || undefined} sx={{ width: 44, height: 44, borderRadius: '7px' }} />
          {active && (
            <Box sx={{ position:'absolute', left:-5, top:'50%', transform:'translateY(-50%)', width:3, height:24, bgcolor:'primary.main', borderRadius:1 }} />
          )}
        </Box>
      </Tooltip>
    </Box>
  );
};

