import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth';
import serverRoutes from './routes/servers';
import messageRoutes from './routes/messages';
import livekitRoutes from './routes/livekit';
import invitePublicRoutes from './routes/invite.public.routes';
import inviteProtectedRoutes from './routes/invite.protected.routes';
import userRoutes from './routes/users';

// Middleware
import { authMiddleware } from './middleware/auth';
import { socketAuthMiddleware } from './middleware/socketAuth';

// Types and Services
import { ServerToClientEvents, ClientToServerEvents, SocketData } from './types/socket';
import { SocketService } from './services/SocketService';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Prisma
export const prisma = new PrismaClient();

// Initialize Socket.IO
const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(httpServer, {
  path: '/api/socket.io',
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Apply Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));


// Apply Routes
app.use('/api/auth', authRoutes);
app.use('/api/servers', authMiddleware, serverRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);
app.use('/api/livekit', authMiddleware, livekitRoutes);
app.use('/api/invite', invitePublicRoutes);
app.use('/api/invite', authMiddleware, inviteProtectedRoutes);
app.use('/api/users', authMiddleware, userRoutes);


// Socket.IO connection handling
io.use(socketAuthMiddleware);

// Initialize Socket Service
const socketService = new SocketService(io, prisma);

// Export for use in controllers
export { socketService };

httpServer.listen(process.env.PORT || 3001, () => {
    console.log(`🚀 Server ready at http://localhost:${process.env.PORT || 3001}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
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