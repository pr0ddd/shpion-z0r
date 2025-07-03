import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, Typography, Box, TextField, Button } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Server } from '@shared/types';

export interface InviteDialogProps {
  open: boolean;
  server: Server;
  onClose: () => void;
}

const InviteDialog: React.FC<InviteDialogProps> = ({ open, onClose, server }) => {
  const [copied, setCopied] = useState(false);
  const inviteLink = `${window.location.origin}/invite/${server.inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { bgcolor: '#2f3136', color: 'white' } }}>
      <DialogTitle>Пригласить друзей</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>Поделитесь этой ссылкой, чтобы пригласить кого-нибудь на этот сервер.</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField fullWidth value={inviteLink} InputProps={{ readOnly: true }} variant="filled" />
          <Button onClick={handleCopy} variant="contained" startIcon={<ContentCopyIcon />}>
            {copied ? 'Скопировано!' : 'Копировать'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default InviteDialog; 