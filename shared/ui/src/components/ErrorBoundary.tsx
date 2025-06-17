import React, { Component, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console -- boundary logs
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          height="100vh"
          bgcolor="#1e1f22"
          color="white"
          textAlign="center"
          p={3}
        >
          <Typography variant="h5" gutterBottom>
            Что-то пошло не так.
          </Typography>
          <Typography gutterBottom>
            Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
          </Typography>
          <Button variant="contained" onClick={this.handleReload} sx={{ mt: 2 }}>
            Перезагрузить
          </Button>
          {this.state.error && (
            <pre
              style={{
                color: '#f44336',
                marginTop: 20,
                background: '#333',
                padding: 10,
                borderRadius: 5,
                maxWidth: '80vw',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {this.state.error.message}
            </pre>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 