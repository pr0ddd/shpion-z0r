import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  CircularProgress,
  Avatar,
  Stack,
  InputLabel,
  Typography,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import { serverAPI } from '@shared/data';
import { Server } from '@shared/types';
import { useQueryClient } from '@tanstack/react-query';
import { useSfuList } from '@shared/hooks/api/useSfuList';

export interface ServerSettingsDialogProps {
  open: boolean;
  server: Server | null;
  onClose: () => void;
}

const ServerSettingsDialog: React.FC<ServerSettingsDialogProps> = ({ open, server, onClose }) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sfuId, setSfuId] = useState<string | ''>('');
  const [icon, setIcon] = useState<string | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { data: sfuList } = useSfuList();

  // Populate fields when server changes
  useEffect(() => {
    if (!server) return;
    setName(server.name || '');
    setDescription(server.description || '');
    setSfuId(server.sfuId || '');
    setIcon(server.icon);
    setIconPreview(server.icon);
    setError('');
  }, [server]);

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setIcon(result);
      setIconPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!server) return;
    if (!name.trim()) {
      setError('Название сервера не может быть пустым.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload: any = {
        name: name.trim(),
        description: description.trim(),
        sfuId: sfuId || null,
        icon: icon,
      };
      const res = await serverAPI.updateServer(server.id, payload);
      if (res.success && res.data) {
        queryClient.invalidateQueries({ queryKey: ['servers'] });
        onClose();
      } else {
        setError(res.error || 'Не удалось сохранить настройки.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Произошла непредвиденная ошибка.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Настройки сервера</DialogTitle>
      <DialogContent>
        <Stack direction="column" spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Название"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            fullWidth
          />
          <TextField
            label="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            fullWidth
            multiline
            rows={3}
          />
          <Stack direction="row" spacing={2} alignItems="center">
            {iconPreview ? (
              <Avatar src={iconPreview} variant="square" sx={{ width:56, height:56, borderRadius:1.5, objectFit:'cover' }} />
            ) : (
              <Avatar variant="square" sx={{ width:56, height:56, borderRadius:1.5 }} />
            )}
            <Button component="label" disabled={loading} variant="outlined" size="small">
              Загрузить иконку
              <input type="file" accept="image/*" hidden onChange={handleIconChange} />
            </Button>
            {iconPreview && (
              <Button disabled={loading} size="small" color="error" onClick={()=>{setIcon(null);setIconPreview(null);}}>
                Убрать
              </Button>
            )}
          </Stack>
          <FormControl fullWidth variant="standard">
            <InputLabel>SFU сервер</InputLabel>
            <Select value={sfuId} onChange={(e)=>setSfuId(e.target.value as string)} disabled={loading}>
              <MenuItem value=""><em>По умолчанию (.env)</em></MenuItem>
              {sfuList?.map((preset: any)=>(<MenuItem key={preset.id} value={preset.id}>{preset.name}</MenuItem>))}
            </Select>
          </FormControl>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Отмена</Button>
        <Button onClick={handleSave} disabled={loading || !name.trim()}>
          {loading ? <CircularProgress size={24} /> : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServerSettingsDialog; 