import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { CodeBlock } from '@astryxdesign/core/CodeBlock';

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
        <Stack hAlign="center" vAlign="center" gap={2} padding={4} height="100%">
          <Heading level={2} style={{ color: 'var(--dracula-red)' }}>
            This part of the workspace could not load
          </Heading>
          <Text type="body" justify="center">
            Try again. If this keeps happening, reload the page.
          </Text>
          <Button label="Try again" variant="secondary" onClick={this.handleReset} />
          <details>
            <summary>
              <Text>Technical details</Text>
            </summary>
            <CodeBlock
              code={this.state.error?.message ?? 'Unknown error'}
              language="plaintext"
              width="100%"
            />
          </details>
        </Stack>
      );
    }
    return <Fragment key={this.state.resetKey}>{this.props.children}</Fragment>;
  }
}
