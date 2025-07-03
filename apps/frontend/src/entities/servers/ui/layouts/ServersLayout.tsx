import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import LobbyButton from '../molecules/LobbyButton';
import ServersList from '../organisms/ServersList';
import CreateServerButton from '../molecules/CreateServerButton';

export const ServersLayout: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: 72,
        padding: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing(1.5),
        backgroundColor: 'background.default',
        position: 'relative',
      }}
    >
      <LobbyButton />

      <Box
        sx={{
          width: '32px',
          height: '1px',
          flexGrow: 0,
          margin: theme.spacing(0.5, 'auto'),
          backgroundColor: 'background.paper',
        }}
      />

      <ServersList />

      <CreateServerButton />
    </Box>
  );
};
