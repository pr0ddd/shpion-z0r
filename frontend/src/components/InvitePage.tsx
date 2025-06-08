import React, { useEffect, useState } from 'react';
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
  Alert
} from '@mui/material';
import { serverAPI } from '../services/api';

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
  };
  inviter: {
    id: string;
    username: string;
    avatar?: string;
  };
  isAlreadyMember?: boolean;
}

export default function InvitePage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadInviteInfo();
  }, [inviteCode]);

  const loadInviteInfo = async () => {
    if (!inviteCode) return;

    try {
      const response = await serverAPI.getInviteInfo(inviteCode);
      if (response.success && response.data) {
        setInviteInfo(response.data);
      } else {
        setError('Приглашение не найдено или недействительно');
      }
    } catch (error) {
      console.error('Error loading invite info:', error);
      setError('Ошибка загрузки информации о приглашении');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async () => {
    if (!inviteCode) return;

    setJoining(true);
    try {
      const response = await serverAPI.useInvite(inviteCode);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/app');
        }, 2000);
      } else {
        setError(response.error || 'Ошибка принятия приглашения');
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
      setError('Ошибка принятия приглашения');
    } finally {
      setJoining(false);
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
      <Box 
        sx={{ 
          minHeight: '100vh',
          bgcolor: '#36393f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#dcddde'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#5865f2', mb: 2 }} />
          <Typography variant="body1">Загрузка приглашения...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
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
            <Typography variant="h5" sx={{ mb: 2, color: '#ed4245' }}>
              Ошибка
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: '#b9bbbe' }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/app')}
              sx={{
                bgcolor: '#5865f2',
                '&:hover': { bgcolor: '#4752c4' }
              }}
            >
              Вернуться в приложение
            </Button>
          </CardContent>
        </Card>
      </Box>
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
      <Card sx={{ maxWidth: 500, bgcolor: '#2f3136', color: '#dcddde' }}>
        <CardContent sx={{ p: 4 }}>
                     {/* Server Info */}
           <Box sx={{ textAlign: 'center', mb: 3 }}>
             <Avatar
               sx={{ 
                 width: 80, 
                 height: 80, 
                 mx: 'auto', 
                 mb: 2,
                 bgcolor: '#5865f2',
                 fontSize: '2rem'
               }}
               src={inviteInfo?.server.icon}
             >
               {inviteInfo?.server.name?.charAt(0)?.toUpperCase()}
             </Avatar>
             
             <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
               {inviteInfo?.server.name}
             </Typography>
             
             <Typography variant="body1" sx={{ color: '#b9bbbe', mb: 2 }}>
               {inviteInfo?.server._count.members} участников
             </Typography>

             {status && (
               <Typography 
                 variant="body2" 
                 sx={{ 
                   color: status.color,
                   fontWeight: 500
                 }}
               >
                 {status.text}
               </Typography>
             )}
           </Box>

           <Divider sx={{ bgcolor: '#40444b', my: 3 }} />

           {/* Inviter Info */}
           <Box sx={{ mb: 3 }}>
             <Typography variant="body2" sx={{ color: '#8e9297', mb: 1 }}>
               Приглашение от:
             </Typography>
             <Typography variant="body1" sx={{ color: '#dcddde' }}>
               {inviteInfo?.inviter.username}
             </Typography>
           </Box>

           {/* Action Buttons */}
           <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
             <Button
               variant="outlined"
               onClick={() => navigate('/app')}
               sx={{
                 borderColor: '#40444b',
                 color: '#dcddde',
                 '&:hover': { 
                   borderColor: '#dcddde',
                   bgcolor: 'rgba(220, 221, 222, 0.04)'
                 }
               }}
             >
               Отмена
             </Button>
             
             <Button
               variant="contained"
               onClick={acceptInvite}
               disabled={joining || !inviteInfo?.invite.isValid || inviteInfo?.isAlreadyMember}
               sx={{
                 bgcolor: '#5865f2',
                 minWidth: 120,
                 '&:hover': { bgcolor: '#4752c4' },
                 '&:disabled': { bgcolor: '#40444b' }
               }}
             >
               {joining ? (
                 <CircularProgress size={20} sx={{ color: '#dcddde' }} />
               ) : inviteInfo?.isAlreadyMember ? (
                 'Уже участник'
               ) : (
                 'Присоединиться'
               )}
             </Button>
           </Box>

          {/* Help Text */}
          <Typography 
            variant="body2" 
            sx={{ 
              textAlign: 'center', 
              color: '#8e9297', 
              mt: 3,
              fontSize: '0.75rem'
            }}
          >
            Присоединяясь к серверу, вы соглашаетесь с правилами сообщества
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
} 