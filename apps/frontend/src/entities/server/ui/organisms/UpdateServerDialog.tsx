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
      <DialogTitle>Server settings</DialogTitle>
      <Box component="form" onSubmit={onSubmit}>
        <DialogContent>
          <Stack direction="column" spacing={2}>
            <TextField
              autoFocus
              margin="dense"
              label="Server name"
              fullWidth
              variant="standard"
              value={values.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={isPending}
              error={!!errors.name}
            />
            <TextField
              margin="dense"
              label="Description"
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
                Upload icon
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
              <InputLabel>SFU server</InputLabel>
              <Select
                value={values.sfuId}
                onChange={(e) =>
                  handleChange('sfuId', e.target.value as string)
                }
                disabled={isPending}
              >
                {sfuList?.map((preset) => (
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
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? <CircularProgress size={24} /> : 'Apply'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default UpdateServerDialog;
