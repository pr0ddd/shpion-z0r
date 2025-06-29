import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { User, LoginResponseData } from '@shared/types';
import { authAPI } from '@shared/data';
import { AuthContextType } from './auth.types';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // prevent multiple parallel logout requests
  const isLoggingOutRef = React.useRef(false);

  // local-only logout (token invalid / 401) – no network trip
  const doLocalLogout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setToken(null);
  };

  // Full logout invoked from UI button – hits backend once, guarded against repeats
  const logout = useCallback(() => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    authAPI
      .logout()
      .catch((err) => console.error('Logout API call failed, proceeding.', err))
      .finally(() => {
        isLoggingOutRef.current = false;
      });
    doLocalLogout();
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
      if ((import.meta as any).env?.DEV) {
        console.debug('Auth error detected, doing local logout.');
      }
      doLocalLogout();
    };

    window.addEventListener('auth-error', handleAuthError);

    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []);

  const handleAuthSuccess = useCallback((data: LoginResponseData) => {
    const { user, token: newToken } = data;
    localStorage.setItem('authToken', newToken);
    setUser(user);
    setToken(newToken);
    setError(null);
    navigate('/');
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
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
        if (err?.response?.status === 401) {
          setError('Неверный email или пароль.');
        } else {
          setError(
            err?.response?.data?.error ||
              err.message ||
              'Не удалось войти. Попробуйте позже.'
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [handleAuthSuccess]
  );

  const register = useCallback(
    async (email: string, username: string, password: string) => {
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
        if (err?.response?.status === 409) {
          setError('Пользователь с таким Email уже существует.');
        } else {
          setError(
            err?.response?.data?.error ||
              err.message ||
              'Не удалось зарегистрироваться.'
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [handleAuthSuccess]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      login,
      register,
      logout,
    }),
    [user, token, loading, error, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
