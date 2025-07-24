import { Box } from '@mui/material';
import ServersList from '../organisms/ServersList';
// import LogoutButton from '@entities/session/ui/molecules/LogoutButton';
import { UnifiedMediaControlPanel } from '../organisms/UnifiedMediaControlPanel';

// Controls subsection separated to safely use LiveKit hooks only when rendered inside LiveKitRoom
export const MediaControlsSection: React.FC = () => {
  return (<UnifiedMediaControlPanel />);
};

export const ServersTemplate: React.FC<{ showControls?: boolean; collapsed?: boolean }> = ({ showControls = false, collapsed = false }) => {
  // Placeholder state if needed in future

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

      {/* Кнопка создания сервера убрана из списка */}

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

// HeaderSection removed – unified header in parent

// removed ConditionalMediaControls – logic moved to parent
