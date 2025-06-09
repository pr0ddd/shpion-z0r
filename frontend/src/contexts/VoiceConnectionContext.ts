import { createContext, useContext } from 'react';

export interface VoiceConnectionContextState {
    isConnected: boolean;
    isConnecting: boolean;
    connect: (serverId: string) => Promise<void>;
    disconnect: () => void;
}

export const VoiceConnectionContext = createContext<VoiceConnectionContextState | undefined>(undefined);

export const useVoiceConnection = () => {
    const context = useContext(VoiceConnectionContext);
    if (context === undefined) {
        throw new Error('useVoiceConnection must be used within a VoiceConnectionProvider');
    }
    return context;
}; 