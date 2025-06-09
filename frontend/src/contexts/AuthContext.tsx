import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { User, LoginResponseData } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    authAPI.logout().catch(err => console.error("Logout API call failed, proceeding.", err));
    localStorage.removeItem('authToken');
    setUser(null);
    setToken(null);
  }, []);

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
      setLoading(false);
    };

    initialAuthCheck();

    const handleAuthError = () => {
      console.log("Auth error detected, logging out.");
      logout();
    };

    window.addEventListener('auth-error', handleAuthError);

    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };

  }, [logout]);

  const handleAuthSuccess = useCallback((data: LoginResponseData) => {
    const { user, token: newToken } = data;
    localStorage.setItem('authToken', newToken);
    setUser(user);
    setToken(newToken);
    setError(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.login(email, password);
      if (response.success && response.data) {
        handleAuthSuccess(response.data);
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred during login.');
    } finally {
        setLoading(false);
    }
  }, [handleAuthSuccess]);

  const register = useCallback(async (email: string, username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.register(email, username, password);
      if (response.success && response.data) {
        handleAuthSuccess(response.data);
      } else {
         setError(response.error || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'An unexpected error occurred during registration.');
    } finally {
        setLoading(false);
    }
  }, [handleAuthSuccess]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
  }), [user, token, loading, error, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 