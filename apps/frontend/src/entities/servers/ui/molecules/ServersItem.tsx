import { Box, Typography, Tooltip, useTheme } from '@mui/material';
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
  const hasIcon = Boolean(server.icon);
  const initials = server.name.replace(/\s+/g, '').slice(0, 2).toUpperCase();
  const theme = useTheme();
  const idleGradient = theme.palette.gradients.serverIdle;
  const hoverGradient = theme.palette.gradients.serverHover;

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
            return {
              width: 44,
              height: 44,
              marginInline: 'auto',
              my: 0.25,
              borderRadius: '50%',
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              backgroundColor: 'transparent',
              border: 'none',
              borderColor: 'new.border',
              transition: 'background .25s ease',
              backdropFilter: hasIcon ? undefined : 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover .server-avatar': {
                background: hasIcon ? 'transparent' : hoverGradient,
              },
            };
          }}
        >
          <Avatar
            className="server-avatar"
            src={hasIcon ? (server.icon as string) : undefined}
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: hasIcon ? 'transparent' : idleGradient,
              color: hasIcon ? 'inherit' : 'common.white',
              transition: 'background .25s ease',
            }}
          >
            {!hasIcon && (
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                {initials}
              </Typography>
            )}
          </Avatar>
          {active && (
            <Box sx={{
              position:'absolute',
              left:-8,
              top: '8px',
              width:4,
              height:28,
              borderRadius:2,
              background:'linear-gradient(180deg, #5865F2 0%, #A855F7 100%)'
            }} />
          )}
        </Box>
      </Tooltip>
    </Box>
  );
};

