import React, { createContext, useContext, useCallback, useMemo, useState, ReactNode, useEffect } from 'react';
import { serverAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { Server } from '../types';

interface ServerContextType {
    servers: Server[];
  selectedServer: Server | null;
  isLoading: boolean;
  error: string | null;
  selectServer: (server: Server | null) => void;
    fetchServers: () => Promise<void>;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export const useServer = () => {
    const context = useContext(ServerContext);
    if (!context) {
        throw new Error('useServer must be used within a ServerProvider');
    }
    return context;
};

export const ServerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
    const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

    const fetchServers = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await serverAPI.getServers();
            if (response.success && response.data) {
                setServers(response.data);
                // Automatically select the first server if none is selected
                if (!selectedServer && response.data.length > 0) {
                    setSelectedServer(response.data[0]);
                }
            } else {
                setError(response.error || 'Failed to fetch servers');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const selectServer = (server: Server | null) => {
        setSelectedServer(server);
    };

    useEffect(() => {
        fetchServers();
    }, [fetchServers]);

    const contextValue = useMemo(() => ({
        servers,
    selectedServer,
    isLoading,
    error,
    selectServer,
        fetchServers,
    }), [servers, selectedServer, isLoading, error, fetchServers]);

  return (
        <ServerContext.Provider value={contextValue}>
      {children}
    </ServerContext.Provider>
  );
}; 