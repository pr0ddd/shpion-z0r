// User types
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

// Server types  
export interface Server {
  id: string;
  name: string;
  description?: string;
  members: User[];
  voiceParticipants: VoiceParticipant[];
}

// Voice participant type
export interface VoiceParticipant {
  userId: string;
  username: string;
  isMuted: boolean;
  isDeafened: boolean;
  avatar?: string;
}

// API Response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
} 