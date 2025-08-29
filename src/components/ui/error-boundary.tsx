// Error boundary components for robust error handling

'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
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

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
  title?: string;
  description?: string;
}

export function ErrorFallback({
  error,
  onRetry,
  title = 'Something went wrong',
  description,
}: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-bold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-800">
          {description || error?.message || 'An unexpected error occurred'}
        </p>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700">
              Error Details
            </summary>
            <pre className="mt-2 whitespace-pre-wrap rounded bg-gray-100 p-4 text-xs text-gray-800">
              {error.stack}
            </pre>
          </details>
        )}
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

// Specialized error components

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorFallback
      title="Connection Error"
      description="Unable to connect to the server. Please check your internet connection."
      onRetry={onRetry}
    />
  );
}

export function DataLoadError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorFallback
      title="Failed to Load Data"
      description="There was a problem loading the data. This might be a temporary issue."
      onRetry={onRetry}
    />
  );
}

export function ChartError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorFallback
      title="Chart Loading Error"
      description="Unable to load chart data. Please try again."
      onRetry={onRetry}
    />
  );
}

// Hook for handling async errors in components
import { useCallback } from 'react';
import { useApiError } from '@/lib/hooks/use-api';

export function useErrorHandler() {
  const { clearErrorQueries, retryFailedQueries } = useApiError();

  const handleError = useCallback((error: Error, context?: string) => {
    console.error(`Error in ${context}:`, error);
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { tags: { context } });
    }
  }, []);

  const handleRetry = useCallback(() => {
    retryFailedQueries();
  }, [retryFailedQueries]);

  const clearErrors = useCallback(() => {
    clearErrorQueries();
  }, [clearErrorQueries]);

  return { handleError, handleRetry, clearErrors };
}