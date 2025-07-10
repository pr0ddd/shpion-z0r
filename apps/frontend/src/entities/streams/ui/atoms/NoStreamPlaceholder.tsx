import { Box } from '@mui/material';
import MonitorIcon from '@mui/icons-material/Monitor';


export const NoStreamPlaceholder = () => {
  return <Box>
    <MonitorIcon sx={{
      color: 'new.foregroundLight',
      fontSize: 48,
    }} />
  </Box>;
};