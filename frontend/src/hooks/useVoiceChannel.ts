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
import io from 'socket.io-client';
import { useAuth } from './useAuth';

export interface VoiceParticipant {
  id: string;
  username: string;
  isMuted: boolean;
  isSpeaking: boolean;
  isDeafened: boolean;
  isLocal: boolean;
  audioLevel: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'unknown';
}

export interface UseVoiceChannelResult {
  // User state
  isInLobby: boolean;
  
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  currentServerId: string | null;
  
  // Audio controls - всегда доступны
  isMuted: boolean;
  isDeafened: boolean;
  toggleMute: () => void;
  toggleDeafen: () => void;
  
  // Participants
  participants: VoiceParticipant[];
  
  // Actions
  selectServer: (serverId: string) => void;
  leaveServer: () => void;
  
  // Room instance
  room: Room | null;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const useVoiceChannel = (): UseVoiceChannelResult => {
  // Get authenticated user
  const { user } = useAuth();
  
  // User state
  const [isInLobby, setIsInLobby] = useState(true);
  const [currentServerId, setCurrentServerId] = useState<string | null>(null);
  
  // Connection state
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Audio controls - по умолчанию всё выключено
  const [isMuted, setIsMuted] = useState(true);
  const [isDeafened, setIsDeafened] = useState(true);
  
  // Participants
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  
  // Simple remote participant states (userId -> {isMuted, isDeafened})
  const [remoteStates, setRemoteStates] = useState<Record<string, { isMuted?: boolean; isDeafened?: boolean }>>({});
  
  // Refs
  const roomRef = useRef<Room | null>(null);
  const socketRef = useRef<any>(null);
  const isJoiningRef = useRef(false);
  const isSocketInitialized = useRef(false);

  // Debug state changes
  console.log('📊 useVoiceChannel State:', {
    isInLobby,
    currentServerId,
    isConnected,
    isConnecting,
    connectionError,
    participantsCount: participants.length,
    roomExists: !!room,
    isJoiningRef: isJoiningRef.current
  });

  // Helper function to extract real user ID from LiveKit identity (format: "userId:username")
  const extractUserIdFromIdentity = (identity: string): string | null => {
    if (identity.includes(':')) {
      return identity.split(':')[0];
    }
    return null;
  };

  // Update participants list
  const updateParticipants = useCallback(() => {
    console.log('🔄 Updating participants list...');
    
    if (!roomRef.current) {
      console.log('❌ No room found, clearing participants');
      setParticipants([]);
      return;
    }

    const participantsList: VoiceParticipant[] = [];
    
    // Add local participant
    const localParticipant = roomRef.current.localParticipant;
    if (localParticipant && user) {
      const identity = localParticipant.identity || '';
      const username = identity.includes(':') ? identity.split(':')[1] : identity;
      const realUserId = user.id; // Use auth user ID for local participant
      
      console.log('➕ Adding local participant:', username, 'realUserId:', realUserId);
      
      participantsList.push({
        id: localParticipant.sid,
        username: username,
        isMuted: isMuted,
        isSpeaking: localParticipant.isSpeaking,
        isDeafened: isDeafened,
        isLocal: true,
        audioLevel: localParticipant.audioLevel || 0,
        connectionQuality: 'excellent',
      });
    }

    // Add remote participants
    console.log('🔍 Remote participants count:', roomRef.current.remoteParticipants.size);
    
    roomRef.current.remoteParticipants.forEach((participant) => {
      const audioTrack = participant.getTrackPublication(Track.Source.Microphone);
      const identity = participant.identity || '';
      const username = identity.includes(':') ? identity.split(':')[1] : identity;
      const realUserId = extractUserIdFromIdentity(identity);
      
      console.log('➕ Adding remote participant:', username, 'realUserId:', realUserId);
      
      // Get stored remote state
      const remoteState = realUserId ? remoteStates[realUserId] : null;
      
      participantsList.push({
        id: participant.sid,
        username: username,
        isMuted: remoteState?.isMuted ?? !audioTrack?.isEnabled,
        isSpeaking: participant.isSpeaking,
        isDeafened: remoteState?.isDeafened ?? false,
        isLocal: false,
        audioLevel: participant.audioLevel || 0,
        connectionQuality: 'good',
      });
    });

    console.log('✅ Total participants:', participantsList.length);
    setParticipants(participantsList);
  }, [isDeafened, isMuted, remoteStates, user]);

  // Initialize WebSocket connection only once
  useEffect(() => {
    if (isSocketInitialized.current) return;
    
    console.log('🔌 Initializing WebSocket connection...');
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('❌ No auth token, skipping WebSocket connection');
      return;
    }

    const socket = io(API_BASE_URL, {
      auth: {
        token: token
      },
      autoConnect: true
    });

    socketRef.current = socket;
    isSocketInitialized.current = true;

    // WebSocket event handlers
    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
      console.log('🔗 Socket connection details:', {
        id: socket.id,
        connected: socket.connected
      });
    });

