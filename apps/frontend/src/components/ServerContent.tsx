import React from 'react';
import { Box, Chip } from '@mui/material';
import { useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { CustomChat } from '@shared/ui';
import { useServer, useStreamViewStore } from '@shared/hooks';
import { StreamPlayer } from '@shared/ui';
import { AnimatePresence, motion } from 'framer-motion';

const ServerContent = () => {
    const allVideoTracks = useTracks([Track.Source.ScreenShare, Track.Source.Camera]);
    const { selectedServer: server } = useServer();
    const activeStreamSid = useStreamViewStore((state:any)=>state.activeStreamSid);
    const setActiveStream = useStreamViewStore((state:any)=>state.setActiveStream);

    const activeStreamRef = activeStreamSid ? allVideoTracks.find(t=> t.publication.trackSid===activeStreamSid) ?? null : null;

    if (!server) {
        return (
            <Box sx={{ flexGrow: 1, minHeight: 0, background: '#36393f' }}>
                <CustomChat />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', height: '100%', minHeight: 0, flexGrow:1 }}>
            <AnimatePresence mode="wait">
                {activeStreamRef ? (
                    <motion.div
                        key="player"
                        style={{ flexGrow:1, display:'flex', alignItems:'center', justifyContent:'center', minHeight:0, background:'#36393f' }}
                        initial={{ opacity:0 }}
                        animate={{ opacity:1 }}
                        exit={{ opacity:0 }}
                        transition={{ duration:0.25 }}
                    >
                        <Box sx={{ width:'100%', height:'100%', position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <StreamPlayer trackRef={activeStreamRef} />
                            <Box sx={{ position:'absolute', top:8, left:8 }}>
                                <Chip label='Вернуться к чату' onClick={()=>setActiveStream(null)} color='default' clickable />
                            </Box>
                        </Box>
                    </motion.div>
                ) : (
                    <motion.div
                        key="chat"
                        style={{ flexGrow:1, minHeight:0, background:'#36393f' }}
                        initial={{ opacity:0 }}
                        animate={{ opacity:1 }}
                        exit={{ opacity:0 }}
                        transition={{ duration:0.25 }}
                    >
                        <CustomChat />
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
};

export default ServerContent;