import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link, Outlet, useLocation } from 'react-router-dom';

interface AuthTemplateProps {

}

export const AuthTemplate: React.FC<AuthTemplateProps> = () => {
  const location = useLocation();
  const isLoginMode = location.pathname === '/login';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      {/* Заголовок приложения */}
      <Paper
        elevation={0}
        sx={{
          textAlign: 'center',
          mb: 0,
          bgcolor: 'transparent',
        }}
      >
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={2}
        >
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            display="inline"
            mb={0}
          >
            Shpion
          </Typography>
        </Box>
      </Paper>

      <Outlet />

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {isLoginMode ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
        </Typography>
        <Link to={isLoginMode ? '/register' : '/login'}>
          <Button variant="text">
            {isLoginMode ? 'Зарегистрироваться' : 'Войти'}
          </Button>
        </Link>
      </Box>
    </Box>
  );
};