    socket.on('disconnect', (reason: string) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error: Error) => {
      console.error('🚫 WebSocket connection error:', error);
    });

    // Voice chat events
    socket.on('voice:user_joined', (userId: string, serverId: string) => {
      console.log(`👋 User ${userId} joined voice in server ${serverId}`);
      // Trigger participants update after a short delay to allow LiveKit to process
      setTimeout(() => updateParticipants(), 100);
    });

    socket.on('voice:user_left', (userId: string, serverId: string) => {
      console.log(`👋 User ${userId} left voice in server ${serverId}`);
      setTimeout(() => updateParticipants(), 100);
    });

    socket.on('voice:user_muted', (data: { userId: string, username: string, isMuted: boolean, serverId: string }) => {
      console.log(`🔇 User ${data.username} muted: ${data.isMuted} in server ${data.serverId}`);
      
      if (data.serverId === currentServerId) {
        // Update local state if it's about current user
        if (user && data.userId === user.id) {
          console.log('✅ Updating my mute state from socket');
          setIsMuted(data.isMuted);
        } else {
          // Store remote participant state
          setRemoteStates(prev => ({
            ...prev,
            [data.userId]: { ...prev[data.userId], isMuted: data.isMuted }
          }));
        }
        // Always update participants list
        setTimeout(() => updateParticipants(), 50);
      }
    });

    socket.on('voice:user_deafened', (data: { userId: string, username: string, isDeafened: boolean, serverId: string }) => {
      console.log(`🔇 User ${data.username} deafened: ${data.isDeafened} in server ${data.serverId}`);
      
      if (data.serverId === currentServerId) {
        // Update local state if it's about current user
        if (user && data.userId === user.id) {
          console.log('✅ Updating my deafen state from socket');
          setIsDeafened(data.isDeafened);
        } else {
          // Store remote participant state
          setRemoteStates(prev => ({
            ...prev,
            [data.userId]: { ...prev[data.userId], isDeafened: data.isDeafened }
          }));
        }
        // Always update participants list
        setTimeout(() => updateParticipants(), 50);
      }
    });

    socket.on('voice:user_speaking', (userId: string, isSpeaking: boolean) => {
      console.log(`🎤 User ${userId} speaking: ${isSpeaking}`);
      setTimeout(() => updateParticipants(), 50);
    });

    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      socket.disconnect();
      isSocketInitialized.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once

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
    
    setTimeout(() => updateParticipants(), 100);
  }, [isDeafened, updateParticipants]);

  const handleTrackUnsubscribed = useCallback((
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant,
  ) => {
    console.log('📡 Track unsubscribed:', track.kind, 'from', participant.identity);
    track.detach();
    setTimeout(() => updateParticipants(), 100);
  }, [updateParticipants]);

  const handleParticipantConnected = useCallback((participant: RemoteParticipant) => {
    console.log('👤 Participant connected:', participant.identity);
    setTimeout(() => updateParticipants(), 100);
    
    // Notify other users via WebSocket
    if (socketRef.current && currentServerId) {
      socketRef.current.emit('voice:user_joined', participant.identity, currentServerId);
    }
  }, [updateParticipants, currentServerId]);

  const handleParticipantDisconnected = useCallback((participant: RemoteParticipant) => {
    console.log('👤 Participant disconnected:', participant.identity);
    setTimeout(() => updateParticipants(), 100);
    
    // Notify other users via WebSocket
    if (socketRef.current && currentServerId) {
      socketRef.current.emit('voice:user_left', participant.identity, currentServerId);
    }
  }, [updateParticipants, currentServerId]);

  const handleActiveSpeakerChange = useCallback((speakers: Participant[]) => {
    console.log('🗣️ Active speakers changed:', speakers.length);
    setTimeout(() => updateParticipants(), 50);
  }, [updateParticipants]);

  const handleDisconnected = useCallback(() => {
    console.log('🔌 Disconnected from voice channel');
    
    // Notify via WebSocket
    if (socketRef.current && currentServerId) {
      socketRef.current.emit('voice:leave', currentServerId);
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionError(null);
    setParticipants([]);
    setRemoteStates({});
    roomRef.current = null;
    setRoom(null);
    isJoiningRef.current = false;
  }, [currentServerId]);

  // Connect to voice channel
  const connectToVoiceChannel = useCallback(async (serverId: string) => {
    if (isJoiningRef.current || isConnected) {
      console.log('⏳ Already joining or connected');
      return;
    }

    try {
      isJoiningRef.current = true;
      console.log('🔄 Setting isConnecting to: true');
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
          console.log('🔄 Setting isConnected to: true');
          setIsConnected(true);
          console.log('🔄 Setting isConnecting to: false');
          setIsConnecting(false);
          isJoiningRef.current = false;
          
          // Set initial microphone state (muted by default)
          try {
            await newRoom.localParticipant.setMicrophoneEnabled(!isMuted);
            console.log('🎤 Initial microphone state set:', !isMuted);
          } catch (error) {
            console.warn('⚠️ Failed to set initial microphone state:', error);
          }
          
          // Notify via WebSocket
          if (socketRef.current) {
            console.log('🔗 Joining server room and notifying participants');
            socketRef.current.emit('server:join', serverId);
            socketRef.current.emit('voice:join', serverId);
          }
          
          // Update participants after connection
          setTimeout(() => updateParticipants(), 200);
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
  }, [isConnected, handleTrackSubscribed, handleTrackUnsubscribed, handleParticipantConnected, handleParticipantDisconnected, handleActiveSpeakerChange, handleDisconnected, updateParticipants, isMuted]);

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

  // Select server - automatically connects to voice
  const selectServer = useCallback(async (serverId: string) => {
    console.log('🎯 Selecting server:', serverId);
    console.log('📊 State before selectServer:', {
      currentServerId,
      isInLobby,
      isConnected,
      isConnecting
    });
    
    // If already connected to a different server, disconnect first
    if (currentServerId && currentServerId !== serverId && isConnected) {
      await disconnectFromVoiceChannel();
    }
    
    console.log('🔄 Setting currentServerId to:', serverId);
    setCurrentServerId(serverId);
    console.log('🔄 Setting isInLobby to: false');
    setIsInLobby(false);
    
    // Auto-connect to voice channel
    await connectToVoiceChannel(serverId);
    
    console.log('📊 State after selectServer (may not be immediate):', {
      currentServerId,
      isInLobby,
      isConnected,
      isConnecting
    });
  }, [currentServerId, isConnected, isConnecting, isInLobby, disconnectFromVoiceChannel, connectToVoiceChannel]);

  // Leave server - go back to lobby
  const leaveServer = useCallback(async () => {
    console.log('🏠 Leaving server, returning to lobby');
    
    await disconnectFromVoiceChannel();
    
    setCurrentServerId(null);
    setIsInLobby(true);
    setParticipants([]);
    setRemoteStates({});
  }, [disconnectFromVoiceChannel]);

  // Toggle mute
  const toggleMute = useCallback(async () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    console.log('🎤 Toggling mute:', newMutedState);
    
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
      try {
        await roomRef.current.localParticipant.setMicrophoneEnabled(!newMutedState);
        setTimeout(() => updateParticipants(), 50);
        
        // Notify other participants via WebSocket
        if (socketRef.current && currentServerId && user) {
          const identity = roomRef.current.localParticipant.identity || '';
          const username = identity.includes(':') ? identity.split(':')[1] : identity;
          
          const eventData = {
            serverId: currentServerId,
            userId: user.id, // Use real user ID from auth
            username: username,
            isMuted: newMutedState
          };
          
          console.log('🚀 Sending voice:user_muted event:', eventData);
          socketRef.current.emit('voice:user_muted', eventData);
          
          console.log('📡 Sent mute state to other participants:', { username, isMuted: newMutedState });
        } else {
          console.log('❌ Cannot send mute event - missing socket, currentServerId, or user:', {
            hasSocket: !!socketRef.current,
            currentServerId,
            hasUser: !!user
          });
        }
      } catch (error) {
        console.warn('⚠️ Failed to toggle microphone:', error);
      }
    }
  }, [isMuted, updateParticipants, currentServerId, user]);

  // Toggle deafen
  const toggleDeafen = useCallback(async () => {
    const newDeafenedState = !isDeafened;
    setIsDeafened(newDeafenedState);
    
    console.log('🔇 Toggling deafen:', newDeafenedState);
    
    // Start audio on first interaction
    if (roomRef.current && !roomRef.current.canPlaybackAudio) {
      try {
        await roomRef.current.startAudio();
        console.log('🎵 Audio started by user interaction');
      } catch (error) {
        console.warn('⚠️ Failed to start audio:', error);
      }
    }
    
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
      
      setTimeout(() => updateParticipants(), 50);
      
      // Notify other participants via WebSocket (only for deafen state visibility)
      if (socketRef.current && currentServerId && user) {
        const identity = roomRef.current.localParticipant.identity || '';
        const username = identity.includes(':') ? identity.split(':')[1] : identity;
        
        const eventData = {
          serverId: currentServerId,
          userId: user.id, // Use real user ID from auth
          username: username,
          isDeafened: newDeafenedState
        };
        
        console.log('🚀 Sending voice:user_deafened event:', eventData);
        socketRef.current.emit('voice:user_deafened', eventData);
        
        console.log('📡 Sent deafen state to other participants:', { username, isDeafened: newDeafenedState });
      } else {
        console.log('❌ Cannot send deafen event - missing socket, currentServerId, or user:', {
          hasSocket: !!socketRef.current,
          currentServerId,
          hasUser: !!user
        });
      }
    }
  }, [isDeafened, updateParticipants, currentServerId, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
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