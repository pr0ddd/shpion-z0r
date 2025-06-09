import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { SocketData } from '../types/socket'; // Убедитесь, что путь правильный
import { ExtendedError } from 'socket.io/dist/namespace';

export const socketAuthMiddleware = async (
  socket: Socket<any, any, any, SocketData>,
  next: (err?: ExtendedError) => void
) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        avatar: true,
      },
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    // Здесь больше нет status
    socket.data.user = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
    };
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};