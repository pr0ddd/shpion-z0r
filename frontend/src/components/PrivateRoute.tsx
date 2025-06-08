import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  console.log('🛡️ PrivateRoute:', { 
    path: location.pathname, 
    isLoading, 
    hasUser: !!user,
    userDetails: user ? `${user.username} (${user.id})` : 'none' 
  });

  // Показываем загрузку пока проверяем аутентификацию
  if (isLoading) {
    console.log('🛡️ PrivateRoute: Showing loading screen');
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background.primary,
          gap: 3,
        }}
      >
        <CircularProgress size={60} sx={{ color: colors.primary }} />
        <Typography variant="h6" color="textSecondary">
          Загрузка Shpion...
        </Typography>
      </Box>
    );
  }

  // Если пользователь не авторизован, перенаправляем на логин
  if (!user) {
    console.log('🛡️ PrivateRoute: No user, redirecting to login');
    return <Navigate to="/login" state={{ returnTo: location.pathname }} replace />;
  }

  // Если всё ОК, рендерим дочерние компоненты
  console.log('🛡️ PrivateRoute: User authenticated, rendering protected content');
  return <>{children}</>;
};

export default PrivateRoute; 