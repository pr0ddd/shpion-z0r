import React, { useRef, useEffect, useMemo } from 'react';
import { Box, IconButton } from '@mui/material';
import { TrackReference, useTracks, AudioTrack } from '@livekit/components-react';
import { Track } from 'livekit-client';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
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

    // find corresponding audio track (microphone or screenshare audio)
    const audioTracks = useTracks([Track.Source.Microphone, Track.Source.ScreenShareAudio]);
    const participantAudioRefs = useMemo(()=>
        audioTracks.filter(t=> t.participant?.sid === trackRef.participant?.sid),
        [audioTracks, trackRef]);

    return (
        <Box sx={{ position:'relative', borderRadius:2, overflow:'hidden', backgroundColor:'#000', lineHeight:0 }}>
            <StreamPlayer trackRef={trackRef} />
            {participantAudioRefs.map(audioRef => <AudioTrack key={audioRef.publication.trackSid} trackRef={audioRef} />)}
            <IconButton onClick={handlePopout} sx={{ position:'absolute', top:4, right:4, zIndex:2, bgcolor:'rgba(0,0,0,0.6)', color:'#fff', '&:hover':{ bgcolor:'rgba(0,0,0,0.8)' } }} size="small">
                <OpenInNewIcon fontSize="small" />
            </IconButton>
        </Box>
    );
}; 