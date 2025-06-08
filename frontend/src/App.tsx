import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline,
  Box,
  Typography,
  Button,
  CircularProgress
} from '@mui/material';
import { red } from '@mui/material/colors';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ServerProvider } from './contexts/ServerContext';
import { SocketProvider } from './contexts/SocketContext';
import { AuthPage } from './components/AuthPage';
import ServersSidebar from './components/ServersSidebar';
import ServerContent from './components/ServerContent';
import ServerMembers from './components/ServerMembers';
import InvitePage from './components/InvitePage';
import ProtectedAppLayout from './components/ProtectedAppLayout';

// Создаем тему по официальному примеру
const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'dark',
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#36393f', // Discord style
      paper: '#2f3136',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b9bbbe',
    },
  },
});

function AppContent() {
  const { user, isLoading, logout } = useAuth();

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
        <AuthProvider>
          <SocketProvider>
            <ServerProvider>
              <AppContent />
            </ServerProvider>
          </SocketProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
