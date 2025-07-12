import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AnimatedContainer, FadeInUp } from '@ui/motion';

interface AuthTemplateProps {

}

export const AuthTemplate: React.FC<AuthTemplateProps> = () => {
  const location = useLocation();
  const isLoginMode = location.pathname === '/login';

  return (
    <AnimatedContainer sx={{ gap: 4 }}>
      <FadeInUp>
        <Paper elevation={0} sx={{ textAlign: 'center', bgcolor: 'transparent' }}>
          <Typography variant="h2" component="h1" gutterBottom mb={0}>
            Shpion
          </Typography>
        </Paper>
      </FadeInUp>

      <FadeInUp delay={0.2}>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Outlet />
        </Box>
      </FadeInUp>

      <FadeInUp delay={0.4}>
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
      </FadeInUp>
    </AnimatedContainer>
  );
};
