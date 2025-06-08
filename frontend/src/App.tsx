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

// Главная страница для авторизованных пользователей
function MainApp() {
  const { user, logout } = useAuth();

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Servers Sidebar */}
      <ServersSidebar />
      
      {/* Members Sidebar */}
      <ServerMembers />
      
      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Typography variant="h5" component="h1">
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
        </Box>
        
        {/* Content Area */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <ServerContent />
        </Box>
      </Box>
    </Box>
  );
}

// Компонент приложения с проверкой авторизации
function AppContent() {
  const { user, isLoading, token } = useAuth();

  console.log('🔄 AppContent render - isLoading:', isLoading, 'user:', user?.username || 'null', 'token:', token ? 'Present' : 'None');

  if (isLoading) {
    console.log('⏳ Showing loading spinner...');
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
      {/* Страница приглашения - доступна всем */}
      <Route path="/invite/:inviteCode" element={<InvitePage />} />
      
      {/* Основное приложение - только для авторизованных */}
      <Route 
        path="/app" 
        element={
          user ? (
            <SocketProvider>
              <ServerProvider>
                <MainApp />
              </ServerProvider>
            </SocketProvider>
          ) : (
            <Navigate to="/auth" replace />
          )
        } 
      />
      
      {/* Страница авторизации */}
      <Route 
        path="/auth" 
        element={user ? <Navigate to="/app" replace /> : <AuthPage />} 
      />
      
      {/* Перенаправление на главную */}
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
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
