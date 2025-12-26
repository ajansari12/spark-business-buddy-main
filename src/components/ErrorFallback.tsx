import { ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset?: () => void;
}

export const ErrorFallback = ({ error, errorInfo, onReset }: ErrorFallbackProps) => {
  const handleGoHome = () => {
    if (onReset) onReset();
    window.location.href = '/';
  };

  const handleRefresh = () => {
    if (onReset) onReset();
    window.location.reload();
  };

  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Oops! Something went wrong</CardTitle>
          <CardDescription className="text-base mt-2">
            We apologize for the inconvenience. An unexpected error has occurred.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User-friendly error message */}
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Don't worry - your data is safe. Try one of the options below to continue:
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleRefresh} className="flex-1" size="lg">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
            <Button onClick={handleGoHome} variant="outline" className="flex-1" size="lg">
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </div>

          {/* Technical details (dev only) */}
          {isDevelopment && error && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                Technical Details (Development Only)
              </summary>
              <div className="mt-3 space-y-3">
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                  <p className="text-xs font-mono text-destructive font-semibold mb-2">
                    Error Message:
                  </p>
                  <p className="text-xs font-mono text-destructive break-all">
                    {error.message}
                  </p>
                </div>

                {error.stack && (
                  <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                    <p className="text-xs font-mono text-muted-foreground font-semibold mb-2">
                      Stack Trace:
                    </p>
                    <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  </div>
                )}

                {errorInfo && errorInfo.componentStack && (
                  <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                    <p className="text-xs font-mono text-muted-foreground font-semibold mb-2">
                      Component Stack:
                    </p>
                    <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Support information */}
          <div className="border-t pt-6">
            <p className="text-xs text-muted-foreground text-center">
              If this problem persists, please contact our support team with the error details.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
