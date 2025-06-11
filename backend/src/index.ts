import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';

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

// Validate essential environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET', 'CLIENT_URL', 'PORT'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    throw new Error(`Environment variable ${varName} is not set. Please check your .env file.`);
  }
}

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT;
const CLIENT_URL = process.env.CLIENT_URL;

// Initialize Prisma
export const prisma = new PrismaClient();

// Define allowed origins
const allowedOrigins = [
  CLIENT_URL,
  'http://10.10.3.1:8080',
  'http://localhost:3000',
  'https://shpion.pr0d.ru'
].filter(Boolean) as string[];

// Initialize Socket.IO
const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(httpServer, {
  path: '/api/socket.io',
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
});

// Apply Middleware

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Apply Routes
app.use('/api/auth', authRoutes);
app.use('/api/servers', authMiddleware, serverRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);
app.use('/api/livekit', authMiddleware, livekitRoutes);
app.use('/api/invites', invitePublicRoutes);
app.use('/api/invites', authMiddleware, inviteProtectedRoutes);
app.use('/api/users', authMiddleware, userRoutes);


// Socket.IO connection handling
io.use(socketAuthMiddleware);

// Initialize Socket Service
const socketService = new SocketService(io, prisma);

// Export for use in controllers
export { socketService };

httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Server ready at http://0.0.0.0:${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 CORS allowed origin: ${CLIENT_URL}`);
    console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});

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