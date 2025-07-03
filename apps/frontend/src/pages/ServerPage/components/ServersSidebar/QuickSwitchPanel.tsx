import React, { useState } from 'react';
import { Typography, Tooltip, Avatar } from '@mui/material';
import { Dashboard as DashboardIcon, Add as AddIcon } from '@mui/icons-material';
import { useAppStore } from '@stores/useAppStore';
import { Server } from '@shared/types';
import { useSelectServer } from '@features/servers';

import {
  QuickSwitchButton,
  QuickSwitchPanel as StyledPanel,
  ServerGrid,
  ServerGridItem,
  AddServerButton,
} from './ServersSidebar.styles';

interface QuickSwitchPanelProps {
  servers: Server[];
  selectedServerId: string | null;
  onCreateServer: () => void;
  onServerClick: (server: Server) => void;
  onOpenMenu: (server: Server, element: HTMLElement) => void;
}

export const QuickSwitchPanel: React.FC<QuickSwitchPanelProps> = ({
  servers,
  selectedServerId,
  onCreateServer,
  onServerClick,
  onOpenMenu,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const selectServer = useSelectServer();

  const selectedServer = servers.find(s => s.id === selectedServerId);
  const totalOnline = servers.reduce((sum, server) => sum + (server.members?.length || 0), 0);

  const handleServerClick = (server: Server) => {
    onServerClick(server);
    setIsHovered(false);
  };

  const handleContextMenu = (e: React.MouseEvent, server: Server) => {
    e.preventDefault();
    onOpenMenu(server, e.currentTarget as HTMLElement);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: 'relative' }}
    >
      <Tooltip title="Quick Server Switch" placement="right">
        <QuickSwitchButton>
          <DashboardIcon sx={{ fontSize: '16px' }} />
          <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 600 }}>
            Серверы ({servers.length})
          </Typography>
        </QuickSwitchButton>
      </Tooltip>

      <StyledPanel className={isHovered ? 'visible' : ''}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Выбор сервера
        </Typography>
        
        <ServerGrid>
          {servers.map((server) => (
            <ServerGridItem
              key={server.id}
              isSelected={server.id === selectedServerId}
              onClick={() => handleServerClick(server)}
              onContextMenu={(e) => handleContextMenu(e, server)}
            >
              <div className="server-icon">
                <Avatar
                  src={server.icon || undefined}
                  variant="square"
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    bgcolor: server.icon ? 'transparent' : 'primary.main',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    objectFit: 'cover',
                  }}
                >
                  {!server.icon && server.name.charAt(0).toUpperCase()}
                </Avatar>
              </div>
              <div className="server-name">
                {server.name}
              </div>
              <div className="server-count">
                {server.members?.length || 0} online
              </div>
            </ServerGridItem>
          ))}
          
          <AddServerButton onClick={onCreateServer}>
            <div className="add-icon">
              <AddIcon sx={{ fontSize: '16px' }} />
            </div>
            <Typography variant="caption" sx={{ fontSize: '8px', fontWeight: 600 }}>
              NEW
            </Typography>
          </AddServerButton>
        </ServerGrid>
      </StyledPanel>
    </div>
  );
}; 