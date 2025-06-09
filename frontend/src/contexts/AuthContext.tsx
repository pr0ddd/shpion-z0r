import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { User, LoginResponse } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialAuthCheck = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        setToken(storedToken);
        try {
          const response = await authAPI.me();
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            localStorage.removeItem('authToken');
            setToken(null);
          }
        } catch (error) {
          console.error('Initial auth check failed, removing token', error);
          localStorage.removeItem('authToken');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initialAuthCheck();
  }, []); // Empty array ensures this runs only once on mount

  const handleAuthSuccess = useCallback((data: LoginResponse['data']) => {
    if (data) {
      const { user, token: newToken } = data;
      localStorage.setItem('authToken', newToken);
      setUser(user);
      setToken(newToken);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      if (response.success) {
        handleAuthSuccess(response.data);
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, [handleAuthSuccess]);

  const register = useCallback(async (email: string, username: string, password: string) => {
    try {
      const response = await authAPI.register(email, username, password);
      if (response.success) {
        handleAuthSuccess(response.data);
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }, [handleAuthSuccess]);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    isLoading,
    login,
    register,
    logout,
  }), [user, token, isLoading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 