import React from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
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
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: 'easeInOut' }}
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'new.foreground',
        gap: 4,
        position: 'relative',
        overflow: 'hidden',
        px: 2,
        minHeight: '100vh',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
          zIndex: 0,
        },
      }}
    >
      <Box sx={{ zIndex: 1, textAlign: 'center' }} component={motion.div} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}>
        {error ? (
          <>
            <Typography variant="h5" color="error" gutterBottom>
              Error
            </Typography>
            <Alert severity="error">
              {error?.error || 'Invitation not found.'}
            </Alert>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              sx={{ mt: 2 }}
            >
              Go Home
            </Button>
          </>
        ) : inviteInfo ? (
          <>
            <Avatar
              component={motion.div}
              variant="rounded"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              src={inviteInfo.icon || undefined}
              sx={{
                width: 96,
                height: 96,
                mb: 3,
                mx: 'auto',
                bgcolor: 'new.sidebarAccent',
                borderRadius: 1,
                fontSize: 40,
                fontWeight: 700,
              }}
            >
              {!inviteInfo.icon && inviteInfo.name.slice(0, 2)}
            </Avatar>
            {/* Заголовок */}
            <Typography
              component={motion.h3}
              variant="h5"
              gutterBottom
              mb={3}
              sx={{ fontWeight: 700, maxWidth: 600, mx: 'auto' }}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            >
              You have been invited to join the server:
            </Typography>
            {/* Имя сервера */}
            <Typography
              component={motion.h4}
              variant="h5"
              gutterBottom
              mb={3}
              color="new.primary"
              sx={{ fontWeight: 700, maxWidth: 600, mx: 'auto' }}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.35, ease: 'easeOut' }}
            >
              "{inviteInfo.name}"
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ mb: 3 }}
              component={motion.p}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
            >
              Members online: {inviteInfo.memberCount}
            </Typography>
            <Button
              component={motion.button}
              variant="contained"
              size="large"
              onClick={handleJoin}
              disabled={isPending}
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px new.primary' }}
              transition={{ duration: 0.3 }}
            >
              {isPending ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Accept invitation'
              )}
            </Button>
          </>
        ) : (
          <></>
        )}
      </Box>
    </Box>
  );
};

export default InvitePage;
