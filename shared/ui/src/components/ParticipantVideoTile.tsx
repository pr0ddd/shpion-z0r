import React, { useState } from 'react';
import { Box, IconButton, Fade, Dialog } from '@mui/material';
import { TrackReference } from '@livekit/components-react';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { StreamPlayer } from '@shared/ui';
import { useServer } from '@shared/hooks';

interface ParticipantVideoTileProps {
  trackRef: TrackReference;
}

export const ParticipantVideoTile: React.FC<ParticipantVideoTileProps> = ({ trackRef }) => {
    const { selectedServer } = useServer();

    const handlePopout = () => {
        if (!selectedServer) return;
        const url = `${window.location.origin}/stream/${selectedServer.id}/${trackRef.publication.trackSid}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <>
            <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', backgroundColor: '#000', lineHeight: 0 }}>
                <StreamPlayer trackRef={trackRef} mode="main" onPopout={handlePopout} />
            </Box>
        </>
    );
}; 