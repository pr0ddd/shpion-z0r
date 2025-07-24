import React, { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useServerStore } from '@entities/server/model';
import InviteDialog from '@entities/server/ui/organisms/InviteDialog';
import CreateServerDialog from '@entities/server/ui/organisms/CreateServerDialog';
import { useSettingsDialogStore } from '@entities/settings';
import { useSelectedServerName } from '@hooks/useSelectedServerName';
import { useMembersQuery } from '@entities/members/api/members.query';
import { SectionHeader } from '@ui/organisms/SectionHeader';
import { SectionAction } from '@ui/molecules/SectionActionBar';

export const ServerHeader: React.FC = () => {
  const { selectedServerId, setSelectedServerId } = useServerStore();
  const serverName = useSelectedServerName();
  const { data: members } = useMembersQuery(selectedServerId!);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [createOpen,setCreateOpen]=useState(false);
  const toggleSettings = useSettingsDialogStore((s)=>s.toggle);

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
      <SectionHeader
        actions={actions}
      />
      {inviteOpen && selectedServerId && (
        <InviteDialog
          open={inviteOpen}
          server={{ id: selectedServerId } as any}
          onClose={() => setInviteOpen(false)}
        />
      )}
      {createOpen && (
        <CreateServerDialog open={createOpen} onClose={()=>setCreateOpen(false)} />
      )}
    </>
  );
}; 