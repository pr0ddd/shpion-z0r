import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import ServersSidebar from './ServersSidebar';
import LiveKitManager from './LiveKitManager';
import { useAuth } from '../contexts/AuthContext';
import ServerMembers from './ServerMembers';

const Root = styled(Box)({
  display: 'flex',
  height: '100vh',
  overflow: 'hidden',
});

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  flexShrink: 0,
}));

const ContentWrapper = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
});

const MainContent = styled(Box)({
  flex: 1,
  minHeight: 0,
});

export default function ProtectedAppLayout() {
  const { user, logout } = useAuth();

  return (
    <Root>
      <ServersSidebar />
      <ContentWrapper>
        <Header>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            Shpion Voice Chat
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1">
              Привет, {user?.username}!
            </Typography>
            <Button variant="outlined" size="small" onClick={logout}>
              Выйти
            </Button>
          </Box>
        </Header>
        <MainContent>
          <LiveKitManager />
        </MainContent>
      </ContentWrapper>
    </Root>
  );
} 