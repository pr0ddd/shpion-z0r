import React, { memo, useState, useCallback, useEffect } from 'react';
import {
  Box,
  Avatar,
  Tooltip,
  CircularProgress,
  Alert,
  Divider,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import { useServer } from '../contexts/ServerContext';
import { useAuth } from '../contexts/AuthContext';
import { Server } from '../types';

const SidebarWrapper = styled(Box)(({ theme }) => ({
  width: 72,
  height: '100vh',
  padding: theme.spacing(1, 0),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1),
  backgroundColor: theme.palette.discord.sidebar,
  position: 'relative',
}));

const ServerButton = styled(Avatar)<{ isselected?: string }>(({ theme, isselected }) => ({
  width: 48,
  height: 48,
  cursor: 'pointer',
  transition: 'border-radius 0.2s ease, background-color 0.2s ease',
  backgroundColor: isselected === 'true' ? theme.palette.discord.blurple : theme.palette.discord.grey,
  borderRadius: isselected === 'true' ? '30%' : '50%',
  '&:hover': {
    borderRadius: '30%',
    backgroundColor: theme.palette.discord.blurple,
  },
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  width: 32,
  backgroundColor: theme.palette.discord.grey,
  marginTop: theme.spacing(0.5),
  marginBottom: theme.spacing(0.5),
}));

interface ServerItemProps {
  server: Server;
  isSelected: boolean;
  onClick: (server: Server) => void;
}

const ServerItem = memo(({ server, isSelected, onClick }: ServerItemProps) => {
  return (
    <Tooltip title={server.name} placement="right">
      <ServerButton
        isselected={isSelected.toString()}
        onClick={() => onClick(server)}
      >
        {server.name.charAt(0)}
      </ServerButton>
    </Tooltip>
  );
});

const ActionButtons = styled(Box)({
  marginTop: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

const ServersSidebar: React.FC = () => {
  const {
    servers,
    selectedServer,
    isLoading,
    error,
    selectServer,
    fetchServers,
  } = useServer();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user) {
      fetchServers();
    }
  }, [user, fetchServers]);

  const handleServerClick = useCallback((server: Server) => {
    selectServer(server);
  }, [selectServer]);
  
  return (
    <SidebarWrapper>
      <Tooltip title="Личные сообщения (скоро)" placement="right">
        <ServerButton isselected={(selectedServer === null).toString()} onClick={() => selectServer(null)}>DM</ServerButton>
      </Tooltip>
      <Divider sx={{ my: 1, borderColor: '#36393f', width: '50%', alignSelf: 'center' }} />
      {servers.map(server => (
        <ServerItem
          key={server.id}
          server={server}
          isSelected={selectedServer?.id === server.id}
          onClick={handleServerClick}
        />
      ))}
      <ActionButtons>
        <Tooltip title="Добавить сервер (скоро)" placement="right">
          <ServerButton>
            <AddIcon />
          </ServerButton>
        </Tooltip>
        <Tooltip title="Выйти" placement="right">
          <ServerButton onClick={() => logout()}>
            <LogoutIcon />
          </ServerButton>
        </Tooltip>
      </ActionButtons>

      {isLoading && <CircularProgress size={24} sx={{ position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px' }} />}
      {error && <Typography color="error">{error}</Typography>}
    </SidebarWrapper>
  );
};

export default memo(ServersSidebar); 