import React from 'react';
import { AuthProvider } from './AuthContext';
import { ServerProvider } from './ServerContext';
import { SocketProvider } from './SocketContext';
import ErrorBoundary from '../components/ErrorBoundary';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <SocketProvider>
        <ServerProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </ServerProvider>
      </SocketProvider>
    </AuthProvider>
  );
}; 