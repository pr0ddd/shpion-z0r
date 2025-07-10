import { ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { memo } from 'react';

interface ServerItemContextMenuProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onInvite: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}
export const ServerItemContextMenu = memo(
  ({
    open,
    anchorEl,
    onClose,
    onInvite,
    onUpdate,
    onDelete,
  }: ServerItemContextMenuProps) => {
    return (
      <Menu
        open={open}
        onClose={onClose}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem onClick={onInvite}>
          <ListItemIcon>
            <PersonAddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Пригласить</ListItemText>
        </MenuItem>
        <MenuItem onClick={onUpdate}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Настройки</ListItemText>
        </MenuItem>
        <MenuItem onClick={onDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Удалить сервер</ListItemText>
        </MenuItem>
      </Menu>
    );
  }
);
