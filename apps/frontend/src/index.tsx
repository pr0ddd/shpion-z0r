import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material';
import { ServerProvider } from '@shared/hooks'; // REMOVE ??? !!!
import { AuthProvider } from '@features/auth';
import { SocketProvider } from '@features/socket';
import { NotificationProvider } from '@features/notifications';

import { theme } from './theme';
import reportWebVitals from './reportWebVitals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const scrollbarStyles = {
  '*::-webkit-scrollbar': {
    width: '8px',
  },
  '*::-webkit-scrollbar-track': {
    background: '#2f3136',
  },
  '*::-webkit-scrollbar-thumb': {
    backgroundColor: '#202225',
    borderRadius: '4px',
    border: '2px solid #2f3136',
  },
  '*::-webkit-scrollbar-thumb:hover': {
    backgroundColor: '#1a1b1e',
  },
};

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <CssBaseline />
        <GlobalStyles styles={scrollbarStyles} />
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
              <ServerProvider>
                <NotificationProvider>
                  <App />
                </NotificationProvider>
              </ServerProvider>
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
