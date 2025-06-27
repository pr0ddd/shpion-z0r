import { Box, BoxProps } from '@mui/material';

export const LobbyIcon = ({ sx, ...rest }: BoxProps) => (
  <Box
    component="img"
    src="/lobby.png"
    alt="Lobby"
    sx={{ width: '1em', height: '1em', display: 'block', ...sx }}
    {...rest}
  />
);