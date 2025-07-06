import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link, Outlet } from 'react-router-dom';

interface AuthTemplateProps {
  isLoginMode: boolean;
}

export const AuthTemplate: React.FC<AuthTemplateProps> = ({ isLoginMode }) => {
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
          mb: 4,
          bgcolor: 'transparent',
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          🎮 Shpion
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Голосовой чат для геймеров
        </Typography>
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
