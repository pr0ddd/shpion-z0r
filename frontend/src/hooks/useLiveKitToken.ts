import { useState, useEffect } from 'react';
import { livekitAPI } from '../services/api';
import { Server } from '../types';

export const useLiveKitToken = (server: Server | null) => {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Immediately clear the token when the server changes.
        setToken(null);
        
        if (!server) {
            // No need to do anything else if there's no server.
            //isLoading state should also be false
            setIsLoading(false);
            setError(null);
            return;
        }

        let isMounted = true;
        const fetchToken = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await livekitAPI.getVoiceToken(server.id);
                if (isMounted) {
                    if (response.success && response.data) {
                        setToken(response.data.token);
                    } else {
                        setToken(null);
                        setError(response.error || 'Failed to fetch token');
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setError('An unexpected error occurred.');
                    setToken(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchToken();

        return () => {
            isMounted = false;
        };
    }, [server?.id]);

    return { token, isLoading, error };
}; 