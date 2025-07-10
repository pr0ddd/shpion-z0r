import React from 'react';
import { Box } from '@mui/material';
import { StreamCard } from '../atoms/StreamCard';
import { memo, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { CircularProgress } from '@ui/atoms/CircularProgress';
import { NoStreamPlaceholder } from '../atoms/NoStreamPlaceholder';
import 'video.js/dist/video-js.css';
import videojs from 'video.js';
import { useServerStore } from '@entities/server/model';
import { useSocket } from '@libs/socket';
import { Message } from '@shared/types';
import { createPortal } from 'react-dom';
import Avatar from '@mui/material/Avatar';
import { dicebearAvatar } from '@libs/dicebearAvatar';
import { useChatWindowStore } from '@entities/chat/model/chatWindow.store';
import ReactDOM from 'react-dom/client';
import ArticleIcon from '@mui/icons-material/Article';
import { Button } from '@mui/material';

interface StreamActiveProps {
  tracks: MediaStreamTrack[];
  /** Callback invoked when user wants to exit stream watching */
  onExit?: () => void;
}

export const StreamActive = memo(
  ({ tracks, onExit }: StreamActiveProps) => (
    <StreamActiveInner tracks={tracks} onExit={onExit} />
  ),
  (prevProps, nextProps) => {
    const concatIds = (tracks: MediaStreamTrack[]) =>
      tracks.map((t) => t.id).join('__');

    return concatIds(prevProps.tracks) === concatIds(nextProps.tracks);
  }
);

// Utility: convert plain text to React nodes with clickable links
const linkify = (text: string): React.ReactNode[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, idx) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#4eaaff', textDecoration: 'underline', pointerEvents: 'auto' }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export const StreamActiveInner: React.FC<StreamActiveProps> = memo(
  ({ tracks, onExit }) => {
    const [isReady, setIsReady] = useState(false);
    const [overlayMessages, setOverlayMessages] = useState<Message[]>([]);
    const [controlsVisible, setControlsVisible] = useState(true);
    const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
    const videoContainerRef = useRef<HTMLDivElement | null>(null);
    const [isFs, setIsFs] = useState(false);
    const selectedServerId = useServerStore((s) => s.selectedServerId);

    // Direct socket listener so overlay works even when chat pane unmounted
    const { socket } = useSocket();
    useEffect(() => {
      if (!socket || !selectedServerId) return;

      const joinRoom = () => socket.emit('server:join', selectedServerId);

      if (socket.connected) {
        joinRoom();
      } else {
        socket.once('connect', joinRoom);
      }

      const onMsg = (msg: Message) => {
        if (msg.serverId !== selectedServerId) return;
        if (msg.id.startsWith('temp_') || msg.status === 'sending') return;

        setOverlayMessages((prev) => [...prev, msg]);

        // Start auto-hide countdown only when NOT hovering
        if (!isHoveringRef.current) {
          scheduleHide(msg.id);
        }
      };

      socket.on('message:new', onMsg as any);
      return () => {
        socket.off('message:new', onMsg as any);
        socket.emit('server:leave', selectedServerId);
        socket.off('connect', joinRoom);
      };
    }, [socket, selectedServerId]);

    // Initialize Video.js once when container is in the DOM
    useEffect(() => {
      if (playerRef.current || !videoContainerRef.current) return;

      // Create <video-js> element dynamically (recommended for React 18 StrictMode)
      const videoElement = document.createElement('video-js');
      videoElement.className = 'vjs-default-skin vjs-big-play-centered vjs-fill';
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoContainerRef.current.appendChild(videoElement);

      // Standard videojs options - remove custom overrides
      const videoJsOptions = {
        controls: true,
        controlBar: {
          playToggle: false,
          liveDisplay: false,
        },
        userActions: {
          click: false,
        },
      } as const;

      const player = (playerRef.current = videojs(videoElement, videoJsOptions));

      // Mark as ready once Video.js finished initialising
      player.ready(() => setIsReady(true));

      // Cleanup on unmount
      return () => {
        playerRef.current?.dispose();
        playerRef.current = null;
      };
    }, []);

    // Whenever track list changes, (re)attach combined MediaStream to the video element
    useEffect(() => {
      if (!playerRef.current) return;
      const vidEl = playerRef.current.el().querySelector('video') as HTMLVideoElement | null;
      if (!vidEl) return;

      if (tracks.length) {
        const stream = new MediaStream(tracks);
        if (vidEl.srcObject !== stream) {
          vidEl.srcObject = stream;
          vidEl.play().catch(() => {});
        }
      } else if (vidEl.srcObject) {
        vidEl.pause();
        // @ts-ignore
        vidEl.srcObject = null;
      }
    }, [tracks]);

    // Detect fullscreen changes based on document.fullscreenElement containing player root
    useEffect(() => {
      const updateFs = () => {
        const root = playerRef.current?.el();
        const fs = !!(root && document.fullscreenElement && root.contains(document.fullscreenElement));
        setIsFs(fs);
      };
      document.addEventListener('fullscreenchange', updateFs);
      updateFs();
      return () => document.removeEventListener('fullscreenchange', updateFs);
    }, []);

    // Track auto-hide timers for each message and hover state
    const hideTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
    const isHoveringRef = useRef(false);

    const clearAllHideTimers = useCallback(() => {
      Object.values(hideTimersRef.current).forEach(clearTimeout);
      hideTimersRef.current = {};
    }, []);

    const scheduleHide = useCallback(
      (id: string, delay = 5000) => {
        clearTimeout(hideTimersRef.current[id]);
        hideTimersRef.current[id] = setTimeout(() => {
          setOverlayMessages((prev) => prev.filter((m) => m.id !== id));
          delete hideTimersRef.current[id];
        }, delay);
      },
      [],
    );

    // Compute overlay portal
    const overlayPortal = useMemo(() => {
      if (!isFs || overlayMessages.length === 0) return null;
      const fsRoot = document.fullscreenElement as HTMLElement | null;
      if (!fsRoot) return null;

      const handleMouseEnter = () => {
        isHoveringRef.current = true;
        clearAllHideTimers();
      };

      const handleMouseLeave = () => {
        isHoveringRef.current = false;
        // Stagger removal so they disappear по одному
        const STAGGER = 500; // ms between removals after base delay
        overlayMessages.forEach((m, idx) => {
          scheduleHide(m.id, 5000 + idx * STAGGER);
        });
      };

      return createPortal(
        <Box
          sx={{
            position: 'absolute',
            bottom: 32,
            left: 32,
            display: 'flex',
            flexDirection: 'column-reverse',
            gap: 0.5,
            zIndex: 2147483647,
            pointerEvents: 'none',
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {overlayMessages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: '#fff',
                padding: '6px 10px',
                borderRadius: 1,
                maxWidth: '40vw',
                fontSize: '0.9rem',
                lineHeight: 1.2,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                pointerEvents: 'auto', // enable interaction with links
              }}
            >
              <Avatar
                src={msg.author?.avatar || dicebearAvatar(msg.author?.id ?? msg.authorId)}
                sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
              >
                {msg.author?.username?.[0] ?? 'U'}
              </Avatar>
              <Box component="span" sx={{ wordBreak: 'break-word' }}>
                <strong>{msg.author?.username ?? 'user' + msg.author?.id}: </strong>
                {linkify(msg.content)}
              </Box>
            </Box>
          ))}
        </Box>,
        fsRoot,
      );
    }, [overlayMessages, isFs]);

    // Register custom chat button component once
    useEffect(() => {
      if (!playerRef.current) return;

      const Component = videojs.getComponent('ChatToggleButton');
      if (!Component) {
        // Define new component extending Button
        const Button = videojs.getComponent('Button');
        const ChatToggleButton = class extends Button {
          constructor(player: any, options: any) {
            super(player, options);
            (this as any).controlText && (this as any).controlText('Chat');
            this.addClass('vjs-chat-toggle-control');

            // Render MUI icon into button element using ReactDOM
            const iconContainer = document.createElement('span');
            iconContainer.className = 'vjs-chat-icon';
            this.el().appendChild(iconContainer);

            const root = ReactDOM.createRoot(iconContainer);
            root.render(<ArticleIcon />);
          }

          handleClick() {
            // Toggle chat window via store
            useChatWindowStore.getState().toggle();
          }
        };

        videojs.registerComponent('ChatToggleButton', ChatToggleButton as any);
      }

      // Add to control bar if not yet
      const controlBar = playerRef.current.getChild('controlBar');
      if (controlBar && !controlBar.getChild('ChatToggleButton')) {
        // Insert before fullscreen toggle (if present), else at end
        const fsToggle = controlBar.getChild('fullscreenToggle');
        const insertIndex = fsToggle ? controlBar.children().indexOf(fsToggle) : controlBar.children().length;
        controlBar.addChild('ChatToggleButton', {}, insertIndex);
      }
    }, [playerRef.current]);

    // Sync custom overlay visibility with Video.js control bar visibility
    useEffect(() => {
      if (!playerRef.current) return;
      const player = playerRef.current;

      const show = () => setControlsVisible(true);
      const hide = () => setControlsVisible(false);

      player.on('useractive', show);
      player.on('userinactive', hide);

      return () => {
        player.off('useractive', show);
        player.off('userinactive', hide);
      };
    }, []);

    return (
      <StreamCard grow>
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
          {/* Exit / Close button overlay */}
          {tracks.length > 0 && controlsVisible && (
            <Button
              variant="contained"
              color="error"
              onClick={onExit}
              sx={{
                position: 'absolute',
                top: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 2147483648,
                textTransform: 'none',
                fontSize: '0.75rem',
                padding: '6px 12px',
                backgroundColor: 'rgba(212, 35, 35, 0.6)',
                '&:hover': { backgroundColor: 'rgba(248, 12, 12, 0.8)' },
              }}
            >
              Прекратить просмотр
            </Button>
          )}

          {/* Video.js player container */}
          <Box
            ref={videoContainerRef}
            sx={{
              width: '100%',
              height: '100%',
              display: tracks.length > 0 ? 'block' : 'none',
            }}
          />

          {/* Placeholder / Loader */}
          {tracks.length === 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isReady ? <NoStreamPlaceholder /> : <CircularProgress />}
            </Box>
          )}

          {/* Chat overlay via portal when fullscreen */}
          {overlayPortal}
        </Box>
      </StreamCard>
    );
  }
);
