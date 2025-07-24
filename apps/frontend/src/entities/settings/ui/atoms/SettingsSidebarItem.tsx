import React from 'react';
import { ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';

interface SettingsSidebarItemProps {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export const SettingsSidebarItem: React.FC<SettingsSidebarItemProps> = ({
  icon,
  label,
  selected,
  onClick,
}) => {
  return (
    <ListItemButton
      selected={selected}
      onClick={onClick}
      sx={{
        borderRadius: 1,
        my: 0.5,
        '&.Mui-selected': {
          backgroundColor: 'new.sidebarAccent',
          '&:hover': {
            backgroundColor: 'new.sidebarAccent',
          },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>{icon}</ListItemIcon>
      <ListItemText primary={<Typography variant="body2">{label}</Typography>} />
    </ListItemButton>
  );
}; 