import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            textAlign: 'center',
            p: 3,
          }}
        >
          <Typography variant="h4" gutterBottom>
            Что-то пошло не так.
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
          >
            Перезагрузить
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 