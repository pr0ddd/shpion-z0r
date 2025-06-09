import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  ThemeProvider, 
  CssBaseline,
  Box,
  Typography,
  Button,
  CircularProgress
} from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import { AppProviders } from './contexts/AppProviders';
import { AuthPage } from './components/AuthPage';
import ServersSidebar from './components/ServersSidebar';
import ServerContent from './components/ServerContent';
import ServerMembers from './components/ServerMembers';
import InvitePage from './components/InvitePage';
import ProtectedAppLayout from './components/ProtectedAppLayout';
import theme from './theme';

function AppContent({ user, isLoading }: { user: any, isLoading: boolean }) {
  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      <Route path="/invite/:inviteCode" element={<InvitePage />} />
      <Route 
        path="/app" 
        element={
          user ? <ProtectedAppLayout /> : <Navigate to="/auth" replace />
        } 
      />
      <Route 
        path="/auth" 
        element={user ? <Navigate to="/app" replace /> : <AuthPage />} 
      />
      <Route path="/" element={<Navigate to={user ? "/app" : "/auth"} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppProviders>
          <AuthWrapper />
        </AppProviders>
      </Router>
    </ThemeProvider>
  );
}

const AuthWrapper = () => {
  const { user, isLoading } = useAuth();
  return <AppContent user={user} isLoading={isLoading} />;
};

export default App;
