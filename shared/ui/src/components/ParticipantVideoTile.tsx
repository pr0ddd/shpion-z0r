import React, { useState } from 'react';
import { Box, Typography, IconButton, Fade, Dialog } from '@mui/material';
import { VideoTrack, TrackReference, useParticipants } from '@livekit/components-react';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { ParticipantFullscreenView } from './ParticipantFullscreenView';

interface ParticipantVideoTileProps {
  trackRef: TrackReference;
}

export const ParticipantVideoTile: React.FC<ParticipantVideoTileProps> = ({ trackRef }) => {
    const participants = useParticipants();
    const participantId = trackRef.participant.identity;
    
    // Find the participant in the LiveKit room participants list
    const participant = participants.find(p => p.identity === participantId);

    // Attempt to parse metadata to get the username, fallback to identity
    let name = participantId;
    if (participant?.metadata) {
        try {
            const metadata = JSON.parse(participant.metadata);
            name = metadata.username || participantId;
        } catch (e) {
            console.error('Failed to parse participant metadata:', e);
            // Keep fallback name
        }
    }


    const [fullscreenOpen, setFullscreenOpen] = useState(false);

    return (
        <>
            <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', backgroundColor: '#000', lineHeight: 0 }}>
                <VideoTrack trackRef={trackRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
                <Fade in={true}>
                    <Box>
                        <Box sx={{ position: 'absolute', top: '8px', left: '8px', px: 1.5, py: 0.5, backgroundColor: 'rgba(0, 0, 0, 0.6)', borderRadius: '6px', backdropFilter: 'blur(4px)' }}>
                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                                {name}
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setFullscreenOpen(true)} sx={{ position: 'absolute', bottom: '8px', right: '8px', color: 'white', backgroundColor: 'rgba(0, 0, 0, 0.5)', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' } }}>
                            <FullscreenIcon />
                        </IconButton>
                    </Box>
                </Fade>
            </Box>
            <Dialog 
                fullScreen 
                open={fullscreenOpen} 
                onClose={() => setFullscreenOpen(false)} 
                PaperProps={{ 
                    sx: { 
                        backgroundColor: 'black',
                        overflow: 'hidden'
                    } 
                }}
            >
                <ParticipantFullscreenView trackRef={trackRef} name={name} onClose={() => setFullscreenOpen(false)} />
            </Dialog>
        </>
    );
}; 