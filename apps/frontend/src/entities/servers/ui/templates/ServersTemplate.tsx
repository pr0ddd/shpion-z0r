import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import LobbyButton from '../molecules/LobbyButton';
import ServersList from '../organisms/ServersList';
import CreateServerButton from '../molecules/CreateServerButton';
// import LogoutButton from '@entities/session/ui/molecules/LogoutButton';
import { UnifiedMediaControlPanel } from '../organisms/UnifiedMediaControlPanel';
import { useServersQuery } from '@entities/servers/api';
import { useState } from 'react';

// Controls subsection separated to safely use LiveKit hooks only when rendered inside LiveKitRoom
export const MediaControlsSection: React.FC = () => {
  return (<UnifiedMediaControlPanel />);
};

export const ServersTemplate: React.FC<{ showControls?: boolean; collapsed?: boolean }> = ({ showControls = false, collapsed = false }) => {
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const bgDark = 'linear-gradient(135deg, #111827 0%, #1f2937 100%)';
  const bgLight = 'linear-gradient(135deg, #ffffff 0%, #f7f7f7 100%)';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'new.card',
        borderRight: '1px solid',
        borderColor: 'new.border',
        width: collapsed ? '72px' : '72px',
        flexShrink: 0,
        pb: 2
      }}
    >
      {/* Header – скрываем при collapsed */}
      {!collapsed && <HeaderSection />}

      {/* Quick access buttons removed; Lobby in header */}
      {collapsed && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25, pt: 0.25, '& button': { width: 44, height: 44, mx: 'auto', my: 0.25, p: 0, borderRadius: 1, backgroundColor: 'new.card', '& svg': { fontSize: 24 } } }}>
          <CreateServerButton />
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, px: 1, minHeight: 0 }}>
        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <ServersList isCompact={collapsed} />
        </Box>
        <Box sx={{ mt: 'auto', pt: 2, width: '100%' }}>
          {showControls && !collapsed && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <MediaControlsSection />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

const HeaderSection: React.FC = () => {
  const { data: servers } = useServersQuery();
  const totalMembers = servers?.reduce((sum, s) => sum + (s._count?.members ?? 0), 0) || 0;

  return (
    <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'new.border' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <CreateServerButton />
        </Box>
      </Box>
    </Box>
  );
};

// removed ConditionalMediaControls – logic moved to parent
