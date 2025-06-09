import { createTheme, ThemeOptions } from '@mui/material/styles';

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
  }
  interface PaletteOptions {
    discord?: Partial<Palette['discord']>;
  }
}

// Создаем нашу кастомную тему
const theme = createTheme({
  palette: {
    mode: 'dark', // Используем темную тему, как это часто бывает в игровых приложениях
    primary: {
      main: '#7289da', // Цвет как у Discord
    },
    secondary: {
      main: '#747f8d',
    },
    background: {
      default: '#2c2f33',
      paper: '#23272a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b9bbbe',
    },
    // Дополнительные цвета для дискорд-подобного интерфейса
    discord: {
      sidebar: '#202225',
      blurple: '#5865f2',
      green: '#43b581',
      grey: '#36393f',
      members_bg: '#2f3136',
      chat_bg: '#36393f',
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
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
          borderRadius: 6,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
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