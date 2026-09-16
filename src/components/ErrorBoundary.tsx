import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full p-8 bg-card border border-border rounded-2xl shadow-xl text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">
                An unexpected application error occurred. You can reload the page or return to the dashboard.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-muted/50 rounded-xl text-left font-mono text-xs text-muted-foreground overflow-auto max-h-32 border">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
                <Home className="w-4 h-4" /> Go to Home
              </Button>
              <Button onClick={this.handleReload} className="gap-2 bg-primary text-primary-foreground">
                <RefreshCw className="w-4 h-4" /> Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
