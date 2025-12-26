import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Crown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrackEvent } from '@/hooks/useTrackEvent';

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: 'ideas_limit' | 'documents_limit' | 'features_limit';
  currentTier: 'free' | 'pro' | 'enterprise';
  limitReached?: number;
}

const LIMIT_MESSAGES = {
  ideas_limit: {
    title: 'Idea Limit Reached',
    description: 'You\'ve reached your monthly idea generation limit.',
    icon: Zap,
  },
  documents_limit: {
    title: 'Document Limit Reached',
    description: 'You\'ve reached your monthly document generation limit.',
    icon: Crown,
  },
  features_limit: {
    title: 'Premium Feature',
    description: 'This feature is only available on Pro and Enterprise plans.',
    icon: Crown,
  },
};

export const PaywallModal = ({
  open,
  onOpenChange,
  reason,
  currentTier,
  limitReached,
}: PaywallModalProps) => {
  const navigate = useNavigate();
  const { track } = useTrackEvent();

  const config = LIMIT_MESSAGES[reason];
  const Icon = config.icon;

  const handleUpgrade = () => {
    track('paywall_upgrade_clicked', {
      reason,
      current_tier: currentTier,
      limit_reached: limitReached,
    });
    onOpenChange(false);
    navigate('/pricing');
  };

  const handleClose = () => {
    track('paywall_dismissed', {
      reason,
      current_tier: currentTier,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">{config.title}</DialogTitle>
          <DialogDescription className="text-center">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current usage */}
          {limitReached && (
            <Card className="p-4 bg-muted">
              <p className="text-sm text-center">
                You've generated <strong>{limitReached} ideas</strong> this month
              </p>
            </Card>
          )}

          {/* Pro tier benefits */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Upgrade to Pro to get:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Unlimited business idea generation</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Unlimited document exports (PDF, Word)</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Priority support and faster responses</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Advanced market analysis and insights</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Custom business plan templates</span>
              </li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={handleUpgrade} size="lg" className="w-full">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>
            <Button onClick={handleClose} variant="ghost" size="sm" className="w-full">
              Maybe Later
            </Button>
          </div>

          {/* Pricing info */}
          <p className="text-xs text-center text-muted-foreground">
            Starting at just $29/month
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
