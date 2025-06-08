import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Tooltip,
  Snackbar,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { serverAPI } from '../services/api';

interface Invite {
  id: string;
  code: string;
  serverId: string;
  creatorId: string;
  maxUses: number | null;
  uses: number;
  expiresAt: string | null;
  createdAt: string;
  isActive: boolean;
}

interface InviteManagerProps {
  open: boolean;
  onClose: () => void;
  serverId: string;
  serverName: string;
}

export default function InviteManager({ open, onClose, serverId, serverName }: InviteManagerProps) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Форма создания приглашения
  const [newInvite, setNewInvite] = useState({
    maxUses: '',
    expiresInHours: ''
  });

  // Загружаем приглашения при открытии
  useEffect(() => {
    if (open && serverId) {
      loadInvites();
    }
  }, [open, serverId]);

  const loadInvites = async () => {
    setLoading(true);
    try {
      const response = await serverAPI.getServerInvites(serverId);
      if (response.success && response.data) {
        setInvites(response.data);
      }
    } catch (error) {
      console.error('Error loading invites:', error);
      showMessage('Ошибка загрузки приглашений', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    setLoading(true);
    try {
      const data: any = {};
      if (newInvite.maxUses) data.maxUses = parseInt(newInvite.maxUses);
      if (newInvite.expiresInHours) data.expiresInHours = parseInt(newInvite.expiresInHours);

      const response = await serverAPI.createInvite(serverId, data);
      if (response.success) {
        setNewInvite({ maxUses: '', expiresInHours: '' });
        setShowCreateForm(false);
        loadInvites();
        showMessage('Приглашение создано', 'success');
      }
    } catch (error) {
      console.error('Error creating invite:', error);
      showMessage('Ошибка создания приглашения', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteInvite = async (inviteId: string) => {
    try {
      const response = await serverAPI.deleteInvite(inviteId);
      if (response.success) {
        loadInvites();
        showMessage('Приглашение удалено', 'success');
      }
    } catch (error) {
      console.error('Error deleting invite:', error);
      showMessage('Ошибка удаления приглашения', 'error');
    }
  };

  const copyInviteLink = (code: string) => {
    const link = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(link);
    showMessage('Ссылка скопирована в буфер обмена', 'success');
  };

  const showMessage = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const getInviteStatus = (invite: Invite) => {
    if (!invite.isActive) return { label: 'Неактивно', color: 'error' as const };
    
    const now = new Date();
    const expires = invite.expiresAt ? new Date(invite.expiresAt) : null;
    
    if (expires && expires < now) return { label: 'Истекло', color: 'error' as const };
    if (invite.maxUses && invite.uses >= invite.maxUses) return { label: 'Исчерпано', color: 'error' as const };
    
    return { label: 'Активно', color: 'success' as const };
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#36393f',
            color: '#dcddde',
            '& .MuiDialogTitle-root': {
              bgcolor: '#2f3136',
              borderBottom: '1px solid #202225'
            }
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinkIcon />
            <Typography variant="h6">Приглашения на {serverName}</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: '#dcddde' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Кнопка создания приглашения */}
          <Box sx={{ p: 2, borderBottom: '1px solid #202225' }}>
            {!showCreateForm ? (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateForm(true)}
                sx={{
                  bgcolor: '#5865f2',
                  '&:hover': { bgcolor: '#4752c4' }
                }}
              >
                Создать приглашение
              </Button>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle1" sx={{ color: '#dcddde' }}>
                  Новое приглашение
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Макс. использований"
                    type="number"
                    value={newInvite.maxUses}
                    onChange={(e) => setNewInvite(prev => ({ ...prev, maxUses: e.target.value }))}
                    placeholder="Без ограничений"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#40444b',
                        color: '#dcddde',
                        '& fieldset': { borderColor: '#202225' },
                        '&:hover fieldset': { borderColor: '#dcddde' }
                      },
                      '& .MuiInputLabel-root': { color: '#b9bbbe' }
                    }}
                  />
                  
                  <TextField
                    label="Истекает через (часов)"
                    type="number"
                    value={newInvite.expiresInHours}
                    onChange={(e) => setNewInvite(prev => ({ ...prev, expiresInHours: e.target.value }))}
                    placeholder="Никогда"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#40444b',
                        color: '#dcddde',
                        '& fieldset': { borderColor: '#202225' },
                        '&:hover fieldset': { borderColor: '#dcddde' }
                      },
                      '& .MuiInputLabel-root': { color: '#b9bbbe' }
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={createInvite}
                    disabled={loading}
                    sx={{
                      bgcolor: '#5865f2',
                      '&:hover': { bgcolor: '#4752c4' }
                    }}
                  >
                    Создать
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewInvite({ maxUses: '', expiresInHours: '' });
                    }}
                    sx={{
                      borderColor: '#202225',
                      color: '#dcddde',
                      '&:hover': { borderColor: '#dcddde' }
                    }}
                  >
                    Отмена
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

          {/* Список приглашений */}
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {invites.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="Нет приглашений"
                  secondary="Создайте первое приглашение на сервер"
                  sx={{
                    '& .MuiListItemText-primary': { color: '#dcddde' },
                    '& .MuiListItemText-secondary': { color: '#b9bbbe' }
                  }}
                />
              </ListItem>
            ) : (
              invites.map((invite) => {
                const status = getInviteStatus(invite);
                return (
                  <ListItem
                    key={invite.id}
                    sx={{
                      bgcolor: '#40444b',
                      mb: 1,
                      mx: 2,
                      borderRadius: 1,
                      '&:hover': { bgcolor: '#484c52' }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="body1" sx={{ color: '#dcddde', fontFamily: 'monospace' }}>
                            {invite.code}
                          </Typography>
                          <Chip
                            label={status.label}
                            color={status.color}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ color: '#b9bbbe' }}>
                          <Typography variant="body2">
                            Использований: {invite.uses}{invite.maxUses ? `/${invite.maxUses}` : ''}
                          </Typography>
                          <Typography variant="body2">
                            Создано: {formatDate(invite.createdAt)}
                          </Typography>
                          {invite.expiresAt && (
                            <Typography variant="body2">
                              Истекает: {formatDate(invite.expiresAt)}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex' }}>
                        <Tooltip title="Копировать ссылку">
                          <IconButton
                            onClick={() => copyInviteLink(invite.code)}
                            sx={{ color: '#dcddde' }}
                          >
                            <CopyIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton
                            onClick={() => deleteInvite(invite.id)}
                            sx={{ color: '#ed4245' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })
            )}
          </List>
        </DialogContent>

        <DialogActions sx={{ bgcolor: '#2f3136', borderTop: '1px solid #202225' }}>
          <Button onClick={onClose} sx={{ color: '#dcddde' }}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      {/* Уведомления */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
} 