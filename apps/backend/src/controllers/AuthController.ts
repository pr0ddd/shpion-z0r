import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, ApiResponse } from '../types';
import prisma from '../lib/prisma';
import { ApiError } from '../utils/ApiError';

export class AuthController {
  private static _createToken(userId: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new ApiError(500, 'Server configuration error: JWT_SECRET is not defined.');
    }
    return jwt.sign({ userId }, secret, { expiresIn: '7d' });
  }

  // Регистрация нового пользователя
  static async register(req: Request, res: Response<ApiResponse>) {
    const { email, username, password } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    if (existingUser) {
      throw new ApiError(400, 'User with this email or username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { email, username, password: hashedPassword },
      select: { id: true, email: true, username: true, avatar: true, createdAt: true }
    });

    const token = AuthController._createToken(newUser.id);

    res.status(201).json({
      success: true,
      data: { user: newUser, token },
      message: 'User registered successfully'
    });
  }

  // Вход в систему
  static async login(req: Request, res: Response<ApiResponse>) {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    const isValidCredentials = user && await bcrypt.compare(password, user.password);

    if (!isValidCredentials) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const token = AuthController._createToken(user.id);
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: { user: userWithoutPassword, token },
      message: 'Login successful'
    });
  }

  // Получить информацию о текущем пользователе
  static async me(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'User not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, avatar: true, createdAt: true }
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({ success: true, data: user });
  }

  // Выход из системы
  static async logout(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    // В текущей схеме нет статуса онлайн/оффлайн,
    // поэтому этот эндпоинт просто возвращает успешный ответ.
    // На клиенте токен должен быть удален.
    res.json({ success: true, message: 'Logout successful' });
  }
} 