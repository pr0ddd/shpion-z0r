import { useServersQuery } from '@entities/servers/api';
import { Box } from '@mui/material';
import { ServersItem } from '../molecules/ServersItem';
import { useState } from 'react';
import { Server } from '@shared/types';
import { ServerItemContextMenu } from '../molecules/ServerItemContextMenu';
import InviteDialog from '@entities/server/ui/organisms/InviteDialog';
import DeleteServerDialog from '@entities/server/ui/organisms/DeleteServerDialog';
import UpdateServerDialog from '@entities/server/ui/organisms/UpdateServerDialog';
import { useServerStore } from '@entities/server/model';

const ServersList: React.FC = () => {
  const { data: servers } = useServersQuery();
  const { selectedServerId, setSelectedServerId } = useServerStore();

  const [menuTarget, setMenuTarget] = useState<HTMLElement | null>(null);
  const [menuServer, setMenuServer] = useState<Server | null>(null);

  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        gap: theme.spacing(1.5),
      })}
    >
      {servers?.map((server) => (
        <ServersItem
          key={server.id}
          server={server}
          active={selectedServerId === server.id}
          onSelectServer={() => setSelectedServerId(server.id)}
          onSetMenuAnchor={setMenuTarget}
          onSetMenuServer={setMenuServer}
        />
      ))}

      <ServerItemContextMenu
        open={Boolean(menuTarget)}
        anchorEl={menuTarget}
        onClose={() => setMenuTarget(null)}
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
