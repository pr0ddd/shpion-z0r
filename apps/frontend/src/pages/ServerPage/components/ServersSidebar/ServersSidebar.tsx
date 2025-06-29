import React, { useState } from 'react';
import { Tooltip, Skeleton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '@features/auth';
import { useAppStore } from '@stores/useAppStore';
import { Server } from '@shared/types';
import { serverAPI } from '@shared/data';
import { useQueryClient } from '@tanstack/react-query';
import { useServersQuery, useSelectServer } from '@features/servers';

import CreateServerDialog from '@features/servers/components/CreateServerDialog';
import ServerSettingsDialog from '@features/servers/components/ServerSettingsDialog';
import InviteDialog from '@features/servers/components/InviteDialog';
import DeleteServerDialog from '@features/servers/components/DeleteServerDialog';

import { LobbyIcon } from './LobbyIcon';
import {
  ActionButtons,
  ServerButton,
  SidebarWrapper,
  StyledDivider,
} from './ServersSidebar.styles';
import ServerItem from './ServerItem';
import ServerItemContextMenu from './ServerItemContextMenu';

const ServerListSkeleton = () => (
  <>
    {[...Array(3)].map((_, index) => (
      <Skeleton
        key={index}
        variant="circular"
        width={48}
        height={48}
        sx={{ bgcolor: 'grey.800' }}
      />
    ))}
  </>
);

export const ServersSidebar: React.FC = () => {
  const { data: servers = [], isLoading } = useServersQuery();
  const selectedServerId = useAppStore((s) => s.selectedServerId);
  const selectServer = useSelectServer();
  const { logout, user } = useAuth();
  const queryClient = useQueryClient();
  const [menu, setMenu] = useState<{
    server: Server;
    anchorEl: HTMLElement;
  } | null>(null);

  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Server | null>(null);
  const [settingsTarget, setSettingsTarget] = useState<Server | null>(null);
  const [inviteTarget, setInviteTarget] = useState<Server | null>(null);

  const handleServerClick = (server: Server) => {
    selectServer(server.id);
  };

  const handleDeleteServerConfirmed = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    try {
      await serverAPI.deleteServer(id);
      queryClient.setQueryData(['servers'], (old: any) =>
        Array.isArray(old) ? old.filter((s: any) => s.id !== id) : old
      );
      if (selectedServerId === id) selectServer(null);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <SidebarWrapper>
        <Tooltip title="Космическое пространство" placement="right">
          <ServerButton
            isSelected={(selectedServerId === null).toString()}
            onClick={() => selectServer(null)}
          >
            <LobbyIcon sx={{ width: 32, height: 32, color: 'common.white' }} />
          </ServerButton>
        </Tooltip>
        <StyledDivider />

        {isLoading ? (
          <ServerListSkeleton />
        ) : (
          servers.map((server) => (
            <ServerItem
              key={server.id}
              server={server}
              isSelected={selectedServerId === server.id}
              onClick={handleServerClick}
              currentUserId={user?.id}
              onOpenMenu={(srv, el) => setMenu({ server: srv, anchorEl: el })}
            />
          ))
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

      <ServerItemContextMenu
        open={Boolean(menu)}
        anchorEl={menu?.anchorEl}
        onClose={() => setMenu(null)}
        onInvite={() => {
          if (menu) {
            setInviteTarget(menu.server);
            setMenu(null);
          }
        }}
        onSettings={() => {
          if (menu) {
            setSettingsTarget(menu.server);
            setMenu(null);
          }
        }}
        onDelete={() => {
          if (menu) {
            setDeleteTarget(menu.server);
            setMenu(null);
          }
        }}
      />

      <CreateServerDialog
        open={isCreateDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />

      <ServerSettingsDialog
        open={Boolean(settingsTarget)}
        server={settingsTarget}
        onClose={() => setSettingsTarget(null)}
      />

      <DeleteServerDialog
        open={Boolean(deleteTarget)}
        serverName={deleteTarget?.name ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteServerConfirmed}
      />

      <InviteDialog
        open={Boolean(inviteTarget)}
        onClose={() => setInviteTarget(null)}
        inviteCode={inviteTarget?.inviteCode ?? ''}
      />
    </>
  );
};
