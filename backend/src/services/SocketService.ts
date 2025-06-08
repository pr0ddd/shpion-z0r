import { Server as SocketIOServer, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { ServerToClientEvents, ClientToServerEvents, SocketData, User, VoiceState } from '../types/socket';

export class SocketService {
  private io: SocketIOServer;
  private prisma: PrismaClient;
  
  // In-memory storage for quick lookups
  private userSocketMap = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private socketUserMap = new Map<string, string>(); // socketId -> userId
  private serverUsers = new Map<string, Set<string>>(); // serverId -> Set of userIds
  private voiceStates = new Map<string, VoiceState>(); // userId -> VoiceState
  private userCurrentServer = new Map<string, string>(); // userId -> serverId (текущий сервер пользователя)

  constructor(io: SocketIOServer, prisma: PrismaClient) {
    this.io = io;
    this.prisma = prisma;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>) => {
      console.log(`🔌 Socket connected: ${socket.id}, User: ${socket.data.user?.username}`);
      
      const user = socket.data.user;
      if (!user) return;

      // Track user connections
      this.addUserSocket(user.id, socket.id);
      
      // Set up event handlers
      this.setupSocketEventHandlers(socket);
      
      // Handle disconnect
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  private setupSocketEventHandlers(socket: Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>) {
    const user = socket.data.user;

    // Server events
    socket.on('server:join', (serverId) => this.handleServerJoin(socket, serverId));
    socket.on('server:leave', (serverId) => this.handleServerLeave(socket, serverId));

    // Voice events
    socket.on('voice:join', (data) => this.handleVoiceJoin(socket, data.serverId));
    socket.on('voice:leave', (data) => this.handleVoiceLeave(socket, data.serverId));
    socket.on('voice:user_muted', (data) => this.handleToggleMute(socket, data.serverId, data.isMuted));
    socket.on('voice:user_deafened', (data) => this.handleToggleDeafen(socket, data.serverId, data.isDeafened));

    // User status
    socket.on('user:set_status', (status) => this.handleSetUserStatus(socket, status));
  }

  // === Server Management ===
  private async handleServerJoin(socket: Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>, serverId: string) {
    const user = socket.data.user;
    
    try {
      // Verify user has access to server
      const serverMember = await this.prisma.serverMember.findUnique({
        where: {
          userId_serverId: {
            userId: user.id,
            serverId: serverId
          }
        }
      });

      if (!serverMember) {
        console.log(`❌ User ${user.username} doesn't have access to server ${serverId}`);
        return;
      }

      // Join socket room
      await socket.join(`server:${serverId}`);
      
      // Track user in server
      if (!this.serverUsers.has(serverId)) {
        this.serverUsers.set(serverId, new Set());
      }
      this.serverUsers.get(serverId)!.add(user.id);
      
      // Сохраняем текущий сервер пользователя
      this.userCurrentServer.set(user.id, serverId);

      // Notify others about user joining
      socket.to(`server:${serverId}`).emit('user:joined', user, serverId);

      // Send current server state to the joining user
      await this.sendServerState(socket, serverId);

      console.log(`✅ User ${user.username} joined server ${serverId}`);
    } catch (error) {
      console.error(`❌ Error handling server join:`, error);
    }
  }

  private async handleServerLeave(socket: Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>, serverId: string) {
    const user = socket.data.user;
    
    try {
      // Leave socket room
      await socket.leave(`server:${serverId}`);
      
      // Remove user from server tracking
      this.serverUsers.get(serverId)?.delete(user.id);
      
      // Очищаем текущий сервер если это тот же сервер
      if (this.userCurrentServer.get(user.id) === serverId) {
        this.userCurrentServer.delete(user.id);
      }
      
      // If user was in voice, handle voice leave
      const voiceState = this.voiceStates.get(user.id);
      if (voiceState && voiceState.serverId === serverId) {
        await this.handleVoiceLeave(socket, serverId);
      }

      // Notify others about user leaving
      socket.to(`server:${serverId}`).emit('user:left', user.id, serverId);

      console.log(`👋 User ${user.username} left server ${serverId}`);
    } catch (error) {
      console.error(`❌ Error handling server leave:`, error);
    }
  }

  // === Voice Management ===
  // Note: The actual voice connection is handled by LiveKit
  // This just tracks the WebSocket state for UI updates
  private async handleVoiceJoin(socket: Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>, serverId: string) {
    const user = socket.data.user;
    
    try {
      // Check if user is already in voice in this server
      const existingVoiceState = this.voiceStates.get(user.id);
      if (existingVoiceState && existingVoiceState.serverId === serverId) {
        console.log(`🎤 User ${user.username} already in voice in server ${serverId}, skipping duplicate join`);
        return;
      }

      // If user is in voice in another server, leave that first
      if (existingVoiceState && existingVoiceState.serverId !== serverId) {
        await this.handleVoiceLeave(socket, existingVoiceState.serverId);
      }

      // Create voice state for WebSocket tracking
      const voiceState: VoiceState = {
        userId: user.id,
        username: user.username,
        serverId: serverId,
        isMuted: false, // Default unmuted - matches LiveKit behavior
        isDeafened: false,
        connectedAt: new Date()
      };

      // Store voice state
      this.voiceStates.set(user.id, voiceState);

      // Update database
      await this.prisma.serverMember.update({
        where: {
          userId_serverId: {
            userId: user.id,
            serverId: serverId
          }
        },
        data: {
          voiceConnectedAt: new Date(),
          isMuted: false,
          isDeafened: false
        }
      });

      // Notify all users in server about voice join
      this.io.to(`server:${serverId}`).emit('voice:user_joined', voiceState);

      console.log(`🎤 User ${user.username} indicated voice join in server ${serverId} (LiveKit will handle actual connection)`);
    } catch (error) {
      console.error(`❌ Error handling voice join:`, error);
    }
  }

  private async handleVoiceLeave(socket: Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>, serverId: string) {
    const user = socket.data.user;
    
    try {
      // Remove voice state
      this.voiceStates.delete(user.id);

      // Update database
      await this.prisma.serverMember.update({
        where: {
          userId_serverId: {
            userId: user.id,
            serverId: serverId
          }
        },
        data: {
          voiceConnectedAt: null,
          isMuted: false,
          isDeafened: false
        }
      });

      // Notify all users in server about voice leave
      this.io.to(`server:${serverId}`).emit('voice:user_left', user.id, serverId);

      console.log(`🔇 User ${user.username} left voice in server ${serverId}`);
    } catch (error) {
      console.error(`❌ Error handling voice leave:`, error);
    }
  }

  private async handleToggleMute(socket: Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>, serverId: string, isMuted: boolean) {
    const user = socket.data.user;
    
    try {
      // Update voice state
      const voiceState = this.voiceStates.get(user.id);
      if (voiceState && voiceState.serverId === serverId) {
        voiceState.isMuted = isMuted;
        
        // Update database
        await this.prisma.serverMember.update({
          where: {
            userId_serverId: {
              userId: user.id,
              serverId: serverId
            }
          },
          data: { isMuted }
        });

        // Notify all users in server
        this.io.to(`server:${serverId}`).emit('voice:user_muted', user.id, isMuted, serverId);

        console.log(`🎤 User ${user.username} ${isMuted ? 'muted' : 'unmuted'} in server ${serverId}`);
      }
    } catch (error) {
      console.error(`❌ Error handling mute toggle:`, error);
    }
  }

  private async handleToggleDeafen(socket: Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>, serverId: string, isDeafened: boolean) {
    const user = socket.data.user;
    
    try {
      // Update voice state
      const voiceState = this.voiceStates.get(user.id);
      if (voiceState && voiceState.serverId === serverId) {
        voiceState.isDeafened = isDeafened;
        
        // Update database
        await this.prisma.serverMember.update({
          where: {
            userId_serverId: {
              userId: user.id,
              serverId: serverId
            }
          },
          data: { isDeafened }
        });

        // Notify all users in server
        this.io.to(`server:${serverId}`).emit('voice:user_deafened', user.id, isDeafened, serverId);

        console.log(`🔊 User ${user.username} ${isDeafened ? 'deafened' : 'undeafened'} in server ${serverId}`);
      }
    } catch (error) {
      console.error(`❌ Error handling deafen toggle:`, error);
    }
  }

  // === User Status Management ===
  private async handleSetUserStatus(socket: Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>, status: User['status']) {
    const user = socket.data.user;
    
    try {
      // Update user status in database
      await this.prisma.user.update({
        where: { id: user.id },
        data: { status: status as any }
      });

      // Update socket data
      socket.data.user.status = status;

      // Notify all connected users about status change
      socket.broadcast.emit('user:status_changed', user.id, status);

      console.log(`👤 User ${user.username} changed status to ${status}`);
    } catch (error) {
      console.error(`❌ Error handling status change:`, error);
    }
  }

  // === Helper Methods ===
  private async sendServerState(socket: Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>, serverId: string) {
    try {
      // Get all users in server
      const serverMembers = await this.prisma.serverMember.findMany({
        where: { serverId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              status: true
            }
          }
        }
      });

      const users: User[] = serverMembers.map(member => ({
        id: member.user.id,
        username: member.user.username,
        avatar: member.user.avatar,
        status: member.user.status as User['status']
      }));

      // Get current voice states for this server
      const voiceStates = Array.from(this.voiceStates.values())
        .filter(state => state.serverId === serverId);

      // Send current state to user
      socket.emit('server:users_list', users, serverId);
      socket.emit('server:voice_states', voiceStates, serverId);
    } catch (error) {
      console.error(`❌ Error sending server state:`, error);
    }
  }

  private addUserSocket(userId: string, socketId: string) {
    if (!this.userSocketMap.has(userId)) {
      this.userSocketMap.set(userId, new Set());
    }
    this.userSocketMap.get(userId)!.add(socketId);
    this.socketUserMap.set(socketId, userId);
  }

  private removeUserSocket(userId: string, socketId: string) {
    this.userSocketMap.get(userId)?.delete(socketId);
    if (this.userSocketMap.get(userId)?.size === 0) {
      this.userSocketMap.delete(userId);
    }
    this.socketUserMap.delete(socketId);
  }

  private async handleDisconnect(socket: Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>) {
    const user = socket.data.user;
    if (!user) return;

    console.log(`🔌 Socket disconnected: ${socket.id}, User: ${user.username}`);

    // Remove from tracking
    this.removeUserSocket(user.id, socket.id);

    // Clean up voice state if user was in voice
    const voiceState = this.voiceStates.get(user.id);
    if (voiceState) {
      await this.handleVoiceLeave(socket, voiceState.serverId);
    }

          // If this was user's last connection, notify about offline status
      if (!this.userSocketMap.has(user.id)) {
        // Update user status to offline
        try {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { status: 'OFFLINE' as any }
          });

          // Notify all about user going offline
          socket.broadcast.emit('user:status_changed', user.id, 'OFFLINE');
        } catch (error) {
          console.error(`❌ Error updating user offline status:`, error);
        }
      }
  }

  // === Public Methods ===
  public getUserCurrentServer(userId: string): string | null {
    return this.userCurrentServer.get(userId) || null;
  }
} 