import React from 'react';

import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from '@features/auth';
import { SocketProvider } from '@features/socket';
import { NotificationProvider } from '@features/notifications';

import './App.css';
import { theme } from './App.theme';
import AppRouter from './App.router';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <CssBaseline />
          <BrowserRouter>
            <AuthProvider>
              <SocketProvider>
                <NotificationProvider>
                  <AppRouter />
                </NotificationProvider>
              </SocketProvider>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
};

export default App;
