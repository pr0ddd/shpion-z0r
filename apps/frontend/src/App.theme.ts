import {
  createTheme,
  ThemeOptions,
  lighten,
  darken,
} from '@mui/material/styles';

// Расширяем интерфейс PaletteOptions для TypeScript
declare module '@mui/material/styles' {
  interface Palette {
    new: {
      background: string;
      sidebar: string;
      sidebarAccent: string;
      card: string;
      border: string;
      borderLight: string;
      hover: string;
      formField: string;
      primary: string;
      primaryForeground: string;
      green: string;
      red: string;
      muted: string;
      mutedForeground: string;
      foreground: string;
      foregroundLight: string;
    };
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
    border: {
      main: string;
    };
  }
  interface PaletteOptions {
    new: {
      background: string;
      sidebar: string;
      sidebarAccent: string;
      card: string;
      border: string;
      borderLight: string;
      hover: string;
      formField: string;
      primary: string;
      primaryForeground: string;
      green: string;
      red: string;
      muted: string;
      mutedForeground: string;
      foreground: string;
      foregroundLight: string;
    };
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
    border: {
      main: string;
    };
  }
}

const themeOptions: ThemeOptions = {
  palette: {
    mode: 'dark', // Используем темную тему, как это часто бывает в игровых приложениях
    new: {
      background: 'hsl(220, 13%, 7%)',
      sidebar: 'hsl(220, 13%, 5%)',
      sidebarAccent: 'hsl(220, 13%, 13%)',
      card: 'hsl(220, 13%, 9%)',
      border: 'hsl(220, 13%, 18%)',
      borderLight: 'hsl(220, 13%, 18%)',
      hover: 'hsl(220, 13%, 15%)',
      formField: '#1d2025',
      primary: '#8852e0',
      primaryForeground: 'hsl(210, 40%, 98%)',
      green: '#16a249',
      red: '#ef4343',
      muted: 'hsl(220, 13%, 13%)',
      mutedForeground: 'hsl(220, 13%, 55%)',
      foreground: 'hsl(220, 13%, 90%)',
      foregroundLight: 'hsl(215, 14%, 34%)',
    },
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
      default: 'hsl(220, 13%, 7%)', // dark background
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
      main: '#ED4245', // Яркий красный
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
    border: {
      main: '#282c34',
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
    fontFamily: '"Open Sans", "Jura", "Helvetica", "Arial", sans-serif',
    h6: {
      fontSize: 12,
    },
    h2: {
      fontWeight: 700,
    },
    h4: {
      fontSize: 14,
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
    body1: {
      fontSize: 14,
    },
    body2: {
      fontSize: 12,
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
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.new.foreground,
          backgroundColor: theme.palette.new.background,
          '&:hover': {
            backgroundColor: lighten(theme.palette.new.background, 0.1),
          },

          '& .MuiSvgIcon-root': {
            fontSize: 17,
          },

          '&.MuiIconButton-colorError': {
            color: theme.palette.new.primaryForeground,
            backgroundColor: theme.palette.new.red,
            '&:hover': {
              backgroundColor: lighten(theme.palette.new.red, 0.1),
            },
          },
          '&.MuiIconButton-colorPrimary': {
            color: theme.palette.new.primaryForeground,
            backgroundColor: theme.palette.new.primary,
            '&:hover': {
              backgroundColor: lighten(theme.palette.new.primary, 0.1),
            },
            '&.Mui-disabled': {
              color: darken(theme.palette.new.primaryForeground, 0.2),
              backgroundColor: darken(theme.palette.new.primary, 0.5),
            },
          },
          '&.MuiIconButton-colorAccent': {
            color: theme.palette.new.foreground,
            backgroundColor: theme.palette.new.sidebarAccent,
            '&:hover': {
              backgroundColor: lighten(theme.palette.new.sidebarAccent, 0.1),
            },
          },
          '&.MuiIconButton-colorTransparent': {
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: lighten(theme.palette.new.background, 0.1),
            },
          },
          '&.MuiIconButton-sizeSmall': {
            width: 32,
            height: 32,
          },
          '&.MuiIconButton-sizeMedium': {
            width: 40,
            height: 40,
          },
          '&.MuiIconButton-sizeLarge': {
            width: 48,
            height: 48,
          },
        }),
      },
    },
    // Кастомизация текстового поля
    MuiFilledInput: {
      defaultProps: {
        disableUnderline: true,
      },
      styleOverrides: {
        root: {
          border: 'none',
          lineHeight: '20px',
          padding: 0,
          height: 40,
          backgroundColor: 'new.formField',
        },
        input: {
          border: 'none',
          padding: '10px 14px',
        },
      },
    },
    MuiAccordion: {
      defaultProps: {
        square: true,
        defaultExpanded: true,
        disableGutters: true,
      },
      styleOverrides: {
        root: ({ theme }) => ({
          margin: 0,
          backgroundColor: 'unset',
          boxShadow: 'none',
          '&.Mui-disabled': {
            backgroundColor: 'unset',
          },
          '& + .MuiAccordion-root': {
            borderTop: '1px solid',
            borderColor: theme.palette.new.border,
          },
        }),
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: ({ theme }) => ({
          paddingInline: theme.spacing(2),
          borderBottom: '1px solid',
          borderColor: theme.palette.new.border,
          minHeight: '57px', // TODO: calulate
        }),
        content: {
          margin: 0,
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: 0,
          backgroundColor: 'new.green',
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
    MuiChip: {
      styleOverrides: {
        root: ({ ownerState, theme }) => {
          let colors = {};
          switch (ownerState.color) {
            case 'primary':
              colors = {
                backgroundColor: theme.palette.new.primary,
                color: theme.palette.new.primaryForeground,
              };
              break;

            case 'default':
              colors = {
                backgroundColor: 'new.background',
                color: 'new.foreground',
              };
              break;
          }

          return {
            ...colors,
            height: 22,
            paddingLeft: 1,
            paddingRight: 1,
          };
        },
      },
    },
    // MuiTooltip: {
    //   defaultProps: {
    //     disableFocusListener: true,
    //     disableHoverListener: true,
    //     disableTouchListener: true,
    //   },
    //   styleOverrides: {
    //     tooltip: { display: 'none' },
    //   },
    // },
    MuiCircularProgress: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.new.primary,
        }),
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
          '&:hover': { backgroundColor: 'new.hover' },
          '&.Mui-selected': {
            backgroundColor: theme.palette.new.primary,
            color: 'new.primaryForeground',
          },
          '&.Mui-selected:hover': {
            backgroundColor: lighten(theme.palette.new.primary, 0.1),
          },
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
