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

interface Props { orientation?: 'vertical' | 'horizontal'; }

export const SettingsSidebar: React.FC<Props> = ({ orientation = 'vertical' }) => {
  const activeSection = useSettingsDialogStore((s) => s.activeSection);
  const setSection = useSettingsDialogStore((s) => s.setSection);

  const isHorizontal = orientation === 'horizontal';

  return (
    <Box
      sx={{
        width: isHorizontal ? '100%' : 200,
        borderRight: isHorizontal ? 'none' : '1px solid',
        borderBottom: isHorizontal ? '1px solid' : 'none',
        borderColor: 'new.border',
        p: 1,
      }}
    >
      <List disablePadding sx={{ display: isHorizontal ? 'flex' : 'block' }}>
        {sections.map((sec) => (
          <SettingsSidebarItem
            key={sec.key}
            icon={sec.icon}
            label={isHorizontal ? '' : sec.label}
            selected={sec.key === activeSection}
            onClick={() => setSection(sec.key)}
            horizontal={isHorizontal}
          />
        ))}
      </List>
    </Box>
  );
}; 