import { Box, Typography } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import LobbyButton from '../molecules/LobbyButton';
import ServersList from '../organisms/ServersList';
import CreateServerButton from '../molecules/CreateServerButton';
import LogoutButton from '@entities/session/ui/molecules/LogoutButton';
import { useServersQuery } from '@entities/servers/api';

export const ServersTemplate: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'new.card',
        borderRight: '1px solid',
        borderColor: 'new.border',
        width: '260px',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <HeaderSection />

      {/* Quick access buttons removed; Lobby in header */}

      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, px: 1 }}>
        <ServersList />
        <Box sx={{ mt: 'auto', pt: 2 }}>
          <LogoutButton />
        </Box>
      </Box>
    </Box>
  );
};

const HeaderSection: React.FC = () => {
  const { data: servers } = useServersQuery();
  const totalMembers = servers?.reduce((sum, s) => sum + (s._count?.members ?? 0), 0) || 0;

  return (
    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'new.border' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Servers
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Choose your workspace
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <LobbyButton />
          <CreateServerButton />
        </Box>
      </Box>
    </Box>
  );
};
