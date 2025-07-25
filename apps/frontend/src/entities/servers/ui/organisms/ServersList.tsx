import { useServersQuery } from '@entities/servers/api';
import { Box, Divider, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CreateServerDialog from '@entities/server/ui/organisms/CreateServerDialog';
import { ServersItem } from '../molecules/ServersItem';
import { useState } from 'react';
import { Server } from '@shared/types';
import { ServerItemContextMenu } from '../molecules/ServerItemContextMenu';
import InviteDialog from '@entities/server/ui/organisms/InviteDialog';
import DeleteServerDialog from '@entities/server/ui/organisms/DeleteServerDialog';
import UpdateServerDialog from '@entities/server/ui/organisms/UpdateServerDialog';
import { useServerStore } from '@entities/server/model';

interface ServersListProps { isCompact?: boolean }

const ServersList: React.FC<ServersListProps> = ({ isCompact = false }) => {
  const { data: servers } = useServersQuery();
  const { selectedServerId, setSelectedServerId } = useServerStore();

  const [menuTarget, setMenuTarget] = useState<HTMLElement | null>(null);
  const [menuServer, setMenuServer] = useState<Server | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const filtered = servers;

  return (
    <Box
      sx={() => ({
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        gap: 0.25,
        pt: 1
      })}
    >
      {/* Search removed as per request */}

      {filtered?.map((server) => (
        <ServersItem
          key={server.id}
          server={server}
          active={selectedServerId === server.id}
          onSelectServer={() => setSelectedServerId(server.id)}
          onSetMenuAnchor={setMenuTarget}
          onSetMenuServer={setMenuServer}
          compact={isCompact}
        />
      ))}

      {/* Separator */}
      <Divider flexItem orientation="horizontal" sx={{ mt: 0.5, mx: 1, bgcolor: 'new.border', opacity: 0.6 }} />

      {/* Add server button at bottom */}
      <Box sx={{ display:'flex', justifyContent:'center', mt:0.25 }}>
        <Tooltip title="Add server" arrow placement="right">
          <Box
            onClick={() => setShowCreateDialog(true)}
            sx={(theme) => ({
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: theme.palette.gradients.addServer,
              backgroundSize: '200% 200%',
              animation: 'gradientShift 4s ease infinite',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              mx: 'auto',
              my: 0.25,
              '&:hover': {
                filter: 'brightness(1.2)',
              },
              '@keyframes gradientShift': {
                '0%': { backgroundPosition: '0% 50%' },
                '50%': { backgroundPosition: '100% 50%' },
                '100%': { backgroundPosition: '0% 50%' },
              },
            })}
          >
            <AddIcon sx={{ fontSize: 24, color: 'common.white' }} />
          </Box>
        </Tooltip>
      </Box>

      <CreateServerDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />

      <ServerItemContextMenu
        open={Boolean(menuTarget)}
        anchorEl={menuTarget}
        onClose={() => {
          setMenuTarget(null);
          setMenuServer(null);
        }}
        onInvite={() => {
          setMenuTarget(null);
          setShowInviteDialog(true);
        }}
        onUpdate={() => {
          setMenuTarget(null);
          setShowUpdateDialog(true);
        }}
        onDelete={() => {
          setMenuTarget(null);
          setShowDeleteDialog(true);
        }}
      />

      {menuServer && (
        <UpdateServerDialog
          open={showUpdateDialog}
          server={menuServer}
          onClose={() => setShowUpdateDialog(false)}
        />
      )}

      {menuServer && (
        <DeleteServerDialog
          open={showDeleteDialog}
          server={menuServer}
          onClose={() => setShowDeleteDialog(false)}
        />
      )}

      {menuServer && (
        <InviteDialog
          open={showInviteDialog}
          server={menuServer}
          onClose={() => setShowInviteDialog(false)}
        />
      )}
    </Box>
  );
};

export default ServersList;
