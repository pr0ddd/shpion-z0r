import React, { useEffect, useState } from 'react';
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

import { useSfuServersQuery } from '@queries';
import { Server } from '@shared/types';
import { useUpdateServerDialog } from '@entities/server/model';

interface UpdateServerDialogProps {
  open: boolean;
  server: Server;
  onClose: () => void;
}

const UpdateServerDialog: React.FC<UpdateServerDialogProps> = ({
  open,
  server,
  onClose,
}) => {
  const { data: sfuList } = useSfuServersQuery();
  const [latencies, setLatencies] = useState<Record<string, number | null>>({});

  const pingServer = async (sfuUrl: string, timeout = 3000): Promise<number | null> => {
    try {
      const { hostname } = new URL(sfuUrl.replace(/^ws/, 'http'));
      const target = `https://${hostname}/`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      const start = performance.now();
      await fetch(target, { method: 'HEAD', mode: 'no-cors', cache: 'no-store', signal: controller.signal });
      clearTimeout(timer);
      return Math.round(performance.now() - start);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!sfuList?.length) return;
    (async () => {
      const pairs = await Promise.all(
        sfuList.map(async (s) => [s.id, await pingServer((s as any).url)])
      );
      setLatencies(Object.fromEntries(pairs));
    })();
  }, [sfuList]);

  const { values, errors, serverError, isPending, handleChange, handleSubmit } =
    useUpdateServerDialog(server);

  useEffect(() => {
    if (open && sfuList?.length && !values.sfuId) {
      handleChange('sfuId', sfuList[0].id);
    }
  }, [open, sfuList]);

  const handleClose = () => {
    onClose();
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await handleSubmit(server.id);
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Настройки сервера</DialogTitle>
      <Box component="form" onSubmit={onSubmit}>
        <DialogContent>
          <Stack direction="column" spacing={2}>
            <TextField
              autoFocus
              margin="dense"
              label="Название сервера"
              fullWidth
              variant="standard"
              value={values.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={isPending}
              error={!!errors.name}
            />
            <TextField
              margin="dense"
              label="Описание"
              fullWidth
              variant="standard"
              value={values.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={isPending}
              multiline
              rows={2}
              error={!!errors.description}
            />
            <Stack direction="row" spacing={2} alignItems="center">
              {values.icon ? (
                <Avatar
                  src={values.icon}
                  variant="square"
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1.5,
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Avatar
                  variant="square"
                  sx={{ width: 48, height: 48, borderRadius: 1.5 }}
                />
              )}
              <Button
                component="label"
                disabled={isPending}
                variant="outlined"
                size="small"
              >
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
                      handleChange('icon', reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </Button>
            </Stack>
            <FormControl fullWidth variant="standard">
              <InputLabel>SFU сервер</InputLabel>
              <Select
                value={values.sfuId}
                onChange={(e) =>
                  handleChange('sfuId', e.target.value as string)
                }
                disabled={isPending}
              >
                {sfuList?.map((preset) => (
                  <MenuItem key={preset.id} value={preset.id}>
                    <Box sx={{ display:'flex', justifyContent:'space-between', width:'100%' }}>
                      {preset.name}
                      {latencies[preset.id] != null ? (
                        <Box component="span" sx={{ color: 'text.secondary' }}>{latencies[preset.id]} ms</Box>
                      ) : (
                        <Box component="span" sx={{ color: 'text.secondary' }}>n/a</Box>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          {/* TODO: handle all error messages */}
          {serverError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {serverError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isPending}>
            Отмена
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? <CircularProgress size={24} /> : 'Применить'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default UpdateServerDialog;
