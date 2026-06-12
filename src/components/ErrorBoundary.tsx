import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { draculaColors } from '../theme/dracula';
import { MONO_FAMILY } from '../styles/shared';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('ErrorBoundary caught:', error.message, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <Box sx={{ flex: 1, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6" sx={{ color: draculaColors.red, mb: 1, fontFamily: MONO_FAMILY }}>
            Something went wrong
          </Typography>
          <Typography variant="body2" sx={{ color: draculaColors.comment, fontFamily: MONO_FAMILY, textAlign: 'center' }}>
            {this.state.error?.message ?? 'Unknown error'}
          </Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}
