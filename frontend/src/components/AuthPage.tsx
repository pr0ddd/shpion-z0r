import React, { useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export const AuthPage: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  const handleRegisterSuccess = () => {
    // После успешной регистрации страница автоматически обновится
    // потому что токен сохранен в localStorage
    window.location.reload();
  };

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
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
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
        <RegisterForm onSuccess={handleRegisterSuccess} />
      )}

      {/* Переключатель между входом и регистрацией */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {isLoginMode ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
        </Typography>
        <Button
          variant="text"
          onClick={() => setIsLoginMode(!isLoginMode)}
          sx={{ textTransform: 'none' }}
        >
          {isLoginMode ? 'Зарегистрироваться' : 'Войти'}
        </Button>
      </Box>
    </Box>
  );
}; 