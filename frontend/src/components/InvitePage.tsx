import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Avatar, CircularProgress, Alert } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import { useAuth } from '../contexts/AuthContext';
import { useServer } from '../contexts/ServerContext';
import { inviteAPI } from '../services/api';
import { PublicInviteInfo } from '../types';

const InvitePage: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { setServers, servers } = useServer();

  const [inviteInfo, setInviteInfo] = useState<PublicInviteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inviteCode) {
      setError("Код приглашения не указан.");
      setIsLoading(false);
      return;
    }

    const fetchInviteInfo = async () => {
      try {
        const response = await inviteAPI.getPublicInviteInfo(inviteCode);
        if (response.success && response.data) {
          setInviteInfo(response.data);
        } else {
          setError(response.error || 'Недействительный или истекший код приглашения.');
        }
      } catch (err) {
        setError('Не удалось загрузить информацию о приглашении.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInviteInfo();
  }, [inviteCode]);

  const handleJoin = async () => {
    if (!inviteCode) return;

    if (!user) {
      sessionStorage.setItem('pendingInviteCode', inviteCode);
      navigate('/auth');
      return;
    }
    
    // Check if user is already a member
    const isAlreadyMember = servers.some(server => server.id === inviteInfo?.id);
    if(isAlreadyMember) {
        navigate('/');
        // Maybe select the server?
        return;
    }

    setIsJoining(true);
    try {
      const response = await inviteAPI.useInvite(inviteCode);
      if (response.success && response.data) {
        setServers(prev => [...prev, response.data!]);
        navigate('/');
      } else {
        setError(response.error || 'Не удалось присоединиться к серверу.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Произошла ошибка при присоединении.');
    } finally {
      setIsJoining(false);
    }
  };
  
  // After login, check for a pending invite
  useEffect(() => {
      const pendingInvite = sessionStorage.getItem('pendingInviteCode');
      if (user && !authLoading && pendingInvite) {
        sessionStorage.removeItem('pendingInviteCode');
        // Re-trigger join flow with the pending code
        navigate(`/invite/${pendingInvite}`, { replace: true });
      }
  }, [user, authLoading, navigate]);

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
        {error || !inviteInfo ? (
          <>
            <Typography variant="h5" color="error" gutterBottom>Ошибка</Typography>
            <Alert severity="error">{error || 'Приглашение не найдено.'}</Alert>
            <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
              На главную
            </Button>
          </>
        ) : (
          <>
            <Avatar src={inviteInfo.icon || undefined} sx={{ width: 80, height: 80, mb: 2, mx: 'auto' }}>
              <GroupIcon sx={{ fontSize: 50 }} />
            </Avatar>
            <Typography variant="h5" gutterBottom>
              Вас пригласили присоединиться к серверу
            </Typography>
            <Typography variant="h4" sx={{ mb: 2 }}>
              {inviteInfo.name}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              Участников онлайн: {inviteInfo.memberCount}
            </Typography>
            <Button 
              variant="contained" 
              size="large" 
              onClick={handleJoin} 
              disabled={isJoining}
            >
              {isJoining ? <CircularProgress size={24} color="inherit" /> : 'Принять приглашение'}
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default InvitePage; 