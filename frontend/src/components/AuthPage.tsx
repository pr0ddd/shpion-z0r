import React, { useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthPage: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);

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

      {/* Форма входа/регистрации */}
      {isLoginMode ? (
        <LoginForm />
      ) : (
        <RegisterForm />
      )}

      {/* Переключатель между входом и регистрацией */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {isLoginMode ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
        </Typography>
        <Button
          variant="text"
          onClick={() => setIsLoginMode(!isLoginMode)}
        >
          {isLoginMode ? 'Зарегистрироваться' : 'Войти'}
        </Button>
      </Box>
    </Box>
  );
};

export default AuthPage; 