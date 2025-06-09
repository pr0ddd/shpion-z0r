import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Avatar, Divider, Tooltip } from '@mui/material';
import { useServer } from '../contexts/ServerContext';
import { Member } from '../types';
import UserPanel from './UserPanel';

const ServerMembers: React.FC = () => {
  const { members } = useServer();

  const onlineMembers = members; // For now, all members are "online"
  const offlineMembers = [] as Member[]; // We don't have offline status yet

  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
        height: '100%',
        backgroundColor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 2, flexShrink: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Участники — {onlineMembers.length}
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
        {onlineMembers.map((member) => {
          if (!member || !member.user) {
            return null;
          }
          return (
            <Tooltip key={member.id} title={member.user.username} placement="left">
              <ListItem>
                <Avatar src={member.user.avatar || undefined} sx={{ width: 32, height: 32, mr: 2 }}/>
                <ListItemText 
                  primary={member.user.username} 
                  primaryTypographyProps={{ 
                    noWrap: true,
                    sx: { fontWeight: '500' }
                  }}
                />
              </ListItem>
            </Tooltip>
          );
        })}
      </List>
      
      <UserPanel />
    </Box>
  );
};

export default ServerMembers; 