import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <div className="notice-error flex-col p-6" role="alert">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-6 shrink-0" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Something went wrong</h2>
          </div>
          <p>
            An unexpected error stopped the generator. Your choices above are kept, so you can try
            again. If it keeps happening, switch to the Local Canvas renderer.
          </p>
          {this.state.error && (
            <details>
              <summary className="cursor-pointer font-medium">Error details</summary>
              <pre className="mt-2 p-3 rounded-lg bg-surface text-fg text-xs whitespace-pre-wrap break-words">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={this.resetError} className="btn-primary">
              <RefreshCw className="size-4" aria-hidden="true" />
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
