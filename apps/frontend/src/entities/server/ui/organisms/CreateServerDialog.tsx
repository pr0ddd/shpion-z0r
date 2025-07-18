import React, { useEffect } from 'react';
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
import { useCreateServerDialog } from '@entities/server/model';

interface CreateServerDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateServerDialog: React.FC<CreateServerDialogProps> = ({
  open,
  onClose,
}) => {
  const { data: sfuList } = useSfuServersQuery();
  const { values, errors, serverError, isPending, handleChange, handleSubmit, reset } =
    useCreateServerDialog();

  // Reset form when dialog is opened
  useEffect(() => {
    if (open) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    onClose();
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await handleSubmit();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Создание своего сервера</DialogTitle>
      <Box
        component="form"
        onSubmit={onSubmit}
      >
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
                <MenuItem value="">
                  <em>По умолчанию (.env)</em>
                </MenuItem>
                {sfuList?.map((preset: any) => (
                  <MenuItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          {/* TODO: handle all error messages */}
          {typeof serverError === 'string' && (
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
            {isPending ? <CircularProgress size={24} /> : 'Создать'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default CreateServerDialog;
