import React, { useState } from 'react';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HomeIcon from '@mui/icons-material/Home';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { useServerStore } from '@entities/server/model';
import InviteDialog from '@entities/server/ui/organisms/InviteDialog';
import { useSelectedServerName } from '@hooks/useSelectedServerName';
import { SectionHeader } from '@ui/organisms/SectionHeader';
import { useParticipants } from '@livekit/components-react';
import { SectionAction } from '@ui/molecules/SectionActionBar';
import { Tooltip, Box } from '@mui/material';
import { SettingsDialog, GlobalHotkeys } from '@entities/settings';

export const ServerHeader: React.FC = () => {
  const { selectedServerId } = useServerStore();

  const [inviteOpen, setInviteOpen] = useState(false);

  const participants = useParticipants();
  const onlineCount = participants?.length ?? 0;
  const serverName = useSelectedServerName();

  const isLong = serverName.length > 20;
  const displayName = isLong ? `${serverName.slice(0, 16)}…` : serverName;

  const actions: SectionAction[] = [
    {
      key: 'invite',
      icon: <PersonAddIcon fontSize="small" />,
      tooltip: 'Invite',
      onClick: () => setInviteOpen(true),
    },
  ];

  return (
    <>
      <SectionHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <HomeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            {serverName ? (
              <Tooltip title={isLong ? serverName : ''} placement="top" arrow>
                <span>{displayName}</span>
              </Tooltip>
            ) : 'Server'}
          </Box>
        }
        subtitle={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PeopleAltIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            Members: {onlineCount}
          </Box>
        }
        actions={actions}
      />
      {inviteOpen && selectedServerId && (
        <InviteDialog
          open={inviteOpen}
          server={{ id: selectedServerId } as any}
          onClose={() => setInviteOpen(false)}
        />
      )}
      {/* Settings dialog & global hotkeys */}
      <SettingsDialog />
      <GlobalHotkeys />
    </>
  );
}; 