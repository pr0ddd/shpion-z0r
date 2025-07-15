import React from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSettingsDialogStore } from '../../model/settingsDialog.store';
import { AccountSettings } from '../organisms/AccountSettings';
import { EquipmentSettings } from '../organisms/EquipmentSettings';
import { HotkeysSettings } from '../organisms/HotkeysSettings';
import { AppearanceSettings } from '../organisms/AppearanceSettings';
import { SettingsSidebar } from '../molecules/SettingsSidebar';
import { SettingsSection } from '../../model/settingsDialog.store';

export const SettingsDialog: React.FC = () => {
  const isOpen = useSettingsDialogStore((s) => s.isOpen);
  const close = useSettingsDialogStore((s) => s.close);
  const activeSection = useSettingsDialogStore((s) => s.activeSection);

  const renderContent = (section: SettingsSection) => {
    switch (section) {
      case 'account':
        return <AccountSettings />;
      case 'equipment':
        return <EquipmentSettings />;
      case 'hotkeys':
        return <HotkeysSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={close}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          backgroundColor: 'new.background',
          border: '1px solid',
          borderColor: 'new.border',
        },
      }}
    >
      <DialogTitle
        sx={{ m: 0, p: 2, borderBottom: '1px solid', borderColor: 'new.border' }}
      >
        Настройки
        <IconButton
          aria-label="close"
          onClick={close}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'new.foreground',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, display: 'flex', height: 600 }}>
        <SettingsSidebar />
        <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>{renderContent(activeSection)}</Box>
      </DialogContent>
    </Dialog>
  );
}; 