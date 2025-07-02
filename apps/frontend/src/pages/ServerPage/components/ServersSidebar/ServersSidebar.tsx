import React, { useState, useEffect } from 'react';
import { Tooltip, Skeleton, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { useAuth } from '@features/auth';
import { useAppStore } from '@stores/useAppStore';
import { Server } from '@shared/types';
import { serverAPI } from '@shared/data';
import { useQueryClient } from '@tanstack/react-query';
import { useServersQuery, useSelectServer, useServerStore } from '@features/servers';
import { useSocket } from '@features/socket';

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
  CompactVoiceControlBar,
} from './ServersSidebar.styles';
import ServerItemContextMenu from './ServerItemContextMenu';
import { QuickSwitchPanel } from './QuickSwitchPanel';

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

// Простые контролы работающие через localStorage (предварительные настройки)
const CompactVoiceControls: React.FC = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const selectedServerId = useAppStore(s => s.selectedServerId);
  const listening = useServerStore((s) => (user?.id ? s.listeningStates[user.id] : true) ?? true);
  const setListeningState = useServerStore((s) => s.setListeningState);
  
  // Состояния из localStorage (предварительные настройки)
  const [micEnabled, setMicEnabled] = useState(() => {
    const saved = localStorage.getItem('voice_mic_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  
  const [camEnabled, setCamEnabled] = useState(() => {
    const saved = localStorage.getItem('voice_cam_enabled');
    return saved !== null ? saved === 'true' : false;
  });

  const [screenShareEnabled, setScreenShareEnabled] = useState(false);

  const toggleMic = () => {
    const newValue = !micEnabled;
    setMicEnabled(newValue);
    localStorage.setItem('voice_mic_enabled', String(newValue));
  };

  const toggleCam = () => {
    const newValue = !camEnabled;
    setCamEnabled(newValue);
    localStorage.setItem('voice_cam_enabled', String(newValue));
  };

  const toggleScreenShare = () => {
    const newValue = !screenShareEnabled;
    setScreenShareEnabled(newValue);
    // Пока что только визуальное состояние
  };

  const toggleListening = () => {
    if (!user) return;
    const newVal = !listening;
    setListeningState(user.id, newVal);
    if (selectedServerId) {
      socket?.emit('user:listening', { serverId: selectedServerId, listening: newVal } as any);
    }
    localStorage.setItem('voice_listening', String(newVal));
  };

  return (
    <CompactVoiceControlBar>
      <Tooltip title={micEnabled ? "Выключить микрофон" : "Включить микрофон"} placement="bottom">
        <IconButton 
          size="small" 
          onClick={toggleMic} 
          sx={{ 
            color: micEnabled ? 'white' : '#f04747'
          }}
        >
          {micEnabled ? <MicIcon /> : <MicOffIcon />}
        </IconButton>
      </Tooltip>
      
      <Tooltip title={camEnabled ? "Выключить камеру" : "Включить камеру"} placement="bottom">
        <IconButton 
          size="small" 
          onClick={toggleCam} 
          sx={{ 
            color: camEnabled ? 'white' : '#f04747'
          }}
        >
          {camEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
        </IconButton>
      </Tooltip>
      
      <Tooltip title={screenShareEnabled ? "Остановить демонстрацию экрана" : "Демонстрация экрана"} placement="bottom">
        <IconButton 
          size="small" 
          onClick={toggleScreenShare} 
          sx={{ 
            color: screenShareEnabled ? 'white' : '#f04747'
          }}
        >
          <ScreenShareIcon />
        </IconButton>
      </Tooltip>
      
      <Tooltip title={listening ? "Выключить звук" : "Включить звук"} placement="bottom">
        <IconButton size="small" onClick={toggleListening} sx={{ 
          color: listening ? 'white' : '#f04747' 
        }}>
          {listening ? <VolumeUpIcon /> : <VolumeOffIcon />}
        </IconButton>
      </Tooltip>
    </CompactVoiceControlBar>
  );
};

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
        <Tooltip title="Космическое пространство" placement="bottom">
          <ServerButton
            isSelected={(selectedServerId === null).toString()}
            onClick={() => selectServer(null)}
          >
            <LobbyIcon sx={{ width: 24, height: 24, color: 'common.white' }} />
          </ServerButton>
        </Tooltip>
        <StyledDivider orientation="vertical" />

        {/* Voice Controls - теперь всегда показываем */}
        <CompactVoiceControls />
        <StyledDivider orientation="vertical" />

        {isLoading ? (
          <ServerListSkeleton />
        ) : (
          <QuickSwitchPanel
            servers={servers}
            selectedServerId={selectedServerId}
            onCreateServer={() => setCreateDialogOpen(true)}
            onServerClick={handleServerClick}
            onOpenMenu={(srv: Server, el: HTMLElement) => setMenu({ server: srv, anchorEl: el })}
          />
        )}

        <ActionButtons>
          <Tooltip title="Выйти" placement="bottom">
            <ServerButton onClick={logout}>
              <LogoutIcon sx={{ fontSize: '20px' }} />
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
