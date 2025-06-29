import { FC } from 'react';
import { Box, Typography } from '@mui/material';
import ForumIcon from '@mui/icons-material/Forum';

export const ServerPlaceholder: FC = () => (
  <Box sx={{ flexGrow: 1 }}>
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexGrow: 1,
        background: '#36393f',
        color: '#8e9297',
        textAlign: 'center',
        p: 3,
      }}
    >
      <ForumIcon sx={{ fontSize: 100, mb: 3, color: '#4f545c' }} />
      <Typography
        variant="h4"
        component="div"
        gutterBottom
        sx={{ color: '#ffffff', fontWeight: 'bold' }}
      >
        Ваши беседы ждут вас
      </Typography>
      <Typography variant="h6" sx={{ maxWidth: '400px' }}>
        Выберите сервер из списка слева, чтобы присоединиться к голосовому
        каналу и начать общение.
      </Typography>
    </Box>
  </Box>
);
