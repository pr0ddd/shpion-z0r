import { Box, CircularProgress, Typography } from '@mui/material';

export const LiveKitRoomLoading = () => {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <CircularProgress size={60} sx={{ mb: 3 }} />
      <Typography variant="h6" sx={{ textAlign: 'center' }}>
        {'Загрузка...'}
      </Typography>
    </Box>
  );
};
