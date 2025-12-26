import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  ServerCrash,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export type ChatErrorType =
  | 'network'
  | 'server'
  | 'timeout'
  | 'rate_limit'
  | 'session_expired'
  | 'unknown';

interface EnhancedChatErrorProps {
  error: {
    type: ChatErrorType;
    message: string;
    retryable?: boolean;
  };
  onRetry?: () => void;
  onReset?: () => void;
}

const ERROR_CONFIGS = {
  network: {
    icon: WifiOff,
    iconColor: 'text-orange-500',
    title: 'Connection Lost',
    description: 'Unable to reach our servers. Please check your internet connection.',
    suggestions: [
      'Check your internet connection',
      'Try refreshing the page',
      'Disable VPN if you\'re using one',
    ],
    retryable: true,
    autoRetryDelay: 5000,
  },
  server: {
    icon: ServerCrash,
    iconColor: 'text-red-500',
    title: 'Server Error',
    description: 'Our servers are experiencing issues. We\'re working to fix it.',
    suggestions: [
      'Try again in a few moments',
      'Start a new session if the problem persists',
      'Contact support if this continues',
    ],
    retryable: true,
    autoRetryDelay: 10000,
  },
  timeout: {
    icon: Clock,
    iconColor: 'text-yellow-500',
    title: 'Request Timeout',
    description: 'The request took too long to complete.',
    suggestions: [
      'Your internet connection might be slow',
      'Try again with a simpler message',
      'Check your connection speed',
    ],
    retryable: true,
    autoRetryDelay: 3000,
  },
  rate_limit: {
    icon: AlertCircle,
    iconColor: 'text-purple-500',
    title: 'Too Many Requests',
    description: 'You\'ve sent too many messages too quickly.',
    suggestions: [
      'Wait a moment before sending another message',
      'Take a break and try again in a minute',
    ],
    retryable: false,
    autoRetryDelay: 60000,
  },
  session_expired: {
    icon: AlertCircle,
    iconColor: 'text-blue-500',
    title: 'Session Expired',
    description: 'Your session has expired. Please start a new conversation.',
    suggestions: ['Start a new session to continue'],
    retryable: false,
    autoRetryDelay: 0,
  },
  unknown: {
    icon: HelpCircle,
    iconColor: 'text-gray-500',
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred.',
    suggestions: [
      'Try refreshing the page',
      'Start a new session',
      'Contact support if this persists',
    ],
    retryable: true,
    autoRetryDelay: 5000,
  },
};

/**
 * Enhanced Chat Error Component
 * Shows detailed error information with recovery options
 */
export const EnhancedChatError = ({ error, onRetry, onReset }: EnhancedChatErrorProps) => {
  const config = ERROR_CONFIGS[error.type];
  const Icon = config.icon;
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [autoRetryCountdown, setAutoRetryCountdown] = useState<number | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-retry logic for network errors
  useEffect(() => {
    if (
      config.retryable &&
      config.autoRetryDelay > 0 &&
      onRetry &&
      error.type === 'network' &&
      !isOnline
    ) {
      return; // Don't auto-retry if offline
    }

    if (config.retryable && config.autoRetryDelay > 0 && onRetry) {
      const delaySeconds = Math.floor(config.autoRetryDelay / 1000);
      setAutoRetryCountdown(delaySeconds);

      const countdownInterval = setInterval(() => {
        setAutoRetryCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      const retryTimeout = setTimeout(() => {
        handleRetry();
      }, config.autoRetryDelay);

      return () => {
        clearTimeout(retryTimeout);
        clearInterval(countdownInterval);
      };
    }
  }, [error.type, config.retryable, config.autoRetryDelay, onRetry, isOnline]);

  const handleRetry = async () => {
    if (!onRetry) return;

    setIsRetrying(true);
    setAutoRetryCountdown(null);

    try {
      await onRetry();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Card className="border-2 border-destructive/20 bg-destructive/5">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center">
            <Icon className={`w-8 h-8 ${config.iconColor}`} />
          </div>

          {/* Title and Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">{config.title}</h3>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>

          {/* Error message */}
          {error.message && (
            <div className="bg-muted rounded-lg p-3 text-left w-full">
              <p className="text-xs font-mono text-muted-foreground break-all">
                {error.message}
              </p>
            </div>
          )}

          {/* Network status indicator */}
          {error.type === 'network' && (
            <div className="flex items-center gap-2 text-sm">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">Connection restored</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-red-500">No internet connection</span>
                </>
              )}
            </div>
          )}

          {/* Suggestions */}
          <div className="w-full text-left space-y-2">
            <p className="text-sm font-medium">Try these steps:</p>
            <ul className="space-y-1.5">
              {config.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 w-full pt-2">
            {config.retryable && onRetry && (
              <Button
                onClick={handleRetry}
                disabled={isRetrying || (error.type === 'network' && !isOnline)}
                className="flex-1"
                size="lg"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : autoRetryCountdown !== null ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retrying in {autoRetryCountdown}s...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </>
                )}
              </Button>
            )}

            {onReset && (
              <Button onClick={onReset} variant="outline" className="flex-1" size="lg">
                Start New Session
              </Button>
            )}
          </div>

          {/* Auto-retry info */}
          {autoRetryCountdown !== null && config.retryable && (
            <p className="text-xs text-muted-foreground">
              Automatically retrying in {autoRetryCountdown} seconds...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
