import React from 'react';

import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SocketProvider } from '@libs/socket';

import './App.css';
import { createAppTheme } from './App.theme';
import { useThemeModeStore } from '@entities/settings/model/themeMode.store';
import { useMemo } from 'react';
import AppRouter from './App.router';

const queryClient = new QueryClient();

const App: React.FC = () => {
  const mode = useThemeModeStore((s) => s.mode);
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <CssBaseline />
          <BrowserRouter>
            <SocketProvider>
              <AppRouter />
            </SocketProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
};

export default App;
