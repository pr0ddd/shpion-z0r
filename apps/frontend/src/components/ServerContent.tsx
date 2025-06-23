// @ts-nocheck
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
    const multiView = useStreamViewStore((state:any)=>state.multiView);
    const setActiveStream = useStreamViewStore((state:any)=>state.setActiveStream);
    const resetView = useStreamViewStore((state:any)=>state.resetView);

    const activeStreamRef = activeStreamSid ? allVideoTracks.find(t=> t.publication.trackSid===activeStreamSid) ?? null : null;
    const screenShareTracks = allVideoTracks.filter(t=> t.source === Track.Source.ScreenShare);

    // helper to compute grid styles depending on count
    const getGridStyles = (count:number)=>{
        if(count<=1){
            return {cols:'1fr', rows:'1fr', itemSpan:undefined };
        }
        if(count===2){
            return {cols:'repeat(2, 1fr)', rows:'auto', itemSpan:undefined};
        }
        if(count===3){
            return {cols:'repeat(2, 1fr)', rows:'auto auto', itemSpan:undefined};
        }
        return {cols:'repeat(2, 1fr)', rows:'auto auto', itemSpan:undefined}; // 4+
    };
    const gridCfg = getGridStyles(screenShareTracks.length);

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
                {multiView ? (
                    <motion.div
                        key="multiview"
                        style={{ flexGrow:1, display:'flex', alignItems:'center', justifyContent:'center', minHeight:0, background:'#36393f', padding: screenShareTracks.length>1 ? 16 : 0, overflow:'hidden', position:'relative' }}
                        initial={{ opacity:0 }}
                        animate={{ opacity:1 }}
                        exit={{ opacity:0 }}
                        transition={{ duration:0.25 }}
                    >
                        <Box sx={{ width:'100%', height:'100%', position:'relative', display:'grid', gap:2,
                                   gridTemplateColumns: gridCfg.cols,
                                   gridTemplateRows: gridCfg.rows, overflow:'hidden', alignContent:'start' }}>
                            {screenShareTracks.map((track,idx)=>(
                                <Box key={track.publication.trackSid}
                                     sx={{ width:'100%', position:'relative', ...(screenShareTracks.length>1 ? {aspectRatio:'16/9'} : {height:'100%'}), ...(gridCfg.itemSpan && idx===2 ? {gridColumn:`1 / span ${gridCfg.itemSpan}`} : {}) }}>
                                    <StreamPlayer trackRef={track} />
                                </Box>
                            ))}
                        </Box>
                        <Box sx={{ position:'absolute', top:8, left:8 }}>
                            <Chip label='Вернуться к чату' onClick={()=>resetView()} color='default' clickable />
                        </Box>
                    </motion.div>
                ) : activeStreamRef ? (
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