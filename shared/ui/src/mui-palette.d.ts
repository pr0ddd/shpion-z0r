import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
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
  }

  interface PaletteOptions {
    chat?: Partial<Palette['chat']>;
  }
}

export {}; 