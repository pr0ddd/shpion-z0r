import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTracks, TrackRefContext } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { CustomChat } from './CustomChat';
import { useServer } from '../contexts/ServerContext';
import { StreamPreview } from './StreamPreview';

const ServerContent = () => {
    const allVideoTracks = useTracks([Track.Source.ScreenShare, Track.Source.Camera]);
    const activeVideoTracks = allVideoTracks.filter(trackRef => trackRef.publication.track && !trackRef.publication.isMuted);
    const { selectedServer: server } = useServer();

    const streamsSidebarVariants: Variants = {
        hidden: { x: "100%", width: 0 },
        visible: {
            x: 0,
            width: "300px",
            transition: {
                x: { duration: 0.3, ease: 'easeInOut' },
            },
        },
        exit: {
            x: "100%",
            width: 0,
            transition: {
                x: { duration: 0.3, ease: 'easeInOut' },
            },
        },
    };

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
                {activeVideoTracks.length > 0 && (
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
                            {activeVideoTracks.map(trackRef => (
                                <TrackRefContext.Provider value={trackRef} key={trackRef.publication.trackSid}>
                                    <StreamPreview trackRef={trackRef} />
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