import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      console.log('🔍 Initial auth check... Stored token:', storedToken ? 'Present' : 'None');
      console.log('🔍 State token:', token ? 'Present' : 'None');
      
      if (storedToken) {
        try {
          console.log('📡 Making /auth/me request...');
          const response = await authAPI.me();
          console.log('📡 Auth check response:', response);
          
          if (response.success && response.data) {
            console.log('✅ Auth successful, setting user:', response.data);
            setUser(response.data);
            setToken(storedToken); // Убеждаемся что token установлен
          } else {
            console.log('❌ Auth failed - invalid response:', response);
            localStorage.removeItem('authToken');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('❌ Auth check failed:', error);
          localStorage.removeItem('authToken');
          setToken(null);
          setUser(null);
        }
      } else {
        console.log('❌ No token found, user not authenticated');
        setUser(null);
        setToken(null);
      }
      
      console.log('🏁 Auth check completed, setting loading to false');
      setIsLoading(false);
    };

    checkAuth();
  }, []); // Проверяем только при монтировании

  const login = async (email: string, password: string) => {
    console.log('Starting login process...', { email });
    setIsLoading(true);
    try {
      console.log('Making login API call...');
      const response = await authAPI.login(email, password) as any;
      console.log('Login response:', response);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        console.log('Login successful! User:', user, 'Token length:', token.length);
        setUser(user);
        setToken(token);
        localStorage.setItem('authToken', token);
        console.log('Token saved to localStorage');
        console.log('State updated - user:', user, 'token set:', !!token);
      } else {
        console.log('Login failed - invalid response:', response);
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      console.log('Login process finished, setting loading to false');
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 