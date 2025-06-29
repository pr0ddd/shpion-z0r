import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import prisma from './lib/prisma';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth';
import serverRoutes from './routes/servers';
import messageRoutes from './routes/messages';
import livekitRoutes from './routes/livekit';
import invitePublicRoutes from './routes/invite.public.routes';
import inviteProtectedRoutes from './routes/invite.protected.routes';
import userRoutes from './routes/users';
import sfuRoutes from './routes/sfu';
import previewRouter from './routes/preview';

// Middleware
import { authMiddleware } from './middleware/auth';
import { socketAuthMiddleware } from './middleware/socketAuth';
import { errorHandler } from './middleware/errorHandler';

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

// -------------------- ENV LOAD --------------------
// По умолчанию ищем .env (dev) либо .env.production (если NODE_ENV=production).
// Это гарантирует, что переменные (включая BOT_*) окажутся в process.env
// даже если хост-окружение их не задаёт явно (например при простом docker build).

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });
// --------------------------------------------------

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// ---- CORS ----
// allow main client URL and *.pr0d.ru sub-domains (including regional SFUs/frontends)
const allowedOrigins = [CLIENT_URL];

const dynamicCorsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // mobile apps, Postman

    // exact match of allowed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // allow any sub-domain of pr0d.ru (https only)
    try {
      const url = new URL(origin);
      if (url.hostname.endsWith('.pr0d.ru')) {
        return callback(null, true);
      }
    } catch {
      /* malformed origin – fall through */
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(cors(dynamicCorsOptions));
app.use(morgan('dev'));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.get('/', (req, res) => {
    res.send('Hello from Shpion backend!');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/servers', authMiddleware, serverRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);
app.use('/api/invite', invitePublicRoutes);
app.use('/api/invite', authMiddleware, inviteProtectedRoutes);
app.use('/api/livekit', authMiddleware, livekitRoutes);
app.use('/api/sfu', sfuRoutes);
app.use('/api/preview', previewRouter);

// Initialize Socket.IO
const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(httpServer, {
  path: '/api/socket.io',
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  },
});

// ---- Middleware (once) ----
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
app.use('/api/sfu', sfuRoutes);

// Central error handler
app.use(errorHandler);

// Socket.IO connection handling
io.use(socketAuthMiddleware);

// Initialize Socket Service
const socketService = new SocketService(io, prisma);

// Export for use in controllers
export { socketService };

const gracefulShutdown = async (signal: string) => {
    console.log(`${signal} signal received: closing HTTP server`);
    httpServer.close(async () => {
        console.log('HTTP server closed');
        await prisma.$disconnect();
        process.exit(0);
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://0.0.0.0:${PORT}`);
    console.log(`🌐 Environment: development`);
    console.log(`🔗 CORS allowed origin: ${CLIENT_URL}`);
    prisma.$connect().then(() => {
        console.log('🗄️  Database: Connected');
    }).catch((e: unknown) => {
        console.error('🗄️  Database: Connection failed', e);
        process.exit(1);
    });
}); 