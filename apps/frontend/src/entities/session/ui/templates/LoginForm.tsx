import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useLoginMutation } from '@entities/session';
import { useAppStore } from '@stores/useAppStore';

export const LoginForm: React.FC = () => {
  const setIsRedEyes = useAppStore((s) => s.setIsRedEyes);
  const { mutate: login, isPending: loading, error } = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ mt: 1, width: '100%', maxWidth: '400px' }}
    >
      <TextField
        variant="outlined"
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email"
        name="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />
      <TextField
        variant="outlined"
        margin="normal"
        required
        fullWidth
        name="password"
        label="Пароль"
        type="password"
        id="password"
        autoComplete="current-password"
        value={password}
        onFocus={() => setIsRedEyes(true)}
        onBlur={() => setIsRedEyes(false)}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
      />
      {error && typeof error === 'object' && (
        <Typography key={error.path} color="error" sx={{ mt: 2 }}>
          {error.msg}
        </Typography>
      )}
      {error && typeof error === 'string' && (
        <Typography key={error} color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Войти'}
      </Button>
    </Box>
  );
};
