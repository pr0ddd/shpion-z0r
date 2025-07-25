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
      <DialogTitle>Delete server</DialogTitle>
      <DialogContent>
        Are you sure you want to permanently delete server "{server.name}"?
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" onClick={handleSubmit}>
          {isPending ? <CircularProgress size={20} /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteServerDialog;
