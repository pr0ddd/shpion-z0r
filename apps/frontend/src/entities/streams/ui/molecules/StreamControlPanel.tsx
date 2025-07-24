import { Box, Typography } from '@mui/material';
import MonitorIcon from '@mui/icons-material/Monitor';
import VideocamIcon from '@mui/icons-material/Videocam';
import DesktopAccessDisabledIcon from '@mui/icons-material/DesktopAccessDisabled';

interface StreamControlPanelProps {
  onStartScreenShare: () => void;
  onStartCamera: () => void;
  onStopAll: () => void;
  showStopAll?: boolean;
}

export const StreamControlPanel: React.FC<StreamControlPanelProps> = ({
  onStartScreenShare,
  onStartCamera,
  onStopAll,
  showStopAll = false,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      {/* Top row with two buttons */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent:'center', py:0.5 }}>
        {/* Screen share button */}
        <Box
          component="button"
          onClick={onStartScreenShare}
          sx={{
            flex: 1,
            backgroundColor: 'unset',
            border: '1px solid',
            borderColor: 'new.border',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            borderRadius: 2,
            '&:hover': { backgroundColor: 'new.redLight' },
          }}
        >
          <MonitorIcon
            sx={{
              fontSize: 16,
              color: 'new.foreground',
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: 'new.foreground',
              fontSize: '0.65rem',
              fontWeight: 500,
              textAlign: 'center',
              lineHeight: 1,
            }}
          >
            Screen
          </Typography>
        </Box>

        {/* Camera button */}
        <Box
          component="button"
          onClick={onStartCamera}
          sx={{
            flex: 1,
            backgroundColor: 'unset',
            border: '1px solid',
            borderColor: 'new.border',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            borderRadius: 2,
            '&:hover': { backgroundColor: 'new.redLight' },
          }}
        >
          <VideocamIcon
            sx={{
              fontSize: 16,
              color: 'new.foreground',
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: 'new.foreground',
              fontSize: '0.65rem',
              fontWeight: 500,
              textAlign: 'center',
              lineHeight: 1,
            }}
          >
            Camera
          </Typography>
        </Box>
      </Box>

      {showStopAll && (
        <Box
          component="button"
          onClick={onStopAll}
          sx={{
            height: '45px',
            backgroundColor: 'unset',
            color: 'new.foreground',
            border: '1px solid',
            borderColor: 'new.border',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            borderRadius: 2,
            '&:hover': { backgroundColor: 'new.redLight' },
          }}
        >
          <DesktopAccessDisabledIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption">Stop All</Typography>
        </Box>
      )}
    </Box>
  );
};
