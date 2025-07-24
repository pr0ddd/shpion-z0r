import React from 'react';
import { List, Box } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import HeadsetIcon from '@mui/icons-material/Headset';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import PaletteIcon from '@mui/icons-material/Palette';
import {
  SettingsSection,
  useSettingsDialogStore,
} from '../../model/settingsDialog.store';
import { SettingsSidebarItem } from '../atoms/SettingsSidebarItem';

const sections: { key: SettingsSection; label: string; icon: React.ReactNode }[] = [
  { key: 'account', label: 'Учётная запись', icon: <PersonIcon /> },
  { key: 'equipment', label: 'Оборудование', icon: <HeadsetIcon /> },
  { key: 'hotkeys', label: 'Горячие клавиши', icon: <KeyboardIcon /> },
  { key: 'appearance', label: 'Внешний вид', icon: <PaletteIcon /> },
];

export const SettingsSidebar: React.FC = () => {
  const activeSection = useSettingsDialogStore((s) => s.activeSection);
  const setSection = useSettingsDialogStore((s) => s.setSection);

  return (
    <Box sx={{ width: 200, borderRight: '1px solid', borderColor: 'new.border', p:1 }}>
      <List disablePadding>
        {sections.map((sec) => (
          <SettingsSidebarItem
            key={sec.key}
            icon={sec.icon}
            label={sec.label}
            selected={sec.key === activeSection}
            onClick={() => setSection(sec.key)}
          />
        ))}
      </List>
    </Box>
  );
}; 