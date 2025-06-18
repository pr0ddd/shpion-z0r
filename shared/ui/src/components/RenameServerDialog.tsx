import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { serverAPI } from '@shared/data';
import { Server } from '@shared/types';
import { useQueryClient } from '@tanstack/react-query';

interface RenameServerDialogProps {
  open: boolean;
  server: Server | null;
  onClose: () => void;
}

const RenameServerDialog: React.FC<RenameServerDialogProps> = ({ open, server, onClose }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const qc = useQueryClient();

  useEffect(() => {
    setName(server?.name ?? '');
    setError('');
  }, [server]);

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!server) return;
    if (!name.trim()) {
      setError('Название не может быть пустым.');
      return;
    }
    setLoading(true);
    try {
      const res = await serverAPI.renameServer(server.id, name.trim());
      if (res.success && res.data) {
        // patch React Query cache ['servers']
        qc.setQueryData<Server[]>(['servers'], (old)=> old?.map((s)=> s.id===res.data!.id ? { ...s, name: res.data!.name } : s));
        onClose();
      } else {
        setError(res.error || 'Не удалось переименовать.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Произошла ошибка.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Переименование сервера</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Новое название"
            fullWidth
            variant="standard"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>Отмена</Button>
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? <CircularProgress size={24}/> : 'Сохранить'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RenameServerDialog; 