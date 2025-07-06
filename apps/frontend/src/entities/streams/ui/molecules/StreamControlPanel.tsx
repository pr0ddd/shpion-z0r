import { Box, lighten, Typography, useTheme } from '@mui/material';
import { StreamCard } from '../atoms/StreamCard';
import MonitorIcon from '@mui/icons-material/Monitor';
import VideocamIcon from '@mui/icons-material/Videocam';
import CallEndIcon from '@mui/icons-material/CallEnd';
import DesktopAccessDisabledIcon from '@mui/icons-material/DesktopAccessDisabled';

interface StreamControlPanelProps {
  onStartScreenShare: () => void;
  onStartCamera: () => void;
  onStopAll: () => void;
}

export const StreamControlPanel: React.FC<StreamControlPanelProps> = ({
  onStartScreenShare,
  onStartCamera,
  onStopAll,
}) => {
  const theme = useTheme();

  return (
    <StreamCard>
      <Box
        sx={{
          height: '110px',
          width: '190px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top row with two buttons */}
        <Box
          sx={{
            display: 'flex',
            height: '65px',
          }}
        >
          {/* Screen share button */}
          <Box
            component="button"
            onClick={onStartScreenShare}
            sx={{
              flex: 1,
              backgroundColor: 'unset',
              border: 'none',
              borderRight: '1px solid',
              borderRightColor: 'new.border',
              borderBottom: '1px solid',
              borderBottomColor: 'new.border',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              '&:hover': {
                backgroundColor: 'new.hover',
              },
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
              border: 'none',
              borderBottom: '1px solid',
              borderBottomColor: 'new.border',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              '&:hover': {
                backgroundColor: 'new.hover',
              },
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

        {/* Bottom row with stop button */}
        <Box
          component="button"
          onClick={onStopAll}
          sx={{
            height: '45px',
            backgroundColor: 'new.redLight',
            color: 'new.foreground',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            '&:hover': {
              backgroundColor: lighten(theme.palette.new.redLight, 0.1),
            },
          }}
        >
          <DesktopAccessDisabledIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption">Stop All</Typography>
        </Box>
      </Box>
    </StreamCard>
  );
};
