import { User, Message, Member } from './index';

// A simplified user object for socket events on the client
export interface SocketUser {
    id: string;
    username: string;
    avatar?: string | null;
}
  
// Server to Client Events
export interface ServerToClientEvents {
    'server:state': (data: { serverId: string, users: SocketUser[] }) => void;
    'user:joined': (member: Member, serverId: string) => void; 
    'user:left': (userId: string, serverId: string) => void;
    'message:new': (message: Message) => void;
    'message:updated': (message: Message) => void;
    'message:deleted': (messageId: string, serverId: string) => void;
}
  
// Client to Server Events
export interface ClientToServerEvents {
    'server:join': (serverId: string) => void;
    'server:leave': (serverId:string) => void;
} 