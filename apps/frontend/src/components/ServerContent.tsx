// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Box, IconButton } from '@mui/material';
import { useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { CustomChat } from '@shared/ui';
import { useServer, useStreamViewStore } from '@shared/hooks';
import { StreamPlayer } from '@shared/ui';
import { AnimatePresence, motion } from 'framer-motion';
import StreamControlsDock from './StreamControlsDock';

const ServerContent = () => {
    const allVideoTracks = useTracks([Track.Source.ScreenShare, Track.Source.Camera]);
    const { selectedServer: server } = useServer();
    const resetView = useStreamViewStore((state:any)=>state.resetView);
    const multiView = useStreamViewStore((state:any)=>state.multiView);
    const setMultiView = useStreamViewStore((state:any)=>state.setMultiView);
    const chatSidebar = useStreamViewStore((state:any)=>state.chatSidebar);
    const toggleChatSidebar = useStreamViewStore((state:any)=>state.toggleChatSidebar);
    const showStats = useStreamViewStore((state:any)=>state.showStats);
    const toggleShowStats = useStreamViewStore((state:any)=>state.toggleShowStats);
    const fullscreen = useStreamViewStore((state:any)=>state.fullscreen);
    const toggleFullscreen = useStreamViewStore((state:any)=>state.toggleFullscreen);
    const selectedSids = useStreamViewStore((state:any)=>state.selectedSids);
    const screenShareTracksAll = allVideoTracks.filter(t=> t.source === Track.Source.ScreenShare);
    const screenShareTracks = selectedSids && selectedSids.length>0 ? screenShareTracksAll.filter(t=> selectedSids.includes(t.publication.trackSid)) : screenShareTracksAll;

    // Calculate a maximum height for the primary stream so that the whole layout (primary + thumbnails + dock) fits the viewport
    const maxVideoHeight = screenShareTracks.length > 1 ? 'calc(100vh - 240px)' : 'calc(100vh - 160px)';

    // determine primary (big) stream
    const [primarySid, setPrimarySid] = useState<string | null>(null);

    // initialize / update primary when track list changes
    useEffect(() => {
        if (screenShareTracks.length === 0) {
            setPrimarySid(null);
            return;
        }
        // if current primary missing, set to first track
        if (!primarySid || !screenShareTracks.some(t=> t.publication.trackSid===primarySid)) {
            setPrimarySid(screenShareTracks[0].publication.trackSid);
        }
    }, [screenShareTracks.map(t=>t.publication.trackSid).join(',' )]);

    // auto-disable multiview when no streams
    useEffect(()=>{
        if(screenShareTracks.length===0 && multiView){
            setMultiView(false);
        }
    }, [screenShareTracks.length, multiView]);

    const isStreamer = screenShareTracks.some(t=> t.participant?.isLocal);

    const stopViewing = ()=>{
        // unsubscribe from all remote screen share tracks
        screenShareTracks.forEach(t=>{
            if(!t.participant?.isLocal){
                try{ t.publication?.setSubscribed?.(false);}catch(e){}
            }
        });
        resetView();
        setMultiView(false);
    };

    if (!server) {
        return (
            <Box sx={{ flexGrow: 1, minHeight: 0, background: '#36393f' }}>
                <CustomChat />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', height: '100%', minHeight: 0, flexGrow:1 }}>
            {/* Main content area */}
            <Box sx={{ position: 'relative', flexGrow: 1, minWidth: 0, minHeight: 0 }}>
                <AnimatePresence mode="wait">
                    {multiView && screenShareTracks.length > 0 ? (
                        <motion.div
                            key="multiview"
                            style={{
                                flexGrow: 1,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                background: '#000',
                                overflow: 'hidden',
                                minHeight: 0,
                                position: fullscreen ? 'fixed' : 'relative',
                                ...(fullscreen ? { top:0, left:0, width:'100vw', height:'100vh', zIndex:1300 } : {})
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                        >
                            {/* Streams area */}
                            <Box sx={{ flex:1, minHeight:0, display:'flex', flexDirection: fullscreen ? 'row' : 'column', width:'100%', boxSizing:'border-box', gap:2, justifyContent:'center', alignItems: fullscreen ? 'stretch' : 'center', ...(fullscreen ? { pl:2, pr:0 } : { p:2 }) }}>
                               {fullscreen ? (
                                 <>
                                   {/* Thumbnails column on the left */}
                                   {screenShareTracks.length > 1 && (
                                     <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, overflowY:'auto', p:2, width:320, flexShrink:0 }}>
                                       <AnimatePresence>
                                         {screenShareTracks.filter(t=> t.publication.trackSid!==primarySid).map((track)=>(
                                           <motion.div key={track.publication.trackSid}
                                             initial={{ opacity: 0, scale: 0.8 }}
                                             animate={{ opacity: 1, scale: 1 }}
                                             exit={{ opacity: 0, scale: 0.8 }}
                                             transition={{ duration: 0.25 }}
                                             style={{ width:'100%' }}
                                           >
                                             <Box sx={{ width:'100%', aspectRatio:'16/9', position:'relative', cursor:'pointer', borderRadius:1, overflow:'hidden' }} onClick={()=> setPrimarySid(track.publication.trackSid)}>
                                               <StreamPlayer trackRef={track} />
                                             </Box>
                                           </motion.div>
                                         ))}
                                       </AnimatePresence>
                                     </Box>
                                   )}

                                   {/* Big primary on the right */}
                                   <AnimatePresence mode="wait">
                                     {primarySid && (
                                       <motion.div key={primarySid} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.25}} style={{display:'flex', alignItems:'center', justifyContent:'flex-end', flex:1, minHeight:0}}>
                                         <Box sx={{ position:'relative', width:'100%', height:'auto', maxHeight:'100%', aspectRatio:'16/9', overflow:'hidden', borderRadius: fullscreen ? 0 : 1 }}>
                                           <StreamPlayer trackRef={screenShareTracks.find(t=> t.publication.trackSid===primarySid) || screenShareTracks[0]} />
                                         </Box>
                                       </motion.div>
                                     )}
                                   </AnimatePresence>
                                 </>
                               ) : (
                                 <>
                                   {/* Big primary */}
                                   <AnimatePresence mode="wait">
                                   {primarySid && (
                                     <motion.div key={primarySid} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.25}} style={{display:'flex', alignItems:'center', justifyContent:'center', width:'auto'}}>
                                        <Box sx={{ position:'relative', height:'100%', width:'auto', maxHeight:maxVideoHeight, maxWidth:'100%', mx:'auto', aspectRatio:'16/9', overflow:'hidden', borderRadius:1 }}>
                                           <StreamPlayer trackRef={screenShareTracks.find(t=> t.publication.trackSid===primarySid) || screenShareTracks[0]} />
                                        </Box>
                                     </motion.div>
                                   )}
                                   </AnimatePresence>

                                   {/* Thumbnails row */}
                                   {screenShareTracks.length > 1 && (
                                     <Box sx={{ display:'flex', gap:2, justifyContent:'center', width:'100%', maxWidth:'100%', mx:'auto', overflowX:'auto', py:1 }}>
                                        <AnimatePresence>
                                        {screenShareTracks.filter(t=> t.publication.trackSid!==primarySid).map((track)=> (
                                            <motion.div key={track.publication.trackSid}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ duration: 0.25 }}
                                                style={{ width: 170 }}
                                            >
                                               <Box sx={{ width:'100%', aspectRatio:'16/9', position:'relative', cursor:'pointer', borderRadius:1, overflow:'hidden' }} onClick={()=> setPrimarySid(track.publication.trackSid)}>
                                                  <StreamPlayer trackRef={track} />
                                               </Box>
                                            </motion.div>
                                         ))}
                                         </AnimatePresence>
                                      </Box>
                                    )}
                                 </>
                               )}
                            </Box>

                            {/* Dock placed as regular flex item at the bottom */}
                            <StreamControlsDock
                                chatVisible={chatSidebar}
                                onToggleChat={fullscreen ? undefined : toggleChatSidebar}
                                showStats={showStats}
                                onToggleStats={toggleShowStats}
                                isStreamer={isStreamer}
                                showStop={screenShareTracks.length>0}
                                onStopView={stopViewing}
                                fullscreen={fullscreen}
                                onToggleFullscreen={toggleFullscreen}
                                sxOverride={{ px:2, width:'100%' }}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat"
                            style={{
                                flexGrow: 1,
                                minHeight: 0,
                                background: '#36393f',
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                        >
                            <CustomChat />
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>

            {/* Chat sidebar */}
            <motion.div
                initial={false}
                animate={{ width: chatSidebar ? 330 : 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden', flexShrink: 0, height: '100%' }}
            >
                {chatSidebar && (
                    <Box
                        sx={{
                            width: 330,
                            height: '100%',
                            borderLeft: '1px solid rgba(255,255,255,0.08)',
                            overflowY: 'auto',
                            bgcolor: 'background.default',
                        }}
                    >
                        <CustomChat />
                    </Box>
                )}
            </motion.div>
        </Box>
    );
};

export default ServerContent;