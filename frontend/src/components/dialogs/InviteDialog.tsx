import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { serverAPI } from '../../services/api';

interface Invite {
  id: string;
  code: string;
  serverId: string;
  creatorId: string;
  maxUses?: number;
  uses: number;
  expiresAt?: string;
  createdAt: string;
  isActive: boolean;
}

interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
  serverId: string;
  serverName: string;
}

export const InviteDialog: React.FC<InviteDialogProps> = ({
  open,
  onClose,
  serverId,
  serverName,
}) => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await serverAPI.getInvites(serverId);
      if (response.success && response.data) {
        setInvites(response.data);
      }
    } catch (error: any) {
      setError(error.message || 'Ошибка загрузки приглашений');
    } finally {
      setIsLoading(false);
    }
  }, [serverId]);

  // Load existing invites
  useEffect(() => {
    if (open && serverId) {
      loadInvites();
    }
  }, [open, serverId, loadInvites]);

  const createInvite = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await serverAPI.createInvite(serverId, {
        maxUses: 10, // Ограничение на 10 использований
        expiresInHours: 24, // Истекает через 24 часа
      });
      
      if (response.success && response.data) {
        setInvites(prev => [response.data, ...prev]);
        setSuccessMessage('Приглашение создано!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error: any) {
      setError(error.message || 'Ошибка создания приглашения');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteInvite = async (inviteId: string) => {
    try {
      const response = await serverAPI.deleteInvite(inviteId);
      if (response.success) {
        setInvites(prev => prev.filter(inv => inv.id !== inviteId));
        setSuccessMessage('Приглашение удалено');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error: any) {
      setError(error.message || 'Ошибка удаления приглашения');
    }
  };

  const copyInviteLink = async (code: string) => {
    const inviteUrl = `${window.location.origin}/invite/${code}`;
    
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setSuccessMessage('Ссылка скопирована в буфер обмена!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setSuccessMessage('Ссылка скопирована!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const getInviteStatus = (invite: Invite) => {
    if (!invite.isActive) return { label: 'Неактивно', color: 'default' as const };
    
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return { label: 'Истекло', color: 'error' as const };
    }
    
    if (invite.maxUses && invite.uses >= invite.maxUses) {
      return { label: 'Исчерпано', color: 'warning' as const };
    }
    
    return { label: 'Активно', color: 'success' as const };
  };

  const formatExpiration = (expiresAt?: string) => {
    if (!expiresAt) return 'Не истекает';
    
    const expDate = new Date(expiresAt);
    const now = new Date();
    const diffHours = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours <= 0) return 'Истекло';
    if (diffHours < 24) return `${diffHours} ч.`;
    
    const diffDays = Math.ceil(diffHours / 24);
    return `${diffDays} дн.`;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#2f3136',
          color: 'white',
        },
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <ShareIcon />
        Пригласить людей на "{serverName}"
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {/* Create new invite */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Создать приглашение
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Создайте ссылку-приглашение для добавления новых участников на сервер.
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={createInvite}
            disabled={isLoading}
            sx={{
              bgcolor: '#5865f2',
              '&:hover': { bgcolor: '#4752c4' },
            }}
          >
            Создать приглашение
          </Button>
        </Box>

        <Divider sx={{ my: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Existing invites */}
        <Typography variant="h6" gutterBottom>
          Активные приглашения ({invites.length})
        </Typography>

        {invites.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            Нет активных приглашений
          </Typography>
        ) : (
          <List sx={{ p: 0 }}>
            {invites.map((invite) => {
              const status = getInviteStatus(invite);
              return (
                <ListItem
                  key={invite.id}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 1,
                    mb: 1,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {invite.code}
                        </Typography>
                        <Chip
                          label={status.label}
                          size="small"
                          color={status.color}
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Использований: {invite.uses}
                          {invite.maxUses && ` / ${invite.maxUses}`}
                          {' • '}
                          Истекает: {formatExpiration(invite.expiresAt)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      onClick={() => copyInviteLink(invite.code)}
                      sx={{ color: '#5865f2', mr: 1 }}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => deleteInvite(invite.id)}
                      sx={{ color: '#f04747' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Button onClick={onClose} color="inherit">
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 