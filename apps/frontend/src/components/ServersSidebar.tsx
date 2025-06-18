import React, { memo, useCallback, useState } from 'react';
import {
  Box,
  Avatar,
  Tooltip,
  Divider,
  Typography,
  Skeleton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '@shared/hooks';
import { useServersQuery, useSelectServer, useAppStore } from '@shared/hooks';
import { Server } from '@shared/types';
import { CreateServerDialog } from '@shared/ui';
import { serverAPI } from '@shared/data';
import { useQueryClient } from '@tanstack/react-query';

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
  cursor: 'context-menu',
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
  currentUserId: string | undefined;
  onOpenMenu: (serverId: string, pos: {x:number; y:number})=>void;
}

const ServerItem = memo(({ server, isSelected, onClick, currentUserId, onOpenMenu }: ServerItemProps) => {
  return (
    <Tooltip title={server.name} placement="right">
      <ServerButton
        className="allow-context"
        isselected={isSelected.toString()}
        onClick={() => onClick(server)}
        onContextMenu={(e) => {
          e.preventDefault();
          if (server.ownerId !== currentUserId) return;
          onOpenMenu(server.id, {x: e.clientX, y: e.clientY});
        }}
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
  const { data: serversData, isLoading, error } = useServersQuery();
  const servers: Server[] = serversData ?? [];
  const selectedServerId = useAppStore((s)=>s.selectedServerId);
  const selectServer = useSelectServer();
  const { logout, user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [menu, setMenu] = useState<{id: string; x: number; y: number} | null>(null);

  const handleServerClick = useCallback((server: Server) => {
    selectServer(server.id, server.name);
  }, [selectServer]);

  const handleDeleteServer = async () => {
    if (!menu) return;
    if (!confirm('Удалить сервер безвозвратно?')) { setMenu(null); return; }
    try {
      await serverAPI.deleteServer(menu.id);
      queryClient.setQueryData(['servers'], (old: any)=> Array.isArray(old) ? old.filter((s:any)=>s.id!==menu.id) : old);
      if (selectedServerId === menu.id) selectServer(null);
    } finally {
      setMenu(null);
    }
  };

  return (
    <>
      <SidebarWrapper>
        <Tooltip title="Космическое пространство" placement="right">
          <ServerButton isselected={(selectedServerId === null).toString()} onClick={() => selectServer(null)}>
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
              isSelected={selectedServerId === server.id}
              onClick={handleServerClick}
              currentUserId={user?.id}
              onOpenMenu={(id,pos)=>setMenu({id, ...pos})}
            />
          ))
        )}
        
        {error && (
          <Typography color="error" sx={{ maxWidth: '60px', overflowWrap: 'break-word', fontSize: '10px' }}>
            {typeof error === 'string' ? error : (error as any).message || String(error)}
          </Typography>
        )}
        
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
      <Menu
        open={Boolean(menu)}
        onClose={()=>setMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={menu ? { top: menu.y, left: menu.x } : undefined}
      >
        <MenuItem onClick={handleDeleteServer}>
          <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Удалить сервер</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default memo(ServersSidebar); 