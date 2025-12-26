import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Mail, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrackEvent } from '@/hooks/useTrackEvent';

interface PaymentErrorRecoveryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: {
    code?: string;
    message: string;
    type?: 'card_declined' | 'insufficient_funds' | 'network_error' | 'unknown';
  };
  onRetry: () => Promise<void>;
}

const ERROR_MESSAGES = {
  card_declined: {
    title: 'Card Declined',
    description: 'Your card was declined. This could be due to insufficient funds, incorrect card details, or your bank blocking the transaction.',
    suggestions: [
      'Check your card details are correct',
      'Ensure you have sufficient funds',
      'Contact your bank to authorize the payment',
      'Try a different payment method',
    ],
  },
  insufficient_funds: {
    title: 'Insufficient Funds',
    description: 'Your account does not have enough funds to complete this purchase.',
    suggestions: [
      'Add funds to your account',
      'Try a different payment method',
      'Contact your bank for assistance',
    ],
  },
  network_error: {
    title: 'Network Error',
    description: 'We couldn\'t process your payment due to a network issue.',
    suggestions: [
      'Check your internet connection',
      'Try again in a few moments',
      'Contact support if the problem persists',
    ],
  },
  unknown: {
    title: 'Payment Failed',
    description: 'We encountered an unexpected error processing your payment.',
    suggestions: [
      'Try again in a few moments',
      'Try a different payment method',
      'Contact support for assistance',
    ],
  },
};

/**
 * Payment Error Recovery Component
 * Helps users recover from failed payment transactions
 */
export const PaymentErrorRecovery = ({
  open,
  onOpenChange,
  error,
  onRetry,
}: PaymentErrorRecoveryProps) => {
  const navigate = useNavigate();
  const { track } = useTrackEvent();
  const [isRetrying, setIsRetrying] = useState(false);

  const errorType = error.type || 'unknown';
  const errorInfo = ERROR_MESSAGES[errorType];

  const handleRetry = async () => {
    track('payment_error_retry_clicked', {
      error_type: errorType,
      error_code: error.code,
    });

    setIsRetrying(true);
    try {
      await onRetry();
      track('payment_error_retry_success', {
        error_type: errorType,
      });
      onOpenChange(false);
    } catch (retryError) {
      track('payment_error_retry_failed', {
        error_type: errorType,
        retry_error: String(retryError),
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleContactSupport = () => {
    track('payment_error_support_clicked', {
      error_type: errorType,
      error_code: error.code,
    });
    // Open support email or chat
    window.location.href = `mailto:support@sparkbusinessbuddy.ca?subject=Payment Error - ${errorType}&body=Error: ${error.message}%0A%0AError Code: ${error.code}`;
  };

  const handleTryDifferentMethod = () => {
    track('payment_error_different_method_clicked', {
      error_type: errorType,
    });
    onOpenChange(false);
    navigate('/pricing');
  };

  const handleClose = () => {
    track('payment_error_dismissed', {
      error_type: errorType,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <DialogTitle className="text-center text-xl">{errorInfo.title}</DialogTitle>
          <DialogDescription className="text-center">
            {errorInfo.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error details */}
          <Card className="p-4 bg-muted">
            <p className="text-sm font-medium mb-2">What happened:</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            {error.code && (
              <p className="text-xs text-muted-foreground mt-2">Error Code: {error.code}</p>
            )}
          </Card>

          {/* Suggestions */}
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              How to fix this:
            </p>
            <ul className="space-y-1.5 ml-6">
              {errorInfo.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-muted-foreground list-disc">
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={handleRetry}
              size="lg"
              className="w-full"
              disabled={isRetrying}
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>

            <Button
              onClick={handleTryDifferentMethod}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Try Different Payment Method
            </Button>

            <Button
              onClick={handleContactSupport}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>

          {/* Additional help */}
          <div className="border-t pt-4">
            <p className="text-xs text-center text-muted-foreground">
              Still having issues? Our support team is here to help.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Hook for managing payment error recovery
 */
export const usePaymentErrorRecovery = () => {
  const [error, setError] = useState<PaymentErrorRecoveryProps['error'] | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const showError = (errorData: PaymentErrorRecoveryProps['error']) => {
    setError(errorData);
    setIsOpen(true);
  };

  const clearError = () => {
    setError(null);
    setIsOpen(false);
  };

  return {
    error,
    isOpen,
    showError,
    clearError,
    setIsOpen,
  };
};
