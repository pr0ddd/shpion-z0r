// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useTracks } from '@livekit/components-react';
import { Track, VideoQuality } from 'livekit-client';
import { isRemotePublication } from '@shared/hooks/lib/livekitUtils';
import { CustomChat } from '@features/messages';
import { useStreamViewStore, useUploadPreview } from '@features/streams';
import { useServer } from '@features/servers';
import { StreamPlayer, ScreenSharePreview } from '@shared/ui';
import { AnimatePresence, motion } from 'framer-motion';
import StreamControlsDock from './StreamControlsDock';

const ServerContent = () => {
    const allVideoTracks = useTracks([Track.Source.ScreenShare, Track.Source.Camera], { onlySubscribed: false });
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

    // Request highest simulcast layer for primary track
    useEffect(() => {
        if(!primarySid) return;
        const pub = screenShareTracksAll.find(t=> t.publication.trackSid===primarySid)?.publication as any;
        if(pub?.setVideoQuality){
            try{ pub.setVideoQuality(VideoQuality.HIGH); }catch{}
        }
    }, [primarySid]);

    // auto-disable multiview when no streams
    useEffect(()=>{
        if(screenShareTracks.length===0 && multiView){
            setMultiView(false);
        }
    }, [screenShareTracks.length, multiView]);

    const isStreamer = screenShareTracksAll.some(t=> t.participant?.isLocal);

    // manage subscriptions to minimize bandwidth
    useEffect(()=>{
      screenShareTracksAll.forEach(t=>{
        if(isRemotePublication(t.publication) && t.participant?.isLocal){
          const shouldSub = t.publication.trackSid===primarySid;
          t.publication.setSubscribed(shouldSub).catch(()=>{});
        }
      });
    }, [primarySid, screenShareTracksAll.length]);

    const stopViewing = ()=>{
        // unsubscribe from all remote screen share tracks
        screenShareTracks.forEach(t=>{
            if(isRemotePublication(t.publication) && !t.participant?.isLocal){
                void t.publication.setSubscribed(false);
            }
        });
        resetView();
        setMultiView(false);
    };

    const localTracks = screenShareTracksAll.filter(t=> t.participant?.isLocal);

    const LocalPreviewUploader: React.FC<{ track:any }> = ({ track }) => { useUploadPreview(track); return null; };

    const getUsername = (participant:any)=> {
      if (!participant) return 'User';
      // Prefer explicit name provided via LiveKit token
      if (participant.name) return participant.name;
      // Fallback to server members map
      const member = server?.members?.find?.((m:any) => m.userId === participant.identity);
      return member?.user?.username || participant.identity;
    };

    // --- participant color palette ---
    const palette = ['#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#3B82F6', '#EF4444'];
    const userColor = (pid:string)=>{
      let hash = 0;
      for(let i=0;i<pid.length;i++){ hash = (hash<<5)-hash + pid.charCodeAt(i); hash|=0; }
      const idx = Math.abs(hash)%palette.length;
      return palette[idx];
    };

    // Group tracks by participant
    const groupedTracks = useMemo(()=>{
      const map: Record<string, TrackReference[]> = {} as any;
      screenShareTracks.forEach(t=>{
        const pid = t.participant?.sid || 'unknown';
        if(!map[pid]) map[pid] = [];
        map[pid].push(t);
      });
      return Object.entries(map);
    }, [screenShareTracks]);

    if (!server) {
        return (
            <Box sx={{ flexGrow: 1, minHeight: 0, background: '#36393f' }}>
                <CustomChat />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', height: '100%', minHeight: 0, flexGrow:1 }}>
            {/* Hidden uploaders for local preview frames */}
            {localTracks.map(t=> <LocalPreviewUploader key={t.publication.trackSid} track={t} />)}

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
                                     <Box sx={{ display:'flex', flexDirection:'column', alignItems:'stretch', justifyContent:'flex-start', gap:1, overflowY:'auto', py:1, px:1, width:260, flexShrink:0 }}>
                                       <AnimatePresence>
                                         {groupedTracks.map(([pid, tracks])=> (
                                           <React.Fragment key={pid}>
                                             {/* header */}
                                             <Box sx={{ mb:0.5, display:'flex', alignItems:'center', gap:0.5, pl:0.5 }}>
                                               <Box sx={{ width:10, height:10, bgcolor:userColor(pid), borderRadius:'50%' }} />
                                               <Typography variant="caption" sx={{ color:'#fff', fontWeight:700 }}>
                                                 {getUsername(tracks[0]?.participant)}
                                               </Typography>
                                             </Box>
                                             {tracks.filter(t=> t.publication.trackSid!==primarySid).map(track=>(
                                               <motion.div key={track.publication.trackSid}
                                                 initial={{ opacity: 0, scale: 0.8 }}
                                                 animate={{ opacity: 1, scale: 1 }}
                                                 exit={{ opacity: 0, scale: 0.8 }}
                                                 transition={{ duration: 0.25 }}
                                                 style={{ width:'100%' }}
                                               >
                                                 <Box sx={{ width:'100%', aspectRatio:'16/9', position:'relative', cursor:'pointer', borderRadius:1, overflow:'hidden' }} onClick={()=> setPrimarySid(track.publication.trackSid)}>
                                                   <ScreenSharePreview trackRef={track} staticImage />
                                                   <Box sx={{ position:'absolute', top:4, left:4, bgcolor: userColor(pid), px:0.5, py:0.1, borderRadius:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                     <Typography variant="caption" sx={{ color:'#fff', fontSize:10, fontWeight:600 }}>{getUsername(track.participant)}</Typography>
                                                   </Box>
                                                 </Box>
                                               </motion.div>
                                             ))}
                                           </React.Fragment>
                                         ))}
                                       </AnimatePresence>
                                     </Box>
                                   )}

                                   {/* Big primary on the right */}
                                   <AnimatePresence mode="wait">
                                     {primarySid && (
                                       <motion.div key={primarySid} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.25}} style={{display:'flex', alignItems:'center', justifyContent:'flex-end', flex:1, minHeight:0}}>
                                         <Box sx={{ position:'relative', height:'100%', width:'auto', flexGrow:1, overflow:'hidden', borderRadius: fullscreen ? 0 : 1 }}>
                                           <StreamPlayer trackRef={screenShareTracks.find(t=> t.publication.trackSid===primarySid) || screenShareTracks[0]} />
                                           <Box sx={{ position:'absolute', top:8, left:8, bgcolor: userColor(screenShareTracks.find(t=> t.publication.trackSid===primarySid)?.participant?.sid || 'x'), px:1, py:0.3, borderRadius:1, maxWidth:'50%', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                             <Typography variant="caption" sx={{ color:'#fff', fontWeight:600 }}>{getUsername(screenShareTracks.find(t=> t.publication.trackSid===primarySid)?.participant)}</Typography>
                                           </Box>
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
                                     <motion.div key={primarySid} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.25}} style={{display:'flex', alignItems:'center', justifyContent:'center', width:'100%'}}>
                                        <Box sx={{ position:'relative', height:'auto', width:'100%', maxHeight:maxVideoHeight, maxWidth:'100%', mx:'auto', aspectRatio:'16/9', overflow:'hidden', borderRadius:1 }}>
                                           <StreamPlayer trackRef={screenShareTracks.find(t=> t.publication.trackSid===primarySid) || screenShareTracks[0]} />
                                           <Box sx={{ position:'absolute', top:8, left:8, bgcolor: userColor(screenShareTracks.find(t=> t.publication.trackSid===primarySid)?.participant?.sid || 'x'), px:1, py:0.3, borderRadius:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                             <Typography variant="caption" sx={{ color:'#fff', fontWeight:600 }}>{getUsername(screenShareTracks.find(t=> t.publication.trackSid===primarySid)?.participant)}</Typography>
                                           </Box>
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
                                                  <ScreenSharePreview trackRef={track} staticImage />
                                                  <Box sx={{ position:'absolute', top:4, left:4, bgcolor: userColor(track.participant?.sid || 'x'), px:1, py:0.2, borderRadius:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                    <Typography variant="caption" sx={{ color:'#fff', fontSize:10, fontWeight:600 }}>{getUsername(track.participant)}</Typography>
                                                  </Box>
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