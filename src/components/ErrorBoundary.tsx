import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { draculaColors } from '../theme/dracula';
import { MONO_FAMILY } from '../styles/shared';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  resetKey: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Pick<State, 'hasError' | 'error'> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('ErrorBoundary caught:', error.message, errorInfo.componentStack);
  }
  private handleReset = () => {
    this.setState(({ resetKey }) => ({ hasError: false, error: null, resetKey: resetKey + 1 }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <Box sx={{ flex: 1, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6" sx={{ color: draculaColors.red, mb: 1, fontFamily: MONO_FAMILY }}>
            This part of the workspace could not load
          </Typography>
          <Typography variant="body2" sx={{ color: draculaColors.comment, fontFamily: MONO_FAMILY, textAlign: 'center', mb: 2 }}>
            Try again. If this keeps happening, reload the page.
          </Typography>
          <Button variant="outlined" color="inherit" onClick={this.handleReset} sx={{ color: draculaColors.cyan, borderColor: draculaColors.cyan, fontFamily: MONO_FAMILY }}>
            Try again
          </Button>
          <Box component="details" sx={{ mt: 2, color: draculaColors.comment, fontFamily: MONO_FAMILY, maxWidth: '100%' }}>
            <Box component="summary" sx={{ cursor: 'pointer' }}>Technical details</Box>
            <Box component="pre" sx={{ m: 0, mt: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {this.state.error?.message ?? 'Unknown error'}
            </Box>
          </Box>
        </Box>
      );
    }
    return <Fragment key={this.state.resetKey}>{this.props.children}</Fragment>;
  }
}
