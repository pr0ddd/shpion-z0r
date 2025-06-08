import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme';
import AppPage from './pages/AppPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import InvitePage from './pages/InvitePage';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { SocketProvider } from './contexts/SocketContext';

// Компонент для редиректа авторизованных пользователей
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return null; // Или можно показать спиннер
  }
  
  if (user) {
    return <Navigate to="/app" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Routes>
              {/* Публичные роуты (только для неавторизованных) */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              
              {/* Приглашения (публичный роут) */}
              <Route
                path="/invite/:inviteCode"
                element={<InvitePage />}
              />
              
              {/* Защищенные роуты */}
              <Route
                path="/app"
                element={
                  <PrivateRoute>
                    <AppPage />
                  </PrivateRoute>
                }
              />
              
              {/* Главная страница - редирект в зависимости от аутентификации */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Navigate to="/app" replace />
                  </PrivateRoute>
                }
              />
              
              {/* Catch-all роут */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
