import { Box } from '@mui/material';
import LobbyButton from '../molecules/LobbyButton';
import ServersList from '../organisms/ServersList';
import CreateServerButton from '../molecules/CreateServerButton';

export const ServersTemplate: React.FC = () => {
  return (
    <Box
      sx={{
        backgroundColor: 'new.sidebar',
        borderRight: '1px solid',
        borderColor: 'new.border',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          padding: 1,
        }}
      >
        <LobbyButton />
        <CreateServerButton />
        <ServersList />
      </Box>
    </Box>
  );
};
