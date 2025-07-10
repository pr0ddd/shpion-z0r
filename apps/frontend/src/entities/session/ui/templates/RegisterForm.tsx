import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useRegisterMutation } from '@entities/session';

export const RegisterForm: React.FC = () => {
  const { mutate, isPending, error } = useRegisterMutation();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutate({ email, username, password });
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
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isPending}
      />
      <TextField
        variant="outlined"
        margin="normal"
        required
        fullWidth
        id="username"
        label="Имя пользователя"
        name="username"
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={isPending}
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
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isPending}
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

      {/* TODO: move to ui/atoms */}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={isPending}
      >
        {isPending ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          'Зарегистрироваться'
        )}
      </Button>
    </Box>
  );
};

export default RegisterForm;
