import { createTheme, ThemeOptions, lighten } from '@mui/material/styles';

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
    chat: {
      myMessage: string;
      theirMessage: string;
      background: string;
      textPrimary: string;
      textSecondary: string;
      inputBackground: string;
      inputPlaceholder: string;
      border: string;
    };
    sidebar: {
      background: string;
      border: string;
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
    chat?: {
      myMessage?: string;
      theirMessage?: string;
      background?: string;
      textPrimary?: string;
      textSecondary?: string;
      inputBackground?: string;
      inputPlaceholder?: string;
      border?: string;
    };
    sidebar?: {
      background?: string;
      border?: string;
    };
  }
}

const themeOptions: ThemeOptions = {
  palette: {
    mode: 'dark', // Используем темную тему, как это часто бывает в игровых приложениях
    primary: {
      main: 'rgba(40, 81, 178, 0.84)', // Discord blurple
      light: lighten('#5865F2', 0.2),
      dark: '#4752c4',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#B9BBBE', // light grey for secondary text/icons
    },
    background: {
      default: '#1E1F22', // dark background
      paper: '#2B2D31', // slightly lighter panels
    },
    text: {
      primary: '#F2F3F5',
      secondary: '#B8B9BF',
    },
    success: {
        main: '#2DC770', // Яркий зеленый
    },
    error: {
        main: '#ED4245' // Яркий красный
    },
    discord: {
      sidebar: '#202225',
      blurple: '#537A5A', // new primary
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
    chat: {
      myMessage: '#005c4b',
      theirMessage: '#2f3136',
      background: '#36393f',
      textPrimary: '#ffffff',
      textSecondary: '#8e9297',
      inputBackground: '#40444b',
      inputPlaceholder: '#b9bbbe',
      border: '#202225',
    },
    sidebar: {
        background: '#2F3136',
        border: 'rgba(255, 255, 255, 0.12)',
    },
    action: {
      hover: '#40444B',
      selected: '#5865F2',
      selectedOpacity: 0.24,
    },
  },
  typography: {
    fontFamily: '"Jura", "Helvetica", "Arial", sans-serif',
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
        defaultProps: {
          disableFocusListener: true,
          disableHoverListener: true,
          disableTouchListener: true,
        },
        styleOverrides: {
          tooltip: { display: 'none' },
        },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          '*::-webkit-scrollbar': {
            width: '8px',
          },
          '*::-webkit-scrollbar-track': {
            background: '#141517',
          },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: '#202225',
            borderRadius: '4px',
            border: '2px solid #2f3136',
          },
          '*::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#1a1b1e',
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: theme.palette.grey[900],
          borderRadius: 8,
          paddingBlock: 4,
        }),
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          marginInline: theme.spacing(1),
          borderRadius: 5,
          '&:hover': { backgroundColor: '#40444B' },
          '&.Mui-selected': { backgroundColor: '#5865F2', color: '#fff' },
          '&.Mui-selected:hover': { backgroundColor: lighten('#5865F2', 0.15) },
          '& + .MuiMenuItem-root': { marginTop: theme.spacing(1) },
        }),
      },
    },
  },
};

// Manually add the custom palette because createTheme strips unknown properties.
(themeOptions.palette as any).discord = {
  sidebar: '#202225',
  blurple: '#40444b', // старое название поля, но цвет изменён
  green: '#43b581',
  grey: '#36393f',
  members_bg: '#2f3136',
  chat_bg: '#36393f',
};

export const theme = createTheme(themeOptions); 