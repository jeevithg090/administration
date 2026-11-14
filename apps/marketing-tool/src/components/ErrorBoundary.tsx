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
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4" role="alert">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
          </div>

          <div className="space-y-4">
            <p className="text-red-700">
              An error occurred while generating your images. This might be due to API limitations
              or network issues.
            </p>

            {this.state.error && (
              <details className="text-sm">
                <summary className="cursor-pointer text-red-600 font-medium">Error Details</summary>
                <div className="mt-2 p-3 bg-red-100 rounded border">
                  <p className="font-mono text-xs text-red-800">{this.state.error.message}</p>
                </div>
              </details>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={this.resetError}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
              >
                Reload Page
              </button>
            </div>

            <div className="text-sm text-red-600">
              <p>
                <strong>Suggestions:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Try using the "Local Canvas" model for reliable generation</li>
                <li>Check your internet connection</li>
                <li>Reduce the number of aspect ratios selected</li>
                <li>Wait a moment and try again</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
