import { Box, Typography } from '@mui/material';
import { StreamCard } from '../atoms/StreamCard';
import MonitorIcon from '@mui/icons-material/Monitor';
import VideocamIcon from '@mui/icons-material/Videocam';
import CallEndIcon from '@mui/icons-material/CallEnd';

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
  return (
    <StreamCard>
      <Box
        sx={{
          height: '90px',
          width: '160px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top row with two buttons */}
        <Box
          sx={{
            display: 'flex',
            height: '60px',
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
            height: '30px',
            backgroundColor: 'unset',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            '&:hover': {
              backgroundColor: 'new.hover',
            },
          }}
        >
          <CallEndIcon 
            sx={{ 
              fontSize: 14, 
              color: 'new.red',
            }} 
          />
          <Typography
            variant="caption"
            sx={{
              color: 'new.red',
              fontSize: '0.65rem',
              fontWeight: 500,
            }}
          >
            Stop All
          </Typography>
        </Box>
      </Box>
    </StreamCard>
  );
}; 