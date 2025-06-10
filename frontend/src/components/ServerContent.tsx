import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTracks, VideoTrack, TrackRefContext, TrackReference } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { AnimatePresence, motion } from 'framer-motion';
import { CustomChat } from './CustomChat';
import { useServer } from '../contexts/ServerContext';
import { Server } from '../types';

const streamsSidebarVariants = {
  hidden: { width: 0, opacity: 0, x: 50 },
  visible: { 
    width: 320,
    opacity: 1,
    x: 0,
    transition: {
      width: { duration: 0.3, ease: 'easeInOut' },
      opacity: { duration: 0.2, ease: 'easeIn', delay: 0.1 },
      x: { duration: 0.3, ease: 'easeInOut' }
    }
  },
  exit: {
    width: 0,
    opacity: 0,
    x: 50,
    transition: {
      width: { duration: 0.3, ease: 'easeInOut' },
      opacity: { duration: 0.2, ease: 'easeOut' },
      x: { duration: 0.3, ease: 'easeInOut' }
    }
  }
};

const StreamPreview: React.FC<{ trackRef: TrackReference, members: Server['members'] }> = ({ trackRef, members }) => {
    const participantId = trackRef.participant.identity;
    const member = members.find(m => m.userId === participantId);
    const name = member ? member.user.username : participantId;

    return (
        <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
            <VideoTrack trackRef={trackRef} style={{ width: '100%', height: '100%' }} />
            <Box sx={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                px: 1.5,
                py: 0.5,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '6px',
                backdropFilter: 'blur(4px)',
            }}>
                <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {name}
                </Typography>
            </Box>
        </Box>
    );
};

const ServerContent = () => {
    const screenShareTracks = useTracks([Track.Source.ScreenShare]);
    const { selectedServer: server } = useServer();

    if (!server) {
        return (
            <Box sx={{ flexGrow: 1, minHeight: 0, background: '#36393f' }}>
                <CustomChat />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', height: '100%', minHeight: 0 }}>
            <Box sx={{ flexGrow: 1, minHeight: 0, background: '#36393f' }}>
                <CustomChat />
            </Box>

            <AnimatePresence>
                {screenShareTracks.length > 0 && (
                    <motion.div
                        variants={streamsSidebarVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{
                            flexShrink: 0,
                            overflow: 'hidden',
                            background: '#2f3136',
                            borderLeft: '1px solid rgba(255, 255, 255, 0.12)'
                        }}
                    >
                        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, height: '100%', overflowY: 'auto' }}>
                            <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>Стримы</Typography>
                            {screenShareTracks.map(trackRef => (
                                <TrackRefContext.Provider value={trackRef} key={trackRef.publication.trackSid}>
                                    <StreamPreview trackRef={trackRef} members={server.members} />
                                </TrackRefContext.Provider>
                            ))}
                        </Box>
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
};

export default ServerContent;