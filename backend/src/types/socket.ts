// Socket.IO Event Types for Shpion
export interface User {
  id: string;
  username: string;
  avatar?: string | null;
  status: 'ONLINE' | 'AWAY' | 'DO_NOT_DISTURB' | 'INVISIBLE' | 'OFFLINE';
}

export interface VoiceState {
  userId: string;
  username: string;
  serverId: string;
  isMuted: boolean;
  isDeafened: boolean;
  connectedAt: Date;
}

// Server to Client Events
export interface ServerToClientEvents {
  // User presence
  'user:joined': (user: User, serverId: string) => void;
  'user:left': (userId: string, serverId: string) => void;
  'user:status_changed': (userId: string, status: User['status']) => void;
  
  // Voice events
  'voice:user_joined': (voiceState: VoiceState) => void;
  'voice:user_left': (userId: string, serverId: string) => void;
  'voice:user_muted': (userId: string, isMuted: boolean, serverId: string) => void;
  'voice:user_deafened': (userId: string, isDeafened: boolean, serverId: string) => void;
  
  // Server events
  'server:users_list': (users: User[], serverId: string) => void;
  'server:voice_states': (voiceStates: VoiceState[], serverId: string) => void;
}

// Client to Server Events
export interface ClientToServerEvents {
  // Server join/leave
  'server:join': (serverId: string) => void;
  'server:leave': (serverId: string) => void;
  
  // Voice controls
  'voice:join': (data: { serverId: string; userId: string; username: string }) => void;
  'voice:leave': (data: { serverId: string; userId: string }) => void;
  'voice:user_muted': (data: { serverId: string; userId: string; username: string; isMuted: boolean; timestamp: number }) => void;
  'voice:user_deafened': (data: { serverId: string; userId: string; username: string; isDeafened: boolean; timestamp: number }) => void;
  
  // User presence
  'user:set_status': (status: User['status']) => void;
}

// Socket data attached to each connection
export interface SocketData {
  user: User;
} 