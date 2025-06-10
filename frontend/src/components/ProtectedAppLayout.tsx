import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import ServersSidebar from './ServersSidebar';
import ServerContent from './ServerContent';
import { ServerMembers } from './ServerMembers';
import { useServer } from '../contexts/ServerContext';
import { livekitAPI } from '../services/api';
import { LiveKitRoom } from '@livekit/components-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ServerTransition } from './ServerTransition';

const layoutVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
};

const ProtectedAppLayout: React.FC = () => {
  const { selectedServer, isLoading: isServerListLoading } = useServer();
  const [tokenInfo, setTokenInfo] = useState<{ serverId: string, token: string } | null>(null);
  
  useEffect(() => {
    if (!selectedServer) {
      setTokenInfo(null);
      return;
    }

    setTokenInfo(null); // Reset token info to ensure transition on every server change

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
      });
      
  }, [selectedServer?.id]);

  const canShowLiveKitRoom = selectedServer && tokenInfo && tokenInfo.serverId === selectedServer.id;

  if (isServerListLoading) {
    return (
        <Box sx={{ width: '100vw', height: '100vh', backgroundColor: '#202225' }} />
    );
  }
  
  const showTransition = selectedServer && !canShowLiveKitRoom;

  return (
    <AnimatePresence mode="wait">
      {showTransition && selectedServer ? (
        <motion.div key="transition">
          <ServerTransition server={selectedServer} />
        </motion.div>
      ) : (
        <motion.div key="layout" variants={layoutVariants} initial="initial" animate="animate">
          <Box sx={{ display: 'flex', height: '100vh' }}>
            <ServersSidebar />
            {canShowLiveKitRoom && selectedServer ? (
              <LiveKitRoom
                key={selectedServer.id}
                token={tokenInfo!.token} // Use non-null assertion as canShowLiveKitRoom guarantees it
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProtectedAppLayout; 