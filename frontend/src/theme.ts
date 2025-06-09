import { createTheme } from '@mui/material/styles';

// Расширяем интерфейс PaletteOptions для TypeScript
declare module '@mui/material/styles' {
  interface Palette {
    discord: {
      sidebar: string;
      blurple: string;
      green: string;
      grey: string;
      members_bg: string;
      chat_bg: string;
    };
    custom: {
      green: string;
      red: string;
      purple: string;
      yellow: string;
    };
  }
  interface PaletteOptions {
    discord?: Partial<Palette['discord']>;
    custom?: {
      green?: string;
      red?: string;
      purple?: string;
      yellow?: string;
    };
  }
}

// Создаем нашу кастомную тему
const theme = createTheme({
  palette: {
    mode: 'dark', // Используем темную тему, как это часто бывает в игровых приложениях
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
    discord: {
      sidebar: '#202225',
      blurple: '#5865f2',
      green: '#43b581',
      grey: '#36393f',
      members_bg: '#2f3136',
      chat_bg: '#36393f',
    },
    custom: {
      green: '#2DC770',
      red: '#ED4245',
      purple: '#B589D6',
      yellow: '#FEE75C',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    // Убираем тени у Paper для более плоского вида
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          backgroundImage: 'none', // Убираем градиенты по-умолчанию
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        },
        elevation3: {
          boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
        },
      },
    },
    // Кастомизация кнопки
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
    // Кастомизация текстового поля
    MuiTextField: {
      defaultProps: {
        variant: 'filled',
      },
      styleOverrides: {
        root: {
          '& .MuiFilledInput-root': {
            backgroundColor: '#23272a',
            borderRadius: 6,
            '&:hover': {
              backgroundColor: '#2c2f33',
            },
            '&.Mui-focused': {
              backgroundColor: '#2c2f33',
            },
          },
        },
      },
    },
    MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 6,
          },
        },
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

// Manually add the custom palette because createTheme strips unknown properties.
(theme.palette as any).discord = {
  sidebar: '#202225',
  blurple: '#5865f2',
  green: '#43b581',
  grey: '#36393f',
  members_bg: '#2f3136',
  chat_bg: '#36393f',
};

export default theme; 