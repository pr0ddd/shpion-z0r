import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { SocketData } from '../types';
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
        status: true,
      },
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'ONLINE' },
    });

    socket.data.user = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      status: 'ONLINE' as const,
    };
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
}; 