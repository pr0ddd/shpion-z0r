import React, { useRef, useEffect } from 'react';
import { Box, IconButton, Fade, Dialog } from '@mui/material';
import { TrackReference } from '@livekit/components-react';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { StreamPlayer, StreamPlayerHandle } from '@shared/ui';
import { useServer } from '@shared/hooks';

interface ParticipantVideoTileProps {
  trackRef: TrackReference;
}

export const ParticipantVideoTile: React.FC<ParticipantVideoTileProps> = ({ trackRef }) => {
    const { selectedServer } = useServer();

    const playerRef = useRef<StreamPlayerHandle>(null);

    const handlePopout = () => {
        if (!selectedServer) return;
        const url = `${window.location.origin}/stream/${selectedServer.id}/${trackRef.publication.trackSid}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // mute превью при выходе из fullscreen
    useEffect(() => {
        const handler = (e: Event) => {
            const ce = e as CustomEvent<{ trackSid: string; isFs: boolean }>;
            console.log('[ParticipantVideoTile] fs-change event', ce.detail);
            if (ce.detail.trackSid === (trackRef.publication as any).trackSid && !ce.detail.isFs) {
                console.log('[ParticipantVideoTile] calling muteHard');
                playerRef.current?.muteHard();
            }
        };
        document.addEventListener('stream-fs-change', handler);
        return () => document.removeEventListener('stream-fs-change', handler);
    }, [trackRef]);

    return (
        <>
            <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', backgroundColor: '#000', lineHeight: 0 }}>
                <StreamPlayer ref={playerRef} trackRef={trackRef} mode="main" onPopout={handlePopout} />
            </Box>
        </>
    );
}; 