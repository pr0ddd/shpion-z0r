import { Message } from '@prisma/client';

// A simplified user object for socket events on the client
export interface SocketUser {
    id: string;
    username: string;
    avatar?: string | null;
}
  
// Server to Client Events
export interface ServerToClientEvents {
    'server:state': (data: { serverId: string, users: SocketUser[] }) => void;
    'user:joined': (member: any, serverId: string) => void; // Using 'any' for member for now
    'user:left': (userId: string, serverId: string) => void;
    'user:listening': (userId: string, listening: boolean) => void;
    'message:new': (message: Message & { author: { id: string, username: string, avatar: string | null }}) => void;
    'message:updated': (message: Message) => void;
    'message:deleted': (messageId: string, serverId: string) => void;
    'server:deleted': (serverId: string) => void;
    'server:updated': (server: any) => void;
    'server:created': (server: any) => void;
    'preview:update': (sid: string, dataUrl: string) => void;
    'bot:thinking': (payload: any) => void;
}
  
// Client to Server Events
export interface ClientToServerEvents {
    'server:join': (serverId: string) => void;
    'server:leave': (serverId:string) => void;
    'message:send': (data: { serverId: string; content: string; }, callback: (ack: { success: boolean }) => void) => void;
    'bot:thinking': (payload: any) => void;
    'user:listening': (listening: boolean) => void;
    'preview:update': (sid: string, dataUrl: string) => void;
}

// Socket data attached to each connection
export interface SocketData {
  user: {
    id: string;
    username: string;
    avatar?: string | null;
  };
} 