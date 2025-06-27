import React, { memo, useCallback, useState } from 'react';
import {
  Box,
  Avatar,
  Tooltip,
  Typography,
  Skeleton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { SidebarWrapper, ServerButton, StyledDivider } from '@shared/ui';
import { styled as muiStyled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAuth } from '@features/auth';
import { useAppStore } from '../../../stores/useAppStore';
import { Server } from '@shared/types';
import { serverAPI } from '@shared/data';
import { useQueryClient } from '@tanstack/react-query';
import { LobbyIcon } from '@shared/ui';
import { useServersQuery, useSelectServer } from '@features/servers';

import CreateServerDialog from './CreateServerDialog';
import ServerSettingsDialog from './ServerSettingsDialog';
import InviteDialog from './InviteDialog';

interface ServerItemProps {
  server: Server;
  isSelected: boolean;
  onClick: (server: Server) => void;
  currentUserId: string | undefined;
  onOpenMenu: (server: Server, anchorEl: HTMLElement)=>void;
}

const ServerItem = memo(({ server, isSelected, onClick, currentUserId, onOpenMenu }: ServerItemProps) => {
  return (
    <Tooltip title={server.name} placement="right">
      <ServerButton
        className="allow-context"
        isselected={isSelected.toString()}
        onClick={() => onClick(server)}
        onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
          e.preventDefault();
          if (server.ownerId !== currentUserId) return;
          onOpenMenu(server, e.currentTarget);
        }}
      >
        {server.icon ? (
          <Avatar
            src={server.icon}
            variant="square"
            sx={{ width: 48, height: 48, borderRadius: 1.5, objectFit: 'cover'}}
          />
        ) : (
          <Typography variant="h6" sx={{fontWeight: 'bold'}}>
              {server.name.charAt(0).toUpperCase()}
          </Typography>
        )}
      </ServerButton>
    </Tooltip>
  );
});

const ActionButtons = muiStyled(Box)({
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
  const [menu, setMenu] = useState<{server: Server; anchorEl: HTMLElement} | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Server | null>(null);
  const [settingsTarget, setSettingsTarget] = useState<Server | null>(null);
  const [inviteTarget, setInviteTarget] = useState<Server | null>(null);

  const handleServerClick = useCallback((server: Server) => {
    selectServer(server.id, server.name);
  }, [selectServer]);

  const handleDeleteServerConfirmed = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    try {
      await serverAPI.deleteServer(id);
      queryClient.setQueryData(['servers'], (old: any) => (Array.isArray(old) ? old.filter((s: any) => s.id !== id) : old));
      if (selectedServerId === id) selectServer(null);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <SidebarWrapper>
        <Tooltip title="Космическое пространство" placement="right">
          <ServerButton isselected={(selectedServerId === null).toString()} onClick={() => selectServer(null)}>
              <LobbyIcon sx={{ width:32, height:32, color:'common.white' }} />
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
              onOpenMenu={(srv, el)=>setMenu({server: srv, anchorEl: el})}
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
        onClose={() => setMenu(null)}
        anchorEl={menu?.anchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem onClick={() => { if(menu){ setInviteTarget(menu.server); setMenu(null);} }}>
          <ListItemIcon><PersonAddIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Пригласить</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { if(menu){ setSettingsTarget(menu.server); setMenu(null);} }}>
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Настройки</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { if(menu){ setDeleteTarget(menu.server); setMenu(null);} }}>
          <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Удалить сервер</ListItemText>
        </MenuItem>
      </Menu>
      <ServerSettingsDialog
        open={Boolean(settingsTarget)}
        server={settingsTarget}
        onClose={()=>setSettingsTarget(null)}
      />
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Удалить сервер</DialogTitle>
        <DialogContent>
          Вы уверены, что хотите безвозвратно удалить сервер «{deleteTarget?.name}»?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Отмена</Button>
          <Button color="error" onClick={handleDeleteServerConfirmed}>Удалить</Button>
        </DialogActions>
      </Dialog>
      {inviteTarget && (
        <InviteDialog
          open={Boolean(inviteTarget)}
          onClose={()=>setInviteTarget(null)}
          inviteLink={`${window.location.origin}/invite/${inviteTarget.inviteCode}`}
        />
      )}
    </>
  );
};

export default memo(ServersSidebar); 