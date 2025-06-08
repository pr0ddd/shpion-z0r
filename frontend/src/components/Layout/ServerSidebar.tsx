import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Avatar,
  Tooltip,
  Typography,
  Fab,
  IconButton,
  Divider,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Home as HomeIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
} from '@mui/icons-material';
import { colors } from '../../theme';
import { Server } from '../../types';
import { serverAPI } from '../../services/api';
import CreateServerDialog from '../dialogs/CreateServerDialog';

interface ServerSidebarProps {
  selectedServerId?: string;
  onServerSelect: (serverId: string | undefined) => void;
}

const ServerSidebar: React.FC<ServerSidebarProps> = ({ selectedServerId, onServerSelect }) => {
  const [servers, setServers] = useState<Server[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const loadServers = useCallback(async () => {
    try {
      const response = await serverAPI.getServers();
      if (response.success && response.data) {
        setServers(response.data);
        if (response.data.length > 0 && !selectedServerId) {
          onServerSelect(response.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load servers:', error);
    }
  }, [selectedServerId, onServerSelect]);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  const getServerIconUrl = (server: Server) => {
    return server.icon || `https://ui-avatars.com/api/?name=${encodeURIComponent(server.name)}&background=5865f2&color=fff`;
  };

  const getTooltipContent = (server: Server) => (
    <Box sx={{ p: 1 }}>
      <Typography variant="body2" fontWeight="bold">
        {server.name}
      </Typography>
      {server.description && (
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          {server.description}
        </Typography>
      )}
    </Box>
  );

  const handleServerClick = (serverId: string) => {
    onServerSelect(serverId);
  };

  const handleAddServer = () => {
    setIsCreateDialogOpen(true);
  };

  const handleServerCreated = (newServer: Server) => {
    setServers(prev => [...prev, newServer]);
    onServerSelect(newServer.id);
    console.log('New server added:', newServer);
  };

  return (
    <>
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 1,
          gap: 1,
        }}
      >
        {/* Home button */}
        <Tooltip title="Домашняя страница" placement="right">
          <IconButton
            sx={{
              width: 48,
              height: 48,
              backgroundColor: selectedServerId === undefined ? colors.primary : 'transparent',
              color: selectedServerId === undefined ? 'white' : colors.text.secondary,
              borderRadius: selectedServerId === undefined ? 2 : 6,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: colors.primary,
                borderRadius: 2,
                color: 'white',
              },
            }}
            onClick={() => onServerSelect(undefined)}
          >
            <HomeIcon />
          </IconButton>
        </Tooltip>

        <Divider sx={{ width: 32, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Server list */}
        {servers.map((server) => (
          <Tooltip
            key={server.id}
            title={getTooltipContent(server)}
            placement="right"
            arrow
          >
            <Badge
              variant="dot"
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: colors.accent.success,
                  color: colors.accent.success,
                  '&::after': {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    animation: 'ripple 1.2s infinite ease-in-out',
                    border: '1px solid currentColor',
                    content: '""',
                  },
                },
                '@keyframes ripple': {
                  '0%': {
                    transform: 'scale(.8)',
                    opacity: 1,
                  },
                  '100%': {
                    transform: 'scale(2.4)',
                    opacity: 0,
                  },
                },
              }}
            >
              <Avatar
                src={getServerIconUrl(server)}
                alt={server.name}
                sx={{
                  width: 48,
                  height: 48,
                  cursor: 'pointer',
                  borderRadius: selectedServerId === server.id ? 2 : 6,
                  transition: 'all 0.2s ease',
                  border: selectedServerId === server.id ? `2px solid ${colors.primary}` : 'none',
                  '&:hover': {
                    borderRadius: 2,
                  },
                }}
                onClick={() => handleServerClick(server.id)}
              />
            </Badge>
          </Tooltip>
        ))}

        {/* Add server button */}
        <Tooltip title="Добавить сервер" placement="right">
          <Fab
            size="small"
            sx={{
              width: 48,
              height: 48,
              backgroundColor: colors.background.primary,
              color: colors.accent.success,
              borderRadius: 6,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: colors.accent.success,
                color: 'white',
                borderRadius: 2,
              },
            }}
            onClick={handleAddServer}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      </Box>

      {/* Create Server Dialog */}
      <CreateServerDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onServerCreated={handleServerCreated}
      />
    </>
  );
};

export default ServerSidebar; 