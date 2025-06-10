import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';
import { useParticipants } from '@livekit/components-react';
import PersonIcon from '@mui/icons-material/Person';
import { MaterialControlBar } from './MaterialControlBar';

export const ServerMembers = () => {
  const participants = useParticipants();

  return (
    <Box sx={{ 
      width: 240, 
      borderRight: '1px solid rgba(255, 255, 255, 0.12)', 
      padding: '1rem', 
      color: 'white', 
      background: '#2f3136',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Typography variant="h6" sx={{ marginBottom: '1rem', flexShrink: 0 }}>Участники ({participants.length})</Typography>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
        <List>
          {participants.map((participant) => (
            <ListItem key={participant.sid}>
              <ListItemAvatar>
                <Avatar>
                  <PersonIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={participant.name || participant.identity} />
            </ListItem>
          ))}
        </List>
      </Box>
      <Box sx={{ flexShrink: 0, pt: 2 }}>
        <MaterialControlBar />
      </Box>
    </Box>
  );
}; 