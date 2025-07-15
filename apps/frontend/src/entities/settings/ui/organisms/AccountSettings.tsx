import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import { Avatar } from '@ui/atoms/Avatar';
import { useSessionStore } from '@entities/session/model/auth.store';
import { useUpdateAvatarMutation } from '../../api/updateAvatar.mutation';
import { useUpdateProfileMutation } from '../../api/updateProfile.mutation';

export const AccountSettings: React.FC = () => {
  const user = useSessionStore((s) => s.user);
  const [displayName, setDisplayName] = useState(user?.username || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { mutate: updateAvatar, status: avatarStatus } = useUpdateAvatarMutation();
  const { mutate: updateProfile, status: profileStatus } = useUpdateProfileMutation();
  const isUpdating = avatarStatus === 'pending';
  const isSaving = avatarStatus === 'pending' || profileStatus === 'pending';

  const [snackbar, setSnackbar] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({ open: false, msg: '', severity: 'success' });

  const showSnackbar = (msg: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, msg: msg, severity });
  };

  const handleAvatarButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAvatarPreview(base64);
      setPendingAvatar(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const promises: Promise<any>[] = [];

    if (pendingAvatar) {
      promises.push(
        new Promise((resolve, reject) => {
          updateAvatar(pendingAvatar, {
            onSuccess: () => resolve(null),
            onError: reject,
          });
        })
      );
    }

    if (displayName && displayName !== user?.username) {
      promises.push(
        new Promise((resolve, reject) => {
          updateProfile(displayName, {
            onSuccess: (updated) => resolve(updated),
            onError: reject,
          });
        })
      );
    }

    if (promises.length === 0) return;

    Promise.all(promises)
      .then(() => {
        showSnackbar('Изменения сохранены');
        setPendingAvatar(null);
      })
      .catch((err) => {
        console.error(err);
        showSnackbar('Не удалось сохранить изменения', 'error');
      });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h6">Профиль пользователя</Typography>
        <Typography variant="body2" color="new.mutedForeground">
          Настройте отображаемое имя и аватар для вашего профиля
        </Typography>
      </Box>

      <Card
        sx={{
          backgroundColor: 'new.card',
          border: '1px solid',
          borderColor: 'new.border',
        }}
      >
        <CardHeader title={<Typography variant="subtitle1">Основная информация</Typography>} />
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Аватар */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={avatarPreview || ''} sx={{ width: 80, height: 80 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" size="small" onClick={handleAvatarButtonClick} disabled={isUpdating}>
                {isUpdating ? 'Загрузка...' : 'Загрузить аватар'}
              </Button>
              <input
                type="file"
                accept="image/*"
                hidden
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <Typography variant="caption" color="new.mutedForeground">
                Рекомендуемый размер: 128x128px. Максимум 2MB.
              </Typography>
            </Box>
          </Box>

          {/* Имя */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle2">Отображаемое имя</Typography>
            <TextField
              size="small"
              variant="filled"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Введите ваше имя"
              inputProps={{ maxLength: 32 }}
            />
            <Typography variant="caption" color="new.mutedForeground">
              Это имя будет видно другим пользователям
            </Typography>
          </Box>

          {/* Статус */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle2">Статус аккаунта</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, bgcolor: 'new.green', borderRadius: '50%' }} />
              <Typography variant="body2">Активен</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving || (!pendingAvatar && displayName === user?.username)}
        >
          {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}; 