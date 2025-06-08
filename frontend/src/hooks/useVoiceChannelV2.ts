import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Room, 
  RoomEvent, 
  Track, 
  RemoteTrack, 
  RemoteTrackPublication, 
  RemoteParticipant,
  Participant
} from 'livekit-client';
import { livekitAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from './useAuth';
import { VoiceParticipant } from '../types/socket';

export interface UseVoiceChannelV2Result {
  // User state
  isInLobby: boolean;
  
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  currentServerId: string | null;
  
  // Audio controls
  isMuted: boolean;
  isDeafened: boolean;
  toggleMute: () => void;
  toggleDeafen: () => void;
  
  // Participants from WebSocket
  participants: VoiceParticipant[];
  
  // Actions
  selectServer: (serverId: string) => void;
  leaveServer: () => void;
  
  // Room instance
  room: Room | null;
}

export const useVoiceChannelV2 = (): UseVoiceChannelV2Result => {
  // Get authenticated user and socket context
  const { user } = useAuth();
  const { state: socketState, actions: socketActions, isConnected: socketConnected } = useSocket();
  
  // User state
  const [isInLobby, setIsInLobby] = useState(true);
  
  // Connection state
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Refs
  const roomRef = useRef<Room | null>(null);
  const isJoiningRef = useRef(false);

  // Get current voice state from WebSocket context
  const currentServerId = socketState.currentServerId;
  const isMuted = socketState.currentUserVoiceState.isMuted;
  const isDeafened = socketState.currentUserVoiceState.isDeafened;
  const participants = currentServerId ? (socketState.voiceParticipants.get(currentServerId) || []) : [];

  console.log('🎤 useVoiceChannelV2 State:', {
    isInLobby,
    currentServerId,
    isConnected,
    isConnecting,
    connectionError,
    participantsCount: participants.length,
    roomExists: !!room,
    socketConnected,
    isMuted,
    isDeafened,
  });

  // Helper function to extract real user ID from LiveKit identity (format: "userId:username")
  const extractUserIdFromIdentity = (identity: string): string | null => {
    if (identity.includes(':')) {
      return identity.split(':')[0];
    }
    return null;
  };

  // LiveKit event handlers
  const handleTrackSubscribed = useCallback((
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant,
  ) => {
    console.log('📡 Track subscribed:', track.kind, 'from', participant.identity);
    
    if (track.kind === Track.Kind.Audio) {
      const element = track.attach() as HTMLAudioElement;
      element.autoplay = true;
      element.style.display = 'none';
      element.volume = isDeafened ? 0 : 1;
      element.muted = isDeafened;
      document.body.appendChild(element);
    }
  }, [isDeafened]);

  const handleTrackUnsubscribed = useCallback((
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant,
  ) => {
    console.log('📡 Track unsubscribed:', track.kind, 'from', participant.identity);
    track.detach();
  }, []);

  const handleParticipantConnected = useCallback((participant: RemoteParticipant) => {
    console.log('👤 Participant connected:', participant.identity);
    
    // Extract real user ID and notify via WebSocket
    const realUserId = extractUserIdFromIdentity(participant.identity);
    if (realUserId && currentServerId && socketConnected) {
      // WebSocket will handle adding to participants list
      // No need to manually manage participants here
    }
  }, [currentServerId, socketConnected]);

  const handleParticipantDisconnected = useCallback((participant: RemoteParticipant) => {
    console.log('👤 Participant disconnected:', participant.identity);
    
    // Extract real user ID and notify via WebSocket
    const realUserId = extractUserIdFromIdentity(participant.identity);
    if (realUserId && currentServerId && socketConnected) {
      // WebSocket will handle removing from participants list
      // No need to manually manage participants here
    }
  }, [currentServerId, socketConnected]);

  const handleActiveSpeakerChange = useCallback((speakers: Participant[]) => {
    console.log('🗣️ Active speakers changed:', speakers.length);
    
    // Update speaking state via WebSocket for each speaker
    if (currentServerId && socketConnected) {
      speakers.forEach(speaker => {
        const realUserId = extractUserIdFromIdentity(speaker.identity);
        if (realUserId) {
          // Send speaking state via WebSocket
          // This will be handled by the server and broadcast to all clients
        }
      });
    }
  }, [currentServerId, socketConnected]);

  const handleDisconnected = useCallback(() => {
    console.log('🔌 Disconnected from voice channel');
    
    // Leave voice via WebSocket
    if (currentServerId) {
      socketActions.leaveVoice(currentServerId);
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionError(null);
    roomRef.current = null;
    setRoom(null);
    isJoiningRef.current = false;
  }, [currentServerId, socketActions]);

  // Connect to voice channel
  const connectToVoiceChannel = useCallback(async (serverId: string) => {
    if (isJoiningRef.current || isConnected) {
      console.log('⏳ Already joining or connected');
      return;
    }

    try {
      isJoiningRef.current = true;
      setIsConnecting(true);
      setConnectionError(null);

      console.log('🎯 Getting voice token for server:', serverId);
      
      // Get voice token
      const tokenResponse = await livekitAPI.getVoiceToken(serverId);
      if (!tokenResponse.success || !tokenResponse.data) {
        throw new Error(tokenResponse.error || 'Failed to get voice token');
      }

      const { token, wsUrl } = tokenResponse.data;
      
      console.log('🏗️ Creating room with wsUrl:', wsUrl);
      
      // Create new room
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      
      roomRef.current = newRoom;
      setRoom(newRoom);

      // Set up event listeners
      newRoom
        .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
        .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
        .on(RoomEvent.ParticipantConnected, handleParticipantConnected)
        .on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
        .on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakerChange)
        .on(RoomEvent.Disconnected, handleDisconnected)
        .on(RoomEvent.Connected, async () => {
          console.log('✅ Connected to voice channel');
          setIsConnected(true);
          setIsConnecting(false);
          isJoiningRef.current = false;
          
          // Set initial microphone state (muted by default)
          try {
            await newRoom.localParticipant.setMicrophoneEnabled(!isMuted);
            console.log('🎤 Initial microphone state set:', !isMuted);
          } catch (error) {
            console.warn('⚠️ Failed to set initial microphone state:', error);
          }
          
          // Join voice via WebSocket (this will notify all other users)
          if (socketConnected) {
            socketActions.joinVoice(serverId);
          }
        });

      // Handle audio playback
      newRoom.on(RoomEvent.AudioPlaybackStatusChanged, () => {
        if (!newRoom.canPlaybackAudio) {
          console.log('🔇 Audio playback blocked by browser policy');
        }
      });

      // Connect to room
      console.log('🔗 Connecting to room...');
      await newRoom.connect(wsUrl, token, {
        autoSubscribe: true,
      });

      // Try to start audio (may be blocked)
      try {
        await newRoom.startAudio();
        console.log('🎵 Audio started successfully');
      } catch (error) {
        console.log('🔇 Audio blocked by browser policy');
      }

    } catch (error: any) {
      console.error('❌ Failed to connect to voice channel:', error);
      setConnectionError(error.message || 'Failed to connect to voice channel');
      setIsConnecting(false);
      isJoiningRef.current = false;
      
      // Cleanup on error
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
        setRoom(null);
      }
    }
  }, [isConnected, handleTrackSubscribed, handleTrackUnsubscribed, handleParticipantConnected, handleParticipantDisconnected, handleActiveSpeakerChange, handleDisconnected, isMuted, socketConnected, socketActions]);

  // Disconnect from voice channel
  const disconnectFromVoiceChannel = useCallback(async () => {
    if (roomRef.current) {
      console.log('🔌 Disconnecting from voice channel...');
      
      try {
        // Notify backend
        if (currentServerId) {
          await livekitAPI.leaveVoice(currentServerId);
        }
      } catch (error) {
        console.warn('⚠️ Failed to notify backend about leaving:', error);
      }

      roomRef.current.disconnect();
    }
  }, [currentServerId]);

  // Select server - automatically connects to voice and joins via WebSocket
  const selectServer = useCallback(async (serverId: string) => {
    console.log('🎯 Selecting server:', serverId);
    
    // If already connected to a different server, disconnect first
    if (currentServerId && currentServerId !== serverId && isConnected) {
      await disconnectFromVoiceChannel();
    }
    
    // Join server via WebSocket
    socketActions.joinServer(serverId);
    setIsInLobby(false);
    
    // Auto-connect to voice channel
    await connectToVoiceChannel(serverId);
  }, [currentServerId, isConnected, disconnectFromVoiceChannel, connectToVoiceChannel, socketActions]);

  // Leave server - go back to lobby
  const leaveServer = useCallback(async () => {
    console.log('🏠 Leaving server, returning to lobby');
    
    await disconnectFromVoiceChannel();
    
    if (currentServerId) {
      socketActions.leaveServer(currentServerId);
    }
    
    setIsInLobby(true);
  }, [disconnectFromVoiceChannel, currentServerId, socketActions]);

  // Toggle mute - now uses WebSocket actions
  const toggleMute = useCallback(async () => {
    console.log('🎤 Toggling mute via WebSocket');
    
    // Start audio on first interaction
    if (roomRef.current && !roomRef.current.canPlaybackAudio) {
      try {
        await roomRef.current.startAudio();
        console.log('🎵 Audio started by user interaction');
      } catch (error) {
        console.warn('⚠️ Failed to start audio:', error);
      }
    }
    
    // Update microphone state if connected
    if (roomRef.current?.localParticipant) {
      const newMutedState = !isMuted;
      
      try {
        await roomRef.current.localParticipant.setMicrophoneEnabled(!newMutedState);
        
        // Toggle via WebSocket (this will update state and notify others)
        socketActions.toggleMute();
        
        console.log('🎤 Microphone toggled via WebSocket:', newMutedState);
      } catch (error) {
        console.warn('⚠️ Failed to toggle microphone:', error);
      }
    } else {
      // Just toggle via WebSocket even if not connected to LiveKit yet
      socketActions.toggleMute();
    }
  }, [isMuted, socketActions]);

  // Toggle deafen - now uses WebSocket actions
  const toggleDeafen = useCallback(async () => {
    console.log('🔇 Toggling deafen via WebSocket');
    
    // Start audio on first interaction
    if (roomRef.current && !roomRef.current.canPlaybackAudio) {
      try {
        await roomRef.current.startAudio();
        console.log('🎵 Audio started by user interaction');
      } catch (error) {
        console.warn('⚠️ Failed to start audio:', error);
      }
    }
    
    const newDeafenedState = !isDeafened;
    
    // Update audio elements
    if (roomRef.current) {
      roomRef.current.remoteParticipants.forEach((participant) => {
        participant.audioTrackPublications.forEach((publication) => {
          if (publication.track) {
            const attachedElements = publication.track.attachedElements;
            attachedElements.forEach((element: HTMLAudioElement) => {
              element.volume = newDeafenedState ? 0 : 1;
              element.muted = newDeafenedState;
            });
          }
        });
      });
    }
    
    // Toggle via WebSocket (this will update state and notify others)
    socketActions.toggleDeafen();
    
    console.log('🔇 Deafen toggled via WebSocket:', newDeafenedState);
  }, [isDeafened, socketActions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, []);

  return {
    isInLobby,
    isConnected,
    isConnecting,
    connectionError,
    currentServerId,
    isMuted,
    isDeafened,
    toggleMute,
    toggleDeafen,
    participants,
    selectServer,
    leaveServer,
    room,
  };
}; 