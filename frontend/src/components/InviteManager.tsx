import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Box, Typography, IconButton, CircularProgress,
    List, ListItem, ListItemText
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { serverAPI } from '../services/api';

// Define the Invite interface directly in the file
interface Invite {
  id: string;
  code: string;
  serverId: string;
  creatorId: string;
  maxUses: number | null;
  uses: number;
  expiresAt: string | null;
  createdAt: string;
  isActive: boolean;
}

interface InviteManagerProps {
    open: boolean;
    onClose: () => void;
    serverId: string | undefined;
    serverName: string | undefined;
}

const InviteManager: React.FC<InviteManagerProps> = ({ open, onClose, serverId, serverName }) => {
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadInvites = useCallback(async () => {
        if (!serverId) return;
        setLoading(true);
        setError('');
        try {
            const response = await serverAPI.getServerInvites(serverId);
            if (response.success && response.data) {
                setInvites(response.data);
            } else {
                setError(response.error || 'Failed to load invites');
            }
        } catch (err) {
            setError('An unexpected error occurred while fetching invites.');
        } finally {
            setLoading(false);
        }
    }, [serverId]);

    useEffect(() => {
        if (open) {
            loadInvites();
        }
    }, [open, loadInvites]);

    const handleCreateInvite = async () => {
        if (!serverId) return;
        const response = await serverAPI.createInvite(serverId, {});
        if (response.success) {
            loadInvites(); // Refresh the list after creating a new invite
        } else {
            setError(response.error || 'Failed to create invite');
        }
    };

    const handleCopyInvite = (code: string) => {
        navigator.clipboard.writeText(`${window.location.origin}/invite/${code}`);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Приглашения для сервера "{serverName}"</DialogTitle>
            <DialogContent>
                {loading && <Box display="flex" justifyContent="center" sx={{ my: 2 }}><CircularProgress /></Box>}
                {!loading && error && <Typography color="error" sx={{ my: 2 }}>{error}</Typography>}
                {!loading && !error && (
                    <List>
                        {invites.length > 0 ? invites.map((invite) => (
                            <ListItem key={invite.id} secondaryAction={
                                <IconButton edge="end" aria-label="copy" onClick={() => handleCopyInvite(invite.code)}>
                                    <ContentCopyIcon />
                                </IconButton>
                            }>
                                <ListItemText 
                                    primary={`Код: ${invite.code}`} 
                                    secondary={`Использовано: ${invite.uses}${invite.maxUses ? ` / ${invite.maxUses}` : ''}`} 
                                />
                            </ListItem>
                        )) : <Typography>Приглашений еще нет.</Typography>}
                    </List>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Закрыть</Button>
                <Button onClick={handleCreateInvite} variant="contained">Создать приглашение</Button>
            </DialogActions>
        </Dialog>
    );
};

export default InviteManager; 