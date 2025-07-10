import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAcceptInviteMutation, useInviteInfoQuery } from '@entities/session';

const InvitePage: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { data: inviteInfo, isFetching: isLoading } = useInviteInfoQuery(
    inviteCode || ''
  );

  const navigate = useNavigate();
  const { mutate: acceptInvite, isPending, error } = useAcceptInviteMutation();

  const handleJoin = async () => {
    if (!inviteCode) return;

    acceptInvite({ inviteCode });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400, mx: 'auto' }}>
        {error ? (
          <>
            <Typography variant="h5" color="error" gutterBottom>
              Ошибка
            </Typography>
            <Alert severity="error">
              {error?.error || 'Приглашение не найдено.'}
            </Alert>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              sx={{ mt: 2 }}
            >
              Взяться за дело
            </Button>
          </>
        ) : inviteInfo ? (
          <>
            <Typography variant="h5" gutterBottom>
              Вас пригласили присоединиться к серверу
            </Typography>
            <Avatar
              variant="rounded"
              src={inviteInfo.icon || undefined}
              sx={{ mb: 2, mx: 'auto', bgcolor: 'new.sidebarAccent' }}
            >
              <Typography
                component="strong"
                variant="body1"
                sx={{ fontWeight: 600, color: 'new.foreground' }}
              >
                {inviteInfo.name.slice(0, 2)}
              </Typography>
            </Avatar>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              Участников онлайн: {inviteInfo.memberCount}
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleJoin}
              disabled={isPending}
            >
              {isPending ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Принять приглашение'
              )}
            </Button>
          </>
        ) : (
          <></>
        )}
      </Paper>
    </Box>
  );
};

export default InvitePage;
