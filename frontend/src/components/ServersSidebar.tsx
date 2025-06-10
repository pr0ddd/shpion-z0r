import React, { memo, useCallback, useState } from 'react';
import {
  Box,
  Avatar,
  Tooltip,
  CircularProgress,
  Divider,
  Typography,
  Skeleton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import { useServer } from '../contexts/ServerContext';
import { useAuth } from '../contexts/AuthContext';
import { Server } from '../types';
import CreateServerDialog from './CreateServerDialog';

const SidebarWrapper = styled(Box)(({ theme }) => ({
  width: 72,
  height: '100vh',
  padding: theme.spacing(1.5, 0),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  backgroundColor: theme.palette.background.default,
  position: 'relative',
}));

const ServerButton = styled(Box)<{ isselected?: string }>(({ theme, isselected }) => ({
  width: 48,
  height: 48,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'border-radius 0.2s ease, background-color 0.2s ease, transform 0.2s ease',
  backgroundColor: isselected === 'true' ? theme.palette.primary.main : theme.palette.background.paper,
  color: isselected === 'true' ? theme.palette.getContrastText(theme.palette.primary.main) : theme.palette.text.secondary,
  borderRadius: isselected === 'true' ? '16px' : '50%', // More pronounced "squircle"
  '&:hover': {
    borderRadius: '16px',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.getContrastText(theme.palette.primary.main),
    transform: 'scale(1.05)',
  },
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  width: 32,
  backgroundColor: theme.palette.background.paper,
  margin: theme.spacing(0.5, 'auto'),
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
        {server.icon ? (
          <Avatar src={server.icon} sx={{ width: 48, height: 48 }} />
        ) : (
          <Typography variant="h6" sx={{fontWeight: 'bold'}}>
              {server.name.charAt(0).toUpperCase()}
          </Typography>
        )}
      </ServerButton>
    </Tooltip>
  );
});

const ActionButtons = styled(Box)({
  marginTop: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  paddingBottom: 8,
});

const ServerListSkeleton = () => (
  <>
    {[...Array(3)].map((_, index) => (
      <Skeleton key={index} variant="circular" width={48} height={48} sx={{ bgcolor: 'grey.800' }} />
    ))}
  </>
);

const ServersSidebar: React.FC = () => {
  const { servers, selectedServer, isLoading, error, selectServer } = useServer();
  const { logout } = useAuth();
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  const handleServerClick = useCallback((server: Server) => {
    selectServer(server);
  }, [selectServer]);
  
  return (
    <>
      <SidebarWrapper>
        <Tooltip title="Космическое пространство" placement="right">
          <ServerButton isselected={(selectedServer === null).toString()} onClick={() => selectServer(null)}>
              <Typography sx={{fontWeight: 'bold'}}>@</Typography>
          </ServerButton>
        </Tooltip>
        <StyledDivider />
        
        {isLoading ? (
          <ServerListSkeleton />
        ) : (
          servers.map(server => (
            <ServerItem
              key={server.id}
              server={server}
              isSelected={selectedServer?.id === server.id}
              onClick={handleServerClick}
            />
          ))
        )}
        
        {error && <Typography color="error" sx={{maxWidth: '60px', overflowWrap: 'break-word', fontSize: '10px'}}>{error}</Typography>}
        
        <ActionButtons>
          <Tooltip title="Создать сервер" placement="right">
            <ServerButton onClick={() => setCreateDialogOpen(true)}>
              <AddIcon />
            </ServerButton>
          </Tooltip>
          <Tooltip title="Выйти" placement="right">
            <ServerButton onClick={logout}>
              <LogoutIcon />
            </ServerButton>
          </Tooltip>
        </ActionButtons>
      </SidebarWrapper>
      <CreateServerDialog 
        open={isCreateDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </>
  );
};

export default memo(ServersSidebar); 