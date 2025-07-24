import { PrismaClient, Server as PrismaServer } from '@prisma/client';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { ServerToClientEvents, ClientToServerEvents, SocketData, SocketUser } from '../types/socket';
import MessageService from './MessageService';

export class SocketService {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;
  private prisma: PrismaClient;
  private userCurrentServer: Map<string, string> = new Map(); // Map<userId, serverId>

  constructor(io: SocketIOServer, prisma: PrismaClient) {
    this.io = io;
    this.prisma = prisma;
    this.initializeSocketEvents();
  }

  private initializeSocketEvents() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 New connection: ${socket.id}, user: ${socket.data.user?.username}`);

      socket.on('server:join', async (serverId) => {
        const userId = socket.data.user?.id;
        if (!userId) return;

        // Leave previous server room if any
        const previousServerId = this.userCurrentServer.get(userId);
        if (previousServerId) {
          socket.leave(`server:${previousServerId}`);
          this.notifyUserLeft(userId, previousServerId);
        }

        // Join new server room
        socket.join(`server:${serverId}`);
        this.userCurrentServer.set(userId, serverId);
        
        await this.notifyUserJoined(userId, serverId);
        await this.sendFullServerState(socket, serverId);
      });

      socket.on('server:leave', (serverId) => {
        const userId = socket.data.user?.id;
        if (!userId) return;

        socket.leave(`server:${serverId}`);
        this.userCurrentServer.delete(userId);
        this.notifyUserLeft(userId, serverId);
      });

      socket.on('message:send', async (data: any, callback) => {
        const { serverId, content, attachment, type, clientNonce, replyToId } = data;
        const userId = socket.data.user?.id;
        if (!userId) {
            return callback({ success: false });
        }

        try {
            // Reuse shared service logic
            const message = await MessageService.createMessage({
                userId,
                serverId,
                content,
                attachment,
                type,
                replyToId,
            });

            const payload = { ...message, clientNonce };
            // Broadcast to room incl. sender
            this.io.to(`server:${serverId}`).emit('message:new', payload);
            callback({ success: true });

        } catch (error) {
            console.error('Error sending message via socket:', error);
            callback({ success: false });
        }
      });

      socket.on('user:listening', (payload: any) => {
        const userId = socket.data.user?.id;
        if (!userId) return;

        let serverId: string | undefined;
        let listening: boolean;

        if (typeof payload === 'object' && payload !== null) {
          serverId = payload.serverId;
          listening = !!payload.listening;
        } else {
          listening = !!payload;
        }

        if (!serverId) {
          serverId = this.userCurrentServer.get(userId);
          if (!serverId) {
            for (const room of socket.rooms) {
              if (room.startsWith('server:')) {
                serverId = room.slice('server:'.length);
                this.userCurrentServer.set(userId, serverId);
                break;
              }
            }
          }
        }

        if (!serverId) return;
        this.io.to(`server:${serverId}`).emit('user:listening', userId, listening);
      });

      socket.on('bot:thinking', (payload: any) => {
        const { serverId } = payload || {};
        if (!serverId) return;
        // Re-broadcast to everyone including sender (to keep behaviour consistent)
        this.io.to(`server:${serverId}`).emit('bot:thinking', payload);
      });

      socket.on('preview:update', (payload: any) => {
        const userId = socket.data.user?.id;
        if (!userId) return;

        let serverId: string | undefined = payload?.serverId;
        const sid = payload?.sid ?? payload?.[0];
        const dataUrl = payload?.dataUrl ?? payload?.[1];

        if (!serverId) {
          serverId = this.userCurrentServer.get(userId);
          if (!serverId) {
            for (const room of socket.rooms) {
              if (room.startsWith('server:')) {
                serverId = room.slice('server:'.length);
                this.userCurrentServer.set(userId, serverId);
                break;
              }
            }
          }
        }

        if (!serverId) return;
        socket.to(`server:${serverId}`).emit('preview:update', sid, dataUrl);
      });

      socket.on('typing', (payload: any) => {
        const userId = socket.data.user?.id;
        const { serverId, typing } = payload || {};
        if (!userId || !serverId) return;
        // broadcast to others (exclude sender) in room
        const username = socket.data.user?.username;
        socket.to(`server:${serverId}`).emit('typing', { userId, serverId, typing: !!typing, username });
      });

      socket.on('disconnect', () => {
        const userId = socket.data.user?.id;
        if (userId) {
          const serverId = this.userCurrentServer.get(userId);
          if (serverId) {
            this.notifyUserLeft(userId, serverId);
            this.userCurrentServer.delete(userId);
          }
        }
        console.log(`🔌 Connection closed: ${socket.id}`);
      });
    });
  }

  private async notifyUserJoined(userId: string, serverId: string) {
    const member = await this.prisma.member.findFirst({
      where: { userId, serverId },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });

    if (member) {
      // The type of `member` here is almost MemberWithUser, but with a simplified `user`
      // This is fine as long as the frontend expects this structure.
      // Let's create a simplified user object for the 'user:joined' event for now
      // to avoid sending the full user object with email etc.
      const socketUser: SocketUser = {
        id: member.user.id,
        username: member.user.username,
        avatar: member.user.avatar,
      }
      // Re-evaluating: The plan was to send the full member object. Let's do that.
      const fullMember = await this.prisma.member.findFirst({
        where: {userId, serverId},
        include: { user: true }
      });
      if(fullMember){
        this.io.to(`server:${serverId}`).emit('user:joined', fullMember, serverId);
      }
    }
  }

  // ---- User profile updated ----
  public async broadcastUserUpdated(userId: string) {
    const memberships = await this.prisma.member.findMany({
      where: { userId },
      include: { user: true },
    });

    for (const member of memberships) {
      this.io.to(`server:${member.serverId}`).emit('user:updated', member, member.serverId);
    }
  }

  private notifyUserLeft(userId: string, serverId: string) {
    this.io.to(`server:${serverId}`).emit('user:left', userId, serverId);
  }

  private async sendFullServerState(socket: Socket, serverId: string) {
    const members = await this.prisma.member.findMany({
      where: { serverId },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });
    
    const users: SocketUser[] = members.map(m => ({
      id: m.user.id,
      username: m.user.username,
      avatar: m.user.avatar
    }));

    socket.emit('server:state', { serverId, users });
  }

  // --- Public methods for controllers ---

  public getUserCurrentServer(userId: string): string | undefined {
    return this.userCurrentServer.get(userId);
  }

  public notifyNewMessage(serverId: string, message: any) { // Type any for now
    this.io.to(`server:${serverId}`).emit('message:new', message);
  }

  public notifyUpdatedMessage(serverId: string, message: any) { // Type any for now
    this.io.to(`server:${serverId}`).emit('message:updated', message);
  }

  public notifyDeletedMessage(serverId: string, messageId: string) {
    this.io.to(`server:${serverId}`).emit('message:deleted', messageId, serverId);
  }

  public notifyServerDeleted(serverId: string) {
    // broadcast to everyone so список серверов обновился у всех клиентов
    this.io.emit('server:deleted', serverId);
    // Additionally, make sockets that are currently in the room leave it
    const room = this.io.sockets.adapter.rooms.get(`server:${serverId}`);
    if (room) {
      for (const sid of room) {
        const s = this.io.sockets.sockets.get(sid);
        s?.leave(`server:${serverId}`);
      }
    }
  }

  public notifyServerUpdated(server: PrismaServer) {
    this.io.emit('server:updated', server);
  }

  public notifyServerCreated(server: PrismaServer & { members?: { userId: string }[] }) {
    // Notify only those users who are already members (typically только владелец сразу после создания)
    const memberIds = (server.members?.map((m) => m.userId) ?? [server.ownerId]).filter(Boolean);
    for (const socket of this.io.sockets.sockets.values()) {
      if (socket.data.user && memberIds.includes(socket.data.user.id)) {
        socket.emit('server:created', server);
      }
    }
  }
}