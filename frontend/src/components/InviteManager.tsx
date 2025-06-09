import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, IconButton, CircularProgress, TextField, Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { useServer } from '../contexts/ServerContext';
import { inviteAPI } from '../services/api';

interface InviteManagerProps {
  open: boolean;
  onClose: () => void;
}

const InviteManager: React.FC<InviteManagerProps> = ({ open, onClose }) => {
  const { selectedServer, setServers } = useServer();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  if (!selectedServer) return null;

  const inviteLink = `${window.location.origin}/invite/${selectedServer.inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopySuccess('Скопировано!');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const response = await inviteAPI.regenerateInviteCode(selectedServer.id);
      if (response.success && response.data) {
        // Update the server in the global context with the new invite code
        setServers(prev => prev.map(s => 
          s.id === selectedServer.id 
            ? { ...s, inviteCode: response.data!.inviteCode } 
            : s
        ));
      }
    } catch (error) {
      console.error("Failed to regenerate invite code", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Пригласить друзей на сервер "{selectedServer.name}"</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Поделитесь этой ссылкой с друзьями, чтобы они могли присоединиться к вашему серверу.
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            value={inviteLink}
            InputProps={{
              readOnly: true,
            }}
          />
          <Tooltip title={copySuccess || "Копировать"} placement="top">
            <IconButton onClick={handleCopy} sx={{ ml: 1 }}>
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
        <Button 
          onClick={handleRegenerate} 
          variant="outlined"
          startIcon={isRegenerating ? <CircularProgress size={20} /> : <AutorenewIcon />}
          disabled={isRegenerating}
        >
          Создать новую ссылку
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteManager; 