import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { serverAPI } from '../services/api';

interface CreateServerDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newServer: any) => void;
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: theme.palette.background.paper,
  },
}));

const StyledDialogTitle = styled(DialogTitle)({
  paddingBottom: 1,
});

const StyledDialogContent = styled(DialogContent)({
  paddingBottom: 2,
});

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(0, 3, 2, 3),
}));

export const CreateServerDialog: React.FC<CreateServerDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Название сервера обязательно');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await serverAPI.createServer(name.trim(), description.trim());
      
      if (response.success && response.data) {
        onSuccess(response.data);
        handleClose();
      } else {
        setError(response.error || 'Ошибка создания сервера');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Ошибка создания сервера');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <StyledDialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <StyledDialogTitle>
        Создать сервер
      </StyledDialogTitle>
      
      <Box component="form" onSubmit={handleSubmit}>
        <StyledDialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            autoFocus
            margin="normal"
            id="name"
            label="Название сервера"
            type="text"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Мой крутой сервер"
            helperText="Это имя будет видно всем участникам"
          />
          
          <TextField
            margin="normal"
            id="description"
            label="Описание (необязательно)"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Краткое описание сервера..."
            helperText="Расскажите, о чем ваш сервер"
          />
        </StyledDialogContent>
        
        <StyledDialogActions>
          <Button 
            onClick={handleClose}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button 
            type="submit"
            variant="contained"
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? 'Создание...' : 'Создать сервер'}
          </Button>
        </StyledDialogActions>
      </Box>
    </StyledDialog>
  );
}; 