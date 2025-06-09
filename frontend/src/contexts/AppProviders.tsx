import React from 'react';
import { AuthProvider } from './AuthContext';
import { ServerProvider } from './ServerContext';
import { SocketProvider } from './SocketContext';
import ErrorBoundary from '../components/ErrorBoundary';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <ServerProvider>
            {children}
          </ServerProvider>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}; 