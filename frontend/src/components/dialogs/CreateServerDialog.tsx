import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Storage as ServerIcon,
} from '@mui/icons-material';
import { colors } from '../../theme';
import { serverAPI } from '../../services/api';

interface CreateServerDialogProps {
  open: boolean;
  onClose: () => void;
  onServerCreated?: (server: any) => void;
}

const CreateServerDialog: React.FC<CreateServerDialogProps> = ({
  open,
  onClose,
  onServerCreated,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ name: '', description: '' });
      setError(null);
      setFieldErrors({});
      onClose();
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Название сервера обязательно';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Название должно содержать минимум 2 символа';
    } else if (formData.name.trim().length > 50) {
      errors.name = 'Название не должно превышать 50 символов';
    }
    
    if (formData.description && formData.description.length > 200) {
      errors.description = 'Описание не должно превышать 200 символов';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await serverAPI.createServer(
        formData.name.trim(),
        formData.description.trim() || undefined
      );
      
      if (response.success && response.data) {
        console.log('Server created:', response.data);
        onServerCreated?.(response.data);
        handleClose();
      } else {
        setError(response.error || 'Ошибка создания сервера');
      }
    } catch (err: any) {
      console.error('Server creation error:', err);
      setError(err.error || 'Ошибка создания сервера. Попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Очищаем ошибку поля при изменении
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: colors.background.secondary,
          borderRadius: 3,
          border: `1px solid rgba(255, 255, 255, 0.1)`,
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ServerIcon sx={{ color: colors.primary }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Создать сервер
          </Typography>
        </Box>
        
        <IconButton
          onClick={handleClose}
          disabled={isLoading}
          sx={{ color: colors.text.secondary }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Description */}
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Создайте свой сервер для общения с друзьями и коллегами
            </Typography>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Server Name */}
            <TextField
              fullWidth
              label="Название сервера *"
              value={formData.name}
              onChange={handleChange('name')}
              error={!!fieldErrors.name}
              helperText={fieldErrors.name || 'Придумайте уникальное название'}
              disabled={isLoading}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: colors.primary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: colors.primary,
                  },
                },
              }}
            />

            {/* Server Description */}
            <TextField
              fullWidth
              label="Описание (необязательно)"
              value={formData.description}
              onChange={handleChange('description')}
              error={!!fieldErrors.description}
              helperText={
                fieldErrors.description || 
                `Краткое описание сервера (${formData.description.length}/200)`
              }
              disabled={isLoading}
              multiline
              rows={3}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: colors.primary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: colors.primary,
                  },
                },
              }}
            />
          </Box>
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={handleClose}
            disabled={isLoading}
            sx={{
              color: colors.text.secondary,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            Отмена
          </Button>
          
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !formData.name.trim()}
            sx={{
              backgroundColor: colors.primary,
              color: 'white',
              px: 4,
              '&:hover': {
                backgroundColor: colors.primaryDark,
              },
              '&:disabled': {
                backgroundColor: colors.text.muted,
              },
            }}
          >
            {isLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                Создание...
              </Box>
            ) : (
              'Создать сервер'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateServerDialog; 