import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { Server } from '@shared/types';
import { useDeleteServerDialog } from '@entities/server/model';

export interface DeleteServerDialogProps {
  open: boolean;
  server: Server;
  onClose: () => void;
}

const DeleteServerDialog: React.FC<DeleteServerDialogProps> = ({
  open,
  server,
  onClose,
}) => {
  const { handleSubmit: deleteServer, isPending } = useDeleteServerDialog();

  const handleSubmit = async () => {
    await deleteServer(server.id);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Удалить сервер</DialogTitle>
      <DialogContent>
        Вы уверены, что хотите безвозвратно удалить сервер «{server.name}»?
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button color="error" onClick={handleSubmit}>
          {isPending ? <CircularProgress size={20} /> : 'Удалить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteServerDialog;
