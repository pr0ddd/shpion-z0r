import React from 'react';

import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SocketProvider } from '@libs/socket';
import { useEffect } from 'react';
import { useDeepFilterModelStore } from '@libs/deepFilterNet/modelLoad.store';
import { loadDeepFilterAssets } from '@libs/deepFilterNet/loadAssets';
import { createGlobalAudioContext } from '@libs/audioContext';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

import './App.css';
import { createAppTheme } from './App.theme';
import { useThemeModeStore } from '@entities/settings/model/themeMode.store';
import { useMemo } from 'react';
import AppRouter from './App.router';
import { useServerStore } from '@entities/server/model/server.store';

const queryClient = new QueryClient();

const App: React.FC = () => {
  const mode = useThemeModeStore((s) => s.mode);
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  // --- AudioContext unlock handling ---
  const [needsUnlock, setNeedsUnlock] = React.useState(false);
  const audioCtxRef = React.useRef<AudioContext | null>(null);

  // Ранняя предзагрузка модели шумоподавления с индикатором
  const modelLoading = useDeepFilterModelStore((s) => s.loading);
  const modelLoaded = useDeepFilterModelStore((s)=>s.loaded);
  const setModelLoading = useDeepFilterModelStore((s) => s.setLoading);
  const setModelLoaded = useDeepFilterModelStore((s) => s.setLoaded);

  useEffect(() => {
    audioCtxRef.current = createGlobalAudioContext();

    // Always trigger asset loading – if they are already in cache it will resolve instantly.
    setModelLoading(true);
    loadDeepFilterAssets()
      .catch(() => {/* ignore errors, stay on loading screen */})
      .finally(() => setModelLoaded());
  }, []);

  // Show unlock dialog once we actually joined a server and still need gesture
  const isConnectedServer = useServerStore((s) => s.isConnected);

  useEffect(() => {
    if (!isConnectedServer) return;
    const ctx = audioCtxRef.current ?? createGlobalAudioContext();
    if (ctx.state === 'suspended') {
      setNeedsUnlock(true);
    }
  }, [isConnectedServer]);

  return (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <CssBaseline />
          <BrowserRouter>
            <SocketProvider>
              <AppRouter />
            </SocketProvider>
          </BrowserRouter>
          {/* Model loading dialog */}
          <Dialog open={modelLoading || !modelLoaded} hideBackdrop>
            <DialogTitle>Preparing audio processing</DialogTitle>
            <DialogContent sx={{ minWidth: 300 }}>
              Downloading required files. This may take a few seconds…
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
              </Box>
            </DialogContent>
          </Dialog>

          {/* Audio unlock dialog */}
          <Dialog open={needsUnlock} disableEscapeKeyDown>
            <DialogTitle>Action Required</DialogTitle>
            <DialogContent sx={{ minWidth: 300 }}>
              Your interaction is required to start audio playback in the browser. Simply click “OK” to continue.
              <Box sx={{ display:'flex', justifyContent:'flex-end', mt:2 }}>
                <Button variant="contained" onClick={async()=>{
                  try {
                    if(audioCtxRef.current?.state==='suspended'){
                      await audioCtxRef.current.resume();
                    }
                  } catch {}
                  setNeedsUnlock(false);
                }}>OK</Button>
              </Box>
            </DialogContent>
          </Dialog>
        </QueryClientProvider>
      </ThemeProvider>
  );
};

export default App;
