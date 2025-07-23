import {
  createTheme,
  ThemeOptions,
  lighten,
  darken,
} from '@mui/material/styles';

type ShpionPalette = {
  background: string;
  sidebar: string;
  sidebarAccent: string;
  card: string;
  border: string;
  borderLight: string;
  hover: string;
  hoverOverlay: string;
  dangerHover: string;
  formField: string;
  primary: string;
  primaryForeground: string;
  green: string;
  red: string;
  redLight: string;
  muted: string;
  mutedForeground: string;
  foreground: string;
  foregroundLight: string;
};

// Расширяем интерфейс PaletteOptions для TypeScript
declare module '@mui/material/styles' {
  interface Palette {
    new: ShpionPalette;
  }
  interface PaletteOptions {
    new?: Partial<ShpionPalette>;
  }
}

export const createAppTheme = (mode: 'dark' | 'light' = 'dark') => {
  const darkNew = {
      background: 'hsl(220, 13%, 7%)',
      sidebar: 'hsl(220, 13%, 5%)',
      sidebarAccent: 'hsl(220, 13%, 13%)',
      card: 'hsl(220, 13%, 9%)',
      border: 'hsl(220, 13%, 18%)',
      borderLight: 'hsl(220, 13%, 18%)',
      hover: 'hsl(220, 13%, 15%)',
      hoverOverlay: 'hsl(220, 13%, 10%)',
      dangerHover: 'hsl(220, 13%, 10%)',
      formField: '#1d2025',
      primary: '#8b5cd6',
      primaryForeground: 'hsl(210, 40%, 98%)',
      green: '#16a249',
      red: '#ef4343',
      redLight: '#732626',
      muted: 'hsl(220, 13%, 13%)',
      mutedForeground: 'hsl(220, 13%, 55%)',
      foreground: 'hsl(220, 13%, 90%)',
      foregroundLight: 'hsl(215, 14%, 34%)',
  } as const;

  const lightNew = {
    background: '#f8f9fa',
    sidebar: '#ffffff',
    sidebarAccent: '#f0f0f0',
    card: '#ffffff',
    border: '#d0d0d0',
    borderLight: '#e0e0e0',
    hover: '#eaeaea',
    hoverOverlay: '#f0f0f0',
    dangerHover: '#ffdddd',
    formField: '#f5f5f5',
    primary: '#8b5cd6',
    primaryForeground: '#ffffff',
    green: '#16a249',
    red: '#ef4343',
    redLight: '#ffdddd',
    muted: '#f0f0f0',
    mutedForeground: '#606060',
    foreground: '#202020',
    foregroundLight: '#707070',
  } as ShpionPalette;

  const paletteNew = mode === 'dark' ? darkNew : lightNew;

  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      new: paletteNew,
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
        fontSize: '0.875rem',
      },
    },
    shape: {
      borderRadius: 8,
    },
    // Explicitly declare breakpoints so that we can rely on them across the app
    // and adjust them centrally later if required. These are Material UI defaults
    // but having them in the theme object makes intent clear and enables easy tweaks.
    breakpoints: {
      values: {
        xs: 0,       // mobile
        sm: 600,     // ≥600px – small tablets / landscape phones
        md: 900,     // ≥900px – tablets / small laptops
        lg: 1200,    // ≥1200px – desktops
        xl: 1536,    // ≥1536px – large screens
      },
    },
  };

  // reuse components overrides from existing (not repeating whole) - we keep previous overrides referencing theme.palette.new etc.
  const overrides = {
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
              backgroundColor: theme.palette.new.redLight,
              '&:hover': {
                backgroundColor: lighten(theme.palette.new.redLight, 0.1),
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
          root: ({ theme }) => {
            return {
              height: 28,
              paddingLeft: 1,
              paddingRight: 1,
              fontWeight: 600,
              '&.MuiChip-colorPrimary': {
                backgroundColor: theme.palette.new.primary,
                color: theme.palette.new.primaryForeground,
              },
              '&.MuiChip-colorDefault': {
                backgroundColor: theme.palette.new.background,
                color: theme.palette.new.foreground,
                border: `1px solid ${theme.palette.new.border}`,
              },
            };
          },
        },
      },
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
              width: '4px',
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
  } as ThemeOptions;

  return createTheme({ ...themeOptions, ...overrides });
};

// default export (dark) for legacy imports
const theme = createAppTheme('dark');
export default theme;
