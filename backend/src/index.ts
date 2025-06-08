import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Routes
import authRoutes from './routes/auth';
import serverRoutes from './routes/servers';
import messageRoutes from './routes/messages';
import livekitRoutes from './routes/livekit';
import inviteRoutes from './routes/invites';

// Middleware
import { authMiddleware } from './middleware/auth';

// Types
import { ServerToClientEvents, ClientToServerEvents } from './types';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Prisma
export const prisma = new PrismaClient();

// Initialize Socket.IO with CORS and types
const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.SOCKETIO_CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      imgSrc: [`'self'`, "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.SOCKETIO_CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'shpion-backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/servers', authMiddleware, serverRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);
app.use('/api/livekit', authMiddleware, livekitRoutes);
app.use('/api/invites', authMiddleware, inviteRoutes);

// Публичные роуты (без авторизации)
app.use('/api/public/invites', inviteRoutes);

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, displayName: true }
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.data.user = user;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
});

// Enhanced Socket.IO connection handling with voice chat support
io.on('connection', (socket) => {
  const user = socket.data.user;
  console.log(`Client connected: ${socket.id}, user: ${user?.username}`);
  
  // Voice chat events
  socket.on('voice:join', async (serverId: string) => {
    try {
      console.log(`User ${user.username} joining voice in server ${serverId}`);
      
      // Update database
      await prisma.serverMember.update({
        where: {
          userId_serverId: {
            userId: user.id,
            serverId: serverId
          }
        },
        data: {
          voiceConnectedAt: new Date(),
          isMuted: true, // Default state
          isDeafened: true, // Default state
          isSpeaking: false
        }
      });

      // Join server room
      await socket.join(`server:${serverId}`);
      
      // Notify other users in the server
      socket.to(`server:${serverId}`).emit('voice:user_joined', user.id, serverId);
      
      console.log(`User ${user.username} joined voice in server ${serverId}`);
    } catch (error) {
      console.error('Error handling voice:join:', error);
    }
  });

  socket.on('voice:leave', async (serverId: string) => {
    try {
      console.log(`User ${user.username} leaving voice in server ${serverId}`);
      
      // Update database
      await prisma.serverMember.update({
        where: {
          userId_serverId: {
            userId: user.id,
            serverId: serverId
          }
        },
        data: {
          voiceConnectedAt: null,
          isMuted: false,
          isDeafened: false,
          isSpeaking: false
        }
      });

      // Leave server room
      await socket.leave(`server:${serverId}`);
      
      // Notify other users in the server
      socket.to(`server:${serverId}`).emit('voice:user_left', user.id, serverId);
      
      console.log(`User ${user.username} left voice in server ${serverId}`);
    } catch (error) {
      console.error('Error handling voice:leave:', error);
    }
  });

  socket.on('voice:user_muted', async (data: { serverId: string, userId: string, username: string, isMuted: boolean }) => {
    try {
      console.log(`User ${data.username} ${data.isMuted ? 'muted' : 'unmuted'} in server ${data.serverId}`);
      
      // Verify user is connected to this server
      const member = await prisma.serverMember.findFirst({
        where: {
          userId: user.id,
          serverId: data.serverId,
          voiceConnectedAt: { not: null }
        }
      });

      if (member) {
        // Update database
        await prisma.serverMember.update({
          where: {
            userId_serverId: {
              userId: user.id,
              serverId: data.serverId
            }
          },
          data: { isMuted: data.isMuted }
        });

        // Notify other users in the server (exclude sender)
        socket.to(`server:${data.serverId}`).emit('voice:user_muted', {
          userId: user.id,
          username: data.username,
          isMuted: data.isMuted,
          serverId: data.serverId
        });
        
        console.log(`📡 Broadcasted mute state for ${data.username}: ${data.isMuted}`);
      }
    } catch (error) {
      console.error('Error handling voice:user_muted:', error);
    }
  });

  socket.on('voice:user_deafened', async (data: { serverId: string, userId: string, username: string, isDeafened: boolean }) => {
    try {
      console.log(`User ${data.username} ${data.isDeafened ? 'deafened' : 'undeafened'} in server ${data.serverId}`);
      
      // Verify user is connected to this server
      const member = await prisma.serverMember.findFirst({
        where: {
          userId: user.id,
          serverId: data.serverId,
          voiceConnectedAt: { not: null }
        }
      });

      if (member) {
        // Update database
        await prisma.serverMember.update({
          where: {
            userId_serverId: {
              userId: user.id,
              serverId: data.serverId
            }
          },
          data: { isDeafened: data.isDeafened }
        });

        // Notify other users in the server about deafen state (for UI display)
        socket.to(`server:${data.serverId}`).emit('voice:user_deafened', {
          userId: user.id,
          username: data.username,
          isDeafened: data.isDeafened,
          serverId: data.serverId
        });
        
        console.log(`📡 Broadcasted deafen state for ${data.username}: ${data.isDeafened}`);
      }
    } catch (error) {
      console.error('Error handling voice:user_deafened:', error);
    }
  });

  // Server join/leave events
  socket.on('server:join', async (serverId: string) => {
    try {
      await socket.join(`server:${serverId}`);
      console.log(`User ${user.username} joined server room ${serverId}`);
    } catch (error) {
      console.error('Error joining server room:', error);
    }
  });

  socket.on('server:leave', async (serverId: string) => {
    try {
      await socket.leave(`server:${serverId}`);
      console.log(`User ${user.username} left server room ${serverId}`);
    } catch (error) {
      console.error('Error leaving server room:', error);
    }
  });

  socket.on('disconnect', async () => {
    try {
      console.log(`Client disconnected: ${socket.id}, user: ${user?.username}`);
      
      // Clean up voice connections on disconnect
      if (user) {
        const connectedMember = await prisma.serverMember.findFirst({
          where: {
            userId: user.id,
            voiceConnectedAt: { not: null }
          },
          select: { serverId: true }
        });

        if (connectedMember) {
          // Update database
          await prisma.serverMember.update({
            where: {
              userId_serverId: {
                userId: user.id,
                serverId: connectedMember.serverId
              }
            },
            data: {
              voiceConnectedAt: null,
              isMuted: false,
              isDeafened: false,
              isSpeaking: false
            }
          });

          // Notify other users
          socket.to(`server:${connectedMember.serverId}`).emit('voice:user_left', user.id, connectedMember.serverId);
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 3001;

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🔄 Shutting down gracefully...');
  
  try {
    await prisma.$disconnect();
    console.log('✅ Database connection closed');
    
    httpServer.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Shpion backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 