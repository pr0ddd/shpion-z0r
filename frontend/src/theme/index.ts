import { createTheme } from '@mui/material/styles';

// Discord-inspired color palette
export const colors = {
  // Main Discord colors
  primary: '#5865f2', // Discord blurple
  primaryDark: '#4752c4',
  secondary: '#57f287', // Discord green
  
  // Background colors (dark theme)
  background: {
    primary: '#36393f', // Main background
    secondary: '#2f3136', // Sidebar background  
    tertiary: '#202225', // Server list background
    chat: '#40444b', // Chat input background
  },
  
  // Text colors
  text: {
    primary: '#ffffff',
    secondary: '#b9bbbe',
    muted: '#72767d',
    link: '#00aff4',
  },
  
  // Status colors
  status: {
    online: '#43b581',
    idle: '#faa61a', 
    dnd: '#f04747',
    offline: '#747f8d',
  },
  
  // Accent colors
  accent: {
    danger: '#ed4245',
    warning: '#fee75c',
    success: '#57f287',
    info: '#5865f2',
  }
};

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary,
      dark: colors.primaryDark,
    },
    secondary: {
      main: colors.secondary,
    },
    background: {
      default: colors.background.primary,
      paper: colors.background.secondary,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
    },
    error: {
      main: colors.accent.danger,
    },
    warning: {
      main: colors.accent.warning,
    },
    success: {
      main: colors.accent.success,
    },
    info: {
      main: colors.accent.info,
    },
  },
  
  typography: {
    fontFamily: '"Roboto", "Whitney", "Helvetica Neue", Arial, sans-serif',
    h4: {
      fontWeight: 600,
      color: colors.text.primary,
    },
    h5: {
      fontWeight: 600,
      color: colors.text.primary,
    },
    h6: {
      fontWeight: 600,
      color: colors.text.primary,
    },
    body1: {
      color: colors.text.primary,
    },
    body2: {
      color: colors.text.secondary,
    },
  },
  
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background.primary,
          color: colors.text.primary,
        },
      },
    },
    
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.secondary,
          border: `1px solid rgba(255, 255, 255, 0.1)`,
        },
      },
    },
    
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.secondary,
          borderRadius: 8,
        },
      },
    },
    
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
          fontWeight: 500,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        },
      },
    },
    
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginBottom: 2,
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
          '&.Mui-selected': {
            backgroundColor: colors.primary + '20',
            '&:hover': {
              backgroundColor: colors.primary + '30',
            },
          },
        },
      },
    },
    
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
  
  shape: {
    borderRadius: 8,
  },
});

export default theme; 