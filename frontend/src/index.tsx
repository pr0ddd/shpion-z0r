import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ServerProvider } from './contexts/ServerContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { theme } from './theme';
import reportWebVitals from './reportWebVitals';

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

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
  root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={scrollbarStyles} />
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <ServerProvider>
              <App />
            </ServerProvider>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
