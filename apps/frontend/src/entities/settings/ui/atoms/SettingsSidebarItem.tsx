import React from 'react';
import { ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';

interface SettingsSidebarItemProps {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
  horizontal?: boolean;
}

export const SettingsSidebarItem: React.FC<SettingsSidebarItemProps> = ({
  icon,
  label,
  selected,
  onClick,
  horizontal = false,
}) => {
  return (
    <ListItemButton
      selected={selected}
      onClick={onClick}
      sx={{
        borderRadius: 1,
        my: 0.5,
        flexDirection: horizontal ? 'column' : 'row',
        '&.Mui-selected': {
          backgroundColor: 'new.sidebarAccent',
          '&:hover': {
            backgroundColor: 'new.sidebarAccent',
          },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>{icon}</ListItemIcon>
      {label && <ListItemText primary={<Typography variant="body2">{label}</Typography>} />}
    </ListItemButton>
  );
}; 