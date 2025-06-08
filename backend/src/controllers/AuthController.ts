import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, ApiResponse } from '../types';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class AuthController {
  // Регистрация нового пользователя
  static async register(req: Request, res: Response<ApiResponse>) {
    try {
      const { email, username, password } = req.body;

      // Валидация
      if (!email || !username || !password) {
        return res.status(400).json({
          success: false,
          error: 'All fields are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long'
        });
      }

      // Проверка уникальности
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User with this email or username already exists'
        });
      }

      // Хеширование пароля
      const hashedPassword = await bcrypt.hash(password, 10);

      // Создание пользователя
      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword
        },
        select: {
          id: true,
          email: true,
          username: true,
          avatar: true,
          status: true,
          createdAt: true
        }
      });

      // Создание JWT токена
      const token = jwt.sign(
        { userId: user.id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        data: { user, token },
        message: 'User registered successfully'
      });
    } catch (error) {
      console.error('Error registering user:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Вход в систему
  static async login(req: Request, res: Response<ApiResponse>) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      // Поиск пользователя
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Проверка пароля
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Обновление статуса на онлайн
      await prisma.user.update({
        where: { id: user.id },
        data: {
          status: 'ONLINE',
          lastSeen: new Date()
        }
      });

      // Создание JWT токена
      const token = jwt.sign(
        { userId: user.id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const { password: _, ...userWithoutPassword } = user;

      return res.json({
        success: true,
        data: { user: userWithoutPassword, token },
        message: 'Login successful'
      });
    } catch (error) {
      console.error('Error logging in:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Получить информацию о текущем пользователе
  static async me(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          avatar: true,
          status: true,
          lastSeen: true,
          createdAt: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      return res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error fetching user info:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Выход из системы
  static async logout(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Обновление статуса на оффлайн
      await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'OFFLINE',
          lastSeen: new Date()
        }
      });

      return res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Error logging out:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
} 