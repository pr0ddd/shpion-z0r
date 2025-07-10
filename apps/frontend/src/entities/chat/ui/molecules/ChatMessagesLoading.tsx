import { Box } from '@mui/material';
import { CircularProgress } from '@ui/atoms/CircularProgress';

export const ChatMessagesLoading = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
      }}
    >
      <CircularProgress />
    </Box>
  );
};
