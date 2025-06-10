import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import ServersSidebar from './ServersSidebar';
import ServerContent from './ServerContent';
import { ServerMembers } from './ServerMembers';
import { useServer } from '../contexts/ServerContext';
import { livekitAPI } from '../services/api';
import { LiveKitRoom } from '@livekit/components-react';
import { AnimatePresence } from 'framer-motion';
import { ServerTransition } from './ServerTransition';

const ProtectedAppLayout: React.FC = () => {
  const { selectedServer } = useServer();
  // State now holds both token and the ID of the server it's for
  const [tokenInfo, setTokenInfo] = useState<{ serverId: string, token: string } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!selectedServer) {
      setTokenInfo(null);
      return;
    }

    setIsTransitioning(true);

    const timer = setTimeout(() => {
      livekitAPI.getVoiceToken(selectedServer.id)
        .then(response => {
          if (response.success && response.data) {
            setTokenInfo({ serverId: selectedServer.id, token: response.data.token });
          } else {
            setTokenInfo(null);
          }
        })
        .catch(() => {
          setTokenInfo(null);
        })
        .finally(() => {
          setIsTransitioning(false);
        });
    }, 1000); // Wait for animation to start

    return () => clearTimeout(timer);
      
  }, [selectedServer]);

  // Only show the LiveKit room if the token we have is for the currently selected server.
  const showLiveKitRoom = selectedServer && tokenInfo && tokenInfo.serverId === selectedServer.id && !isTransitioning;

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <AnimatePresence>
        {isTransitioning && selectedServer && (
          <ServerTransition server={selectedServer} />
        )}
      </AnimatePresence>

      <ServersSidebar />
      {showLiveKitRoom ? (
        <LiveKitRoom
          key={selectedServer.id}
          token={tokenInfo.token}
          serverUrl={process.env.REACT_APP_LIVEKIT_URL}
          connect={true}
          video={false}
          audio={true}
          style={{ display: 'flex', flexGrow: 1, minWidth: 0 }}
        >
          <ServerMembers />
          <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <ServerContent />
          </Box>
        </LiveKitRoom>
      ) : (
        <>
          {/* Placeholder for ServerMembers */}
          <Box sx={{ 
            width: 240, 
            flexShrink: 0,
            borderRight: '1px solid rgba(255, 255, 255, 0.12)', 
            background: '#2f3136',
            height: '100vh'
          }} />
          {/* Placeholder for ServerContent */}
          <Box sx={{ flexGrow: 1, background: '#36393f' }} />
        </>
      )}
    </Box>
  );
};

export default ProtectedAppLayout; 