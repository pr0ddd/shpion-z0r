import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Typography,
  Paper,
  Button,
} from '@mui/material';
import { colors } from '../theme';
import { serverAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const InvitePage: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showOptions, setShowOptions] = useState(false);

  const processInviteForAuthenticatedUser = useCallback(async () => {
    if (!inviteCode) return;
    
    try {
      const response = await serverAPI.useInvite(inviteCode);
      if (response.success) {
        console.log('InvitePage: Successfully joined server via invite');
      }
    } catch (error: any) {
      console.warn('InvitePage: Failed to process invite:', error.message);
    }
    
    // Всегда перенаправляем в приложение в конце
    navigate('/app');
  }, [inviteCode, navigate]);

  useEffect(() => {
    console.log('InvitePage: Processing invite', { inviteCode, user: !!user });
    
    if (!inviteCode) {
      console.log('InvitePage: No invite code, redirecting to app');
      navigate('/app');
      return;
    }

    if (!user) {
      // Показываем опции для неавторизованного пользователя через небольшую задержку
      setTimeout(() => setShowOptions(true), 1000);
      return;
    }

    // Авторизованный пользователь - автоматически обрабатываем приглашение
    console.log('InvitePage: User authenticated, processing invite automatically');
    processInviteForAuthenticatedUser();
  }, [user, inviteCode, navigate, processInviteForAuthenticatedUser]);

  if (user) {
    // Показываем loading для авторизованного пользователя
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${colors.background.tertiary} 0%, ${colors.background.primary} 100%)`,
          p: 3,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: colors.primary, mb: 3 }} />
          <Typography variant="h6" gutterBottom>
            Присоединяемся к серверу...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Пожалуйста, подождите
          </Typography>
        </Box>
      </Box>
    );
  }

  // Показываем опции для неавторизованного пользователя
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${colors.background.tertiary} 0%, ${colors.background.primary} 100%)`,
        p: 3,
      }}
    >
      {showOptions ? (
        <Paper
          elevation={8}
          sx={{
            p: 6,
            maxWidth: 400,
            width: '100%',
            textAlign: 'center',
            backgroundColor: colors.background.secondary,
            border: `1px solid rgba(255, 255, 255, 0.1)`,
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ color: colors.primary }}>
            Приглашение на сервер
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Чтобы присоединиться к серверу, войдите в свой аккаунт или создайте новый
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              component={Link}
              to="/login"
              state={{ returnTo: `/invite/${inviteCode}` }}
              variant="contained"
              size="large"
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                backgroundColor: colors.primary,
                '&:hover': {
                  backgroundColor: colors.primaryDark,
                },
              }}
            >
              Войти в аккаунт
            </Button>
            
            <Button
              component={Link}
              to="/register"
              state={{ returnTo: `/invite/${inviteCode}` }}
              variant="outlined"
              size="large"
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                borderColor: colors.primary,
                color: colors.primary,
                '&:hover': {
                  borderColor: colors.primaryDark,
                  backgroundColor: `rgba(${parseInt(colors.primary.slice(1, 3), 16)}, ${parseInt(colors.primary.slice(3, 5), 16)}, ${parseInt(colors.primary.slice(5, 7), 16)}, 0.1)`,
                },
              }}
            >
              Создать аккаунт
            </Button>
          </Box>
        </Paper>
      ) : (
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: colors.primary, mb: 3 }} />
          <Typography variant="h6" gutterBottom>
            Обрабатываем приглашение...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Пожалуйста, подождите
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default InvitePage; 