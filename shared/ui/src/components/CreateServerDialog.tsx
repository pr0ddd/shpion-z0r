import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, Box, CircularProgress } from '@mui/material';
import { serverAPI } from '@shared/data';
import { useServer } from '@shared/hooks';

interface CreateServerDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateServerDialog: React.FC<CreateServerDialogProps> = ({ open, onClose }) => {
  const { setServers } = useServer();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setName('');
    setError('');
    setIsLoading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Название сервера не может быть пустым.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const response = await serverAPI.createServer(name);
      if (response.success && response.data) {
        handleClose();
      } else {
        setError(response.error || 'Не удалось создать сервер.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Произошла непредвиденная ошибка.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Создание своего сервера</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название сервера"
            fullWidth
            variant="standard"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isLoading}>Отмена</Button>
          <Button type="submit" disabled={isLoading || !name.trim()}>
            {isLoading ? <CircularProgress size={24} /> : 'Создать'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default CreateServerDialog; 