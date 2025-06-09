import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Container,
  Paper
} from '@mui/material';
import { serverAPI } from '../services/api';
import { useServer } from '../contexts/ServerContext';
import { Server } from '../types';

interface InviteInfo {
  invite: {
    id: string;
    code: string;
    expiresAt: string | null;
    maxUses: number | null;
    usedCount: number;
    isValid: boolean;
  };
  server: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    _count: {
      members: number;
    };
    memberCount: number;
  };
  inviter: {
    id: string;
    username: string;
    avatar?: string;
  };
  isAlreadyMember?: boolean;
}

const InvitePage: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { selectServer } = useServer();

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadInviteInfo = useCallback(async () => {
    if (!inviteCode) {
      setError("Код приглашения не найден.");
      setLoading(false);
      return;
    }
    try {
      const response = await serverAPI.getInviteInfo(inviteCode);
      if (response.success && response.data) {
        setInviteInfo(response.data);
      } else {
        setError(response.error || "Неверный или истекший код приглашения.");
      }
    } catch (err) {
      setError("Произошла ошибка при проверке приглашения.");
    } finally {
      setLoading(false);
    }
  }, [inviteCode]);

  useEffect(() => {
    loadInviteInfo();
  }, [loadInviteInfo]);

  const handleAcceptInvite = async () => {
    if (!inviteCode || !inviteInfo) return;
    try {
      const response = await serverAPI.useInvite(inviteCode);
      if (response.success) {
        const serverToSelect: Server = {
          id: inviteInfo.server.id,
          name: inviteInfo.server.name,
          members: [],
          voiceParticipants: [],
        };
        selectServer(serverToSelect);
        navigate('/');
      } else {
        setError(response.error || "Не удалось принять приглашение.");
      }
    } catch (err) {
      setError("Произошла ошибка при принятии приглашения.");
    }
  };

  const getInviteStatus = () => {
    if (!inviteInfo) return null;
    
    const invite = inviteInfo.invite;
    const now = new Date();
    const expires = invite.expiresAt ? new Date(invite.expiresAt) : null;
    
    if (!invite.isValid) return { text: 'Недействительное приглашение', color: '#ed4245' };
    if (expires && expires < now) return { text: 'Приглашение истекло', color: '#ed4245' };
    if (invite.maxUses && invite.usedCount >= invite.maxUses) return { text: 'Приглашение исчерпано', color: '#ed4245' };
    
    return { text: 'Действующее приглашение', color: '#57f287' };
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h5" color="error">{error}</Typography>
        <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
          На главную
        </Button>
      </Container>
    );
  }

  if (success) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          bgcolor: '#36393f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3
        }}
      >
        <Card sx={{ maxWidth: 400, bgcolor: '#2f3136', color: '#dcddde' }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h5" sx={{ mb: 2, color: '#57f287' }}>
              Успешно!
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: '#b9bbbe' }}>
              Вы присоединились к серверу "{inviteInfo?.server.name}"
            </Typography>
            <Typography variant="body2" sx={{ color: '#8e9297' }}>
              Перенаправление в приложение...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const status = getInviteStatus();

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ mt: 8, p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Вас пригласили на сервер
        </Typography>
        <Typography variant="h5" sx={{ mb: 2 }}>
          {inviteInfo?.server.name}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Участников: {inviteInfo?.server._count.members}
        </Typography>
        <Button variant="contained" size="large" onClick={handleAcceptInvite}>
          Принять приглашение
        </Button>
      </Paper>
    </Container>
  );
};

export default InvitePage; 