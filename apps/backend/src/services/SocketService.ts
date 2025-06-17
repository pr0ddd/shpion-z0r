import { PrismaClient, Server as PrismaServer } from '@prisma/client';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { ServerToClientEvents, ClientToServerEvents, SocketData, SocketUser } from '../types/socket';

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
        const { serverId, content, clientNonce } = data;
        const userId = socket.data.user?.id;
        if (!userId) {
            return callback({ success: false });
        }

        try {
            const message = await this.prisma.message.create({
                data: {
                    content,
                    serverId,
                    authorId: userId,
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                        },
                    },
                },
            });

            const payload = { ...message, clientNonce };
            this.io.to(`server:${serverId}`).emit('message:new', payload);
            callback({ success: true });

        } catch (error) {
            console.error("Error sending message via socket:", error);
            callback({ success: false });
        }
      });

      socket.on('user:listening', (listening: boolean) => {
        const userId = socket.data.user?.id;
        if (!userId) return;
        const serverId = this.userCurrentServer.get(userId);
        if (!serverId) return;
        this.io.to(`server:${serverId}`).emit('user:listening', userId, listening);
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