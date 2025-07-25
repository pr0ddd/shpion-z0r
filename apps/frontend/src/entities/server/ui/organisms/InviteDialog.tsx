import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  TextField,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Server } from '@shared/types';
import { IconButton } from '@ui/atoms/IconButton';

export interface InviteDialogProps {
  open: boolean;
  server: Server;
  onClose: () => void;
}

const InviteDialog: React.FC<InviteDialogProps> = ({ open, onClose, server }) => {
  const [copied, setCopied] = useState(false);
  const inviteLink = `${window.location.origin}/invite/${server.inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: (theme) => ({
            bgcolor: theme.palette.new.card,
            color: theme.palette.new.foreground,
            borderRadius: 1,
          }),
        },
      }}
    >
      <DialogTitle>Invite friends</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          Share this link to invite someone to this server.
        </Typography>
        <TextField
          fullWidth
          variant="filled"
          hiddenLabel
          value={inviteLink}
          slotProps={{
            input: {
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={copied ? 'Copied!' : 'Copy'} placement="top" arrow>
                    <IconButton
                      size="small"
                      hasBorder={false}
                      onClick={handleCopy}
                      icon={<ContentCopyIcon fontSize="small" />}
                    />
                  </Tooltip>
                </InputAdornment>
              ),
            },
          }}
          sx={{
            '& .MuiFilledInput-root': {
              pr: 1, // space for icon
            },
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default InviteDialog; 