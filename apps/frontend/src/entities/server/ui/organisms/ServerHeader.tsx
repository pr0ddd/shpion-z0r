import React, { useState } from 'react';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useServerStore } from '@entities/server/model';
import InviteDialog from '@entities/server/ui/organisms/InviteDialog';
import { useSettingsDialogStore } from '@entities/settings';
import { SectionHeader } from '@ui/organisms/SectionHeader';
import { useParticipants } from '@livekit/components-react';
import { SectionAction } from '@ui/molecules/SectionActionBar';
import { Box } from '@mui/material';
import { SettingsDialog, GlobalHotkeys } from '@entities/settings';

export const ServerHeader: React.FC = () => {
  const { selectedServerId, setSelectedServerId } = useServerStore();

  const [inviteOpen, setInviteOpen] = useState(false);
  const toggleSettings = useSettingsDialogStore((s)=>s.toggle);

  const participants = useParticipants();
  const onlineCount = participants?.length ?? 0;

  const actions: SectionAction[] = [
    {
      key: 'invite',
      icon: <PersonAddIcon fontSize="small" />,
      tooltip: 'Invite',
      onClick: () => setInviteOpen(true),
    },
    {
      key: 'settings',
      icon: <SettingsIcon fontSize="small" />,
      tooltip: 'Settings',
      onClick: () => toggleSettings(),
    },
    {
      key: 'leave',
      icon: <LogoutIcon fontSize="small" />,
      tooltip: 'Leave server',
      onClick: () => setSelectedServerId(null),
    },
  ];

  return (
    <>
      <SectionHeader title={`Members ${onlineCount}`} actions={actions} />
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