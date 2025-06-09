import { Prisma } from '@prisma/client';
import { MemberWithUser } from '../services/SocketService';

// A simplified user object for socket events
export interface SocketUser {
  id: string;
  username: string;
  avatar?: string | null;
}

const messageWithAuthor = Prisma.validator<Prisma.MessageDefaultArgs>()({
  include: { author: { select: { id: true, username: true, avatar: true } } },
});

export type MessageWithAuthor = Prisma.MessageGetPayload<typeof messageWithAuthor>;

// Server to Client Events
export interface ServerToClientEvents {
  'user:joined': (member: MemberWithUser, serverId: string) => void;
  'user:left': (userId: string, serverId: string) => void;
  'server:state': (data: { serverId: string, users: SocketUser[] }) => void;
  'message:new': (message: MessageWithAuthor) => void;
  'message:updated': (message: MessageWithAuthor) => void;
  'message:deleted': (messageId: string, serverId: string) => void;
}

// Client to Server Events
export interface ClientToServerEvents {
  'server:join': (serverId: string) => void;
  'server:leave': (serverId: string) => void;
}

// Socket data attached to each connection
export interface SocketData {
  user: {
    id: string;
    username: string;
    avatar?: string | null;
  };
} 