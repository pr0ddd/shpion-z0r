import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Box, CircularProgress, ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthPage } from './components/AuthPage';
import InvitePage from './components/InvitePage';
import { ServerProvider } from './contexts/ServerContext';
import ErrorBoundary from './components/ErrorBoundary';

// Module augmentation to add custom palette colors
declare module '@mui/material/styles' {
  interface Palette {
    custom: {
      green: string;
      red: string;
      purple: string;
      yellow: string;
    };
  }
  interface PaletteOptions {
    custom?: {
      green?: string;
      red?: string;
      purple?: string;
      yellow?: string;
    };
  }
}

// Lazy load the main application layout
const ProtectedAppLayout = lazy(() => import('./components/ProtectedAppLayout'));

// Определение нашей новой нео-дарк темы
const neoDarkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#5865F2', // Яркий сине-фиолетовый (Blurple)
    },
    secondary: {
      main: '#B9BBBE', // Светло-серый для второстепенного текста
    },
    background: {
      default: '#1e1f22', // Очень темный, почти черный фон
      paper: '#2b2d31', // Фон для панелей, чуть светлее
    },
    text: {
      primary: '#f2f3f5', // Яркий белый для основного текста
      secondary: '#b8b9bf', // Приглушенный серый для вторичного текста
    },
    success: {
        main: '#2DC770', // Яркий зеленый
    },
    error: {
        main: '#ED4245' // Яркий красный
    },
    custom: {
      green: '#2DC770',
      red: '#ED4245',
      purple: '#9B59B6', // A nice purple
      yellow: '#FEE75C',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8, // Более скругленные углы
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.2)',
          }
        },
      },
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                backgroundImage: 'none', // Убираем градиенты по-умолчанию
            }
        }
    },
    MuiTooltip: {
        styleOverrides: {
            tooltip: {
                backgroundColor: '#111214',
                color: '#f2f3f5',
                border: '1px solid #2b2d31',
            },
            arrow: {
                color: '#111214',
            }
        }
    }
  },
});

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh" bgcolor="#1e1f22">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={neoDarkTheme}>
      <CssBaseline />
      <Router>
        <ErrorBoundary>
          <Suspense fallback={
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh" bgcolor="background.default">
              <CircularProgress />
            </Box>
          }>
            <Routes>
              <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" />} />
              <Route path="/invite/:inviteCode" element={user ? <InvitePage /> : <Navigate to="/auth" />} />
              <Route 
                path="/*" 
                element={
                  user ? (
                    <ServerProvider>
                      <ProtectedAppLayout />
                    </ServerProvider>
                  ) : (
                    <Navigate to="/auth" />
                  )
                } 
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Router>
    </ThemeProvider>
  );
};

export default App;
