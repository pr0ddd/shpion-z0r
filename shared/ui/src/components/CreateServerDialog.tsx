import React, { useState } from 'react';
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
  Stack,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { serverAPI } from '@shared/data';
import { useServer } from '@shared/hooks';
import { useSfuList } from '@shared/hooks/api/useSfuList';
import { useQueryClient } from '@tanstack/react-query';

interface CreateServerDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateServerDialog: React.FC<CreateServerDialogProps> = ({ open, onClose }) => {
  const { selectServer } = useServer();
  const { data: sfuList } = useSfuList();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sfuId, setSfuId] = useState<string | ''>('');
  const [icon, setIcon] = useState<string | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleClose = () => {
    setName('');
    setDescription('');
    setSfuId('');
    setIcon(null);
    setIconPreview(null);
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
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        sfuId: sfuId || undefined,
      };
      const response = await serverAPI.createServer(payload);
      if (response.success && response.data) {
        queryClient.setQueryData(['servers'], (old: any) => {
          if (!Array.isArray(old)) return [response.data];
          if (old.some((s: any) => s.id === response.data!.id)) return old;
          return [...old, response.data];
        });

        queryClient.invalidateQueries({ queryKey: ['servers'] });

        selectServer(response.data);
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
          <Stack direction="column" spacing={2}>
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
            <TextField
              margin="dense"
              label="Описание"
              fullWidth
              variant="standard"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              multiline
              rows={2}
            />
            <Stack direction="row" spacing={2} alignItems="center">
              {iconPreview ? (
                <Avatar src={iconPreview} variant="square" sx={{ width:48, height:48, borderRadius:1.5, objectFit:'cover' }} />
              ) : (
                <Avatar variant="square" sx={{ width:48, height:48, borderRadius:1.5 }} />
              )}
              <Button component="label" disabled={isLoading} variant="outlined" size="small">
                Загрузить иконку
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const result = reader.result as string;
                      setIcon(result);
                      setIconPreview(result);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </Button>
            </Stack>
            <FormControl fullWidth variant="standard">
              <InputLabel>SFU сервер</InputLabel>
              <Select
                value={sfuId}
                onChange={(e)=>setSfuId(e.target.value as string)}
                disabled={isLoading}
              >
                <MenuItem value=""><em>По умолчанию (.env)</em></MenuItem>
                {sfuList?.map((preset: any)=> (
                  <MenuItem key={preset.id} value={preset.id}>{preset.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
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