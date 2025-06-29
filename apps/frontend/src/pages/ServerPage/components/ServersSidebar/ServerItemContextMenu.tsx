import { ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { memo } from 'react';

interface ServerItemContextMenuProps {
  open: boolean;
  anchorEl: HTMLElement | undefined;
  onClose: () => void;
  onInvite: () => void;
  onSettings: () => void;
  onDelete: () => void;
}
const ServerItemContextMenu = memo(
  ({
    open,
    anchorEl,
    onClose,
    onInvite,
    onSettings,
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
        <MenuItem onClick={onSettings}>
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

export default ServerItemContextMenu;
