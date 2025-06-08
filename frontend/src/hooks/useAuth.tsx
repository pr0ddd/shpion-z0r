import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { authAPI } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Простая инициализация при загрузке приложения
  useEffect(() => {
    console.log('🔄 useAuth: Initializing from localStorage...');
    
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('✅ useAuth: Restored user from localStorage:', parsedUser.username);
        setToken(savedToken);
        setUser(parsedUser);
      } catch (error) {
        console.warn('❌ useAuth: Failed to parse saved user, clearing...');
        clearAuth();
      }
    } else {
      console.log('🔄 useAuth: No saved credentials found');
    }
    
    setIsLoading(false);
  }, []);

  const clearAuth = () => {
    console.log('🗑️ useAuth: Clearing auth...');
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('🔐 useAuth: Logging in...');
      const response = await authAPI.login(email, password);
      
      if (response.success && response.data) {
        const { user: userData, token: userToken } = response.data;
        
        console.log('✅ useAuth: Login successful, saving to localStorage...');
        
        // Сохраняем данные
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('authToken', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        console.log('✅ useAuth: Login complete');
      } else {
        throw new Error(response.error || 'Неверные учетные данные');
      }
    } catch (error: any) {
      console.error('❌ useAuth: Login failed:', error);
      clearAuth();
      
      // Обрабатываем различные типы ошибок
      if (error.error) {
        throw new Error(error.error);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Ошибка входа. Проверьте данные и попробуйте снова.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🔐 useAuth: Logging out...');
      // Пытаемся отправить запрос на выход (если токен еще валидный)
      if (token) {
        await authAPI.logout();
      }
    } catch (error) {
      // Игнорируем ошибки при выходе (токен мог уже быть невалидным)
      console.warn('⚠️ useAuth: Logout request failed:', error);
    } finally {
      clearAuth();
      console.log('✅ useAuth: Logout complete');
    }
  };

  // Функция для валидации токена при необходимости
  const validateToken = async (): Promise<boolean> => {
    if (!token) return false;
    
    try {
      console.log('🔍 useAuth: Validating current token...');
      const response = await authAPI.me();
      if (response.success && response.data) {
        console.log('✅ useAuth: Token is valid');
        // Обновляем данные пользователя
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        return true;
      } else {
        console.warn('❌ useAuth: Token is invalid');
        clearAuth();
        return false;
      }
    } catch (error) {
      console.warn('❌ useAuth: Token validation failed:', error);
      clearAuth();
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    validateToken, // Добавляем функцию валидации
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 