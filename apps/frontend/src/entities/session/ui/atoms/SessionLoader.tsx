import { Box } from '@mui/material';
import { CircularProgress } from '@ui/atoms/CircularProgress';

export const SessionLoader = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100vw',
        height: '100vh',
      }}
    >
      <CircularProgress />
    </Box>
  );
};
