import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { colors } from '../theme';
import { authAPI, serverAPI } from '../services/api';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.email) {
      errors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Неверный формат email';
    }
    
    if (!formData.username) {
      errors.username = 'Имя пользователя обязательно';
    } else if (formData.username.length < 3) {
      errors.username = 'Имя пользователя должно содержать минимум 3 символа';
    } else if (formData.username.length > 20) {
      errors.username = 'Имя пользователя не должно превышать 20 символов';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Только буквы, цифры и подчеркивания';
    }
    
    if (!formData.password) {
      errors.password = 'Пароль обязателен';
    } else if (formData.password.length < 6) {
      errors.password = 'Пароль должен содержать минимум 6 символов';
    } else if (formData.password.length > 50) {
      errors.password = 'Пароль не должен превышать 50 символов';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Подтвердите пароль';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await authAPI.register(
        formData.email,
        formData.username,
        formData.password
      );
      
      if (response.success && response.data) {
        // Сохраняем токен
        console.log('💾 RegisterPage: Saving credentials to localStorage...');
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Проверяем что сохранилось
        const savedToken = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('user');
        console.log('✅ RegisterPage: Token saved:', !!savedToken);
        console.log('✅ RegisterPage: User saved:', !!savedUser);
        
        // Проверяем есть ли returnTo в state с invite кодом
        const returnTo = location.state?.returnTo;
        console.log('RegisterPage: Registration successful, returnTo:', returnTo);
        
        // Если returnTo содержит invite code, обрабатываем его
        if (returnTo && returnTo.includes('/invite/')) {
          const inviteCode = returnTo.split('/invite/')[1];
          console.log('RegisterPage: Processing invite code:', inviteCode);
          
          try {
            // Автоматически используем приглашение
            const inviteResponse = await serverAPI.useInvite(inviteCode);
            if (inviteResponse.success) {
              console.log('RegisterPage: Successfully joined server via invite');
            }
          } catch (error: any) {
            console.warn('RegisterPage: Failed to process invite:', error.message);
            // Не прерываем поток - просто логируем ошибку
          }
        }
        
        // Всегда перенаправляем в главное приложение
        navigate('/app');
      } else {
        setError(response.error || 'Ошибка регистрации');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.error?.includes('email')) {
        setError('Пользователь с таким email уже существует');
      } else if (err.error?.includes('username')) {
        setError('Имя пользователя уже занято');
      } else {
        setError(err.error || 'Ошибка регистрации. Попробуйте снова.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Очищаем ошибку поля при изменении
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background.primary,
        p: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 6,
          maxWidth: 450,
          width: '100%',
          backgroundColor: colors.background.secondary,
          border: `1px solid rgba(255, 255, 255, 0.1)`,
          borderRadius: 3,
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: colors.primary }}>
            Shpion
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
            Создать аккаунт
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Присоединяйтесь к сообществу
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Email Field */}
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: colors.text.secondary }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: colors.primary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: colors.primary,
                  },
                },
              }}
            />

            {/* Username Field */}
            <TextField
              fullWidth
              label="Имя пользователя"
              value={formData.username}
              onChange={handleChange('username')}
              error={!!fieldErrors.username}
              helperText={fieldErrors.username || 'Ваш уникальный идентификатор и отображаемое имя'}
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: colors.text.secondary }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: colors.primary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: colors.primary,
                  },
                },
              }}
            />

            {/* Password Field */}
            <TextField
              fullWidth
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange('password')}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password || 'Минимум 6 символов'}
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: colors.text.secondary }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={isLoading}
                      sx={{ color: colors.text.secondary }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: colors.primary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: colors.primary,
                  },
                },
              }}
            />

            {/* Confirm Password Field */}
            <TextField
              fullWidth
              label="Подтвердите пароль"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              error={!!fieldErrors.confirmPassword}
              helperText={fieldErrors.confirmPassword}
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: colors.text.secondary }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      disabled={isLoading}
                      sx={{ color: colors.text.secondary }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: colors.primary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: colors.primary,
                  },
                },
              }}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                backgroundColor: colors.primary,
                '&:hover': {
                  backgroundColor: colors.primaryDark,
                },
                '&:disabled': {
                  backgroundColor: colors.text.muted,
                },
              }}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={20} color="inherit" />
                  Регистрация...
                </Box>
              ) : (
                'Создать аккаунт'
              )}
            </Button>
          </Box>
        </form>

        {/* Login Link */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" color="textSecondary">
            Уже есть аккаунт?{' '}
            <Link 
              to="/login" 
              style={{ 
                color: colors.primary, 
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Войти
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterPage; 