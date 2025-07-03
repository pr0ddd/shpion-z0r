import { Box, lighten, Tooltip, useTheme } from '@mui/material';

interface IconButtonProps {
  tooltip: string;
  icon?: React.ReactNode;
  iconSrc?: string;
  label?: string;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement>) => void;
  active: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  tooltip,
  icon,
  iconSrc,
  label,
  onClick,
  onContextMenu,
  active,
}) => {
  const theme = useTheme();
  return (
    <Tooltip title={tooltip} placement="right">
      <Box
        component="button"
        sx={{
          width: 50,
          height: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px',
          transition: 'transform .2s',
          backgroundColor: 'background.paper',
          border: 'none',
          color: 'text.secondary',
          '&:hover': {
            transform: 'scale(1.05)',
            ...(active
              ? {
                  backgroundColor: lighten(theme.palette.primary.main, 0.15),
                  color: theme.palette.primary.contrastText,
                }
              : {
                  backgroundColor: lighten(theme.palette.background.paper, 0.1),
                  color: theme.palette.text.primary,
                }),
          },
          ...(active && {
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
          }),

          '&::after': {
            content: '""',
            position: 'absolute',
            left: -10,
            top: 20,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            opacity: active ? 1 : 0,
            transition: 'opacity .2s',
          },
        }}
        onClick={onClick}
        onContextMenu={onContextMenu}
      >
        {/* <LobbyIcon sx={{ width: 32, height: 32, color: 'common.white' }} /> */}
        {iconSrc && (
          <Box
            component="img"
            src={iconSrc}
            alt="Lobby"
            sx={{ width: '32px', height: '32px', color: 'common.white' }}
          />
        )}
        {icon && icon}
        {label && (
          <Box component="span" sx={{ fontSize: '12px', fontWeight: 600 }}>
            {label}
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};
