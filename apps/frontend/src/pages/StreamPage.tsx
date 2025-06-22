import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { LiveKitRoom, useTracks, TrackReference } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useServersQuery } from '@shared/hooks';
import { livekitAPI } from '@shared/data';
import { useQuery } from '@tanstack/react-query';
import { StreamPlayer } from '@shared/ui';

export const StreamPage: React.FC = () => {
  const { serverId, trackSid } = useParams<{ serverId: string; trackSid: string }>();

  const { data: servers = [] } = useServersQuery();
  const server = servers.find((s) => s.id === serverId) ?? null;

  // Fetch token with unique viewer identity
  const instance = React.useMemo(() => Math.floor(Math.random() * 1e6), []);
  const { data: tokenResp, isLoading: tokenLoading } = useQuery({
    queryKey: ['viewerToken', serverId, instance],
    enabled: !!serverId,
    queryFn: async () => await livekitAPI.getVoiceToken(serverId!, instance),
    staleTime: 55 * 60 * 1000,
  });

  const token = (tokenResp as any)?.data?.token;

  const serverUrl: string | undefined = import.meta.env.DEV
    ? (import.meta.env.VITE_LIVEKIT_URL as string)
    : server?.sfu?.url ?? (import.meta.env.VITE_LIVEKIT_URL as string);

  // Prevent auto-fetch of chat data in this pop-out tab
  React.useEffect(() => {
    const saved = localStorage.getItem('lastSelectedServerId');
    localStorage.removeItem('lastSelectedServerId');
    return () => {
      if (saved) {
        localStorage.setItem('lastSelectedServerId', saved);
      }
    };
  }, []);

  // user gesture gate to pass autoplay policy
  const [ready, setReady] = React.useState(false);

  if (!serverId || !trackSid) return <Typography sx={{ p: 4 }}>Некорректный URL</Typography>;
  if (!ready)
    return (
      <Box sx={{ width: '100vw', height: '100vh', bgcolor: 'background.default', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:2 }}>
        <Typography variant="h6">Нажмите, чтобы начать просмотр стрима</Typography>
        <Box component="button" onClick={async ()=>{
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            await ctx.resume();
            await ctx.close();
          } catch {}
          setReady(true);
        }} sx={{ px:3, py:1.2, fontSize:16, fontWeight:600, borderRadius:2, bgcolor:'primary.main', color:'primary.contrastText', border:'none', cursor:'pointer', '&:hover':{ opacity:0.9 } }}>Запустить</Box>
      </Box>
    );

  if (!token || !serverUrl || tokenLoading)
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <LiveKitRoom token={token} serverUrl={serverUrl} connect audio={false} video={false} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Player trackSid={trackSid!} />
      </LiveKitRoom>
    </Box>
  );
};

const Player: React.FC<{ trackSid: string }> = ({ trackSid }) => {
  const tracks = useTracks([Track.Source.ScreenShare, Track.Source.Camera]);
  const targetTrack = useMemo<TrackReference | null>(() => tracks.find((t) => t.publication.trackSid === trackSid) ?? null, [tracks, trackSid]);
  return (
    <Box sx={{ width: '70vw', maxWidth: 1200, aspectRatio: '16/9', borderRadius: 3, overflow: 'hidden', boxShadow: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <StreamPlayer trackRef={targetTrack} mode="tab" />
    </Box>
  );
};