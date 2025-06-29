import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  DialogActions,
} from '@mui/material';

export interface DeleteServerDialogProps {
  open: boolean;
  serverName: string;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteServerDialog: React.FC<DeleteServerDialogProps> = ({
  open,
  serverName,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Удалить сервер</DialogTitle>
      <DialogContent>
        Вы уверены, что хотите безвозвратно удалить сервер «{serverName}»?
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button color="error" onClick={onConfirm}>
          Удалить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteServerDialog;
