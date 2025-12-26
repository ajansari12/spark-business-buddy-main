import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

/**
 * Standardized Empty State Component
 * Shows when there's no data to display
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  children,
}: EmptyStateProps) => {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
        </div>

        <h3 className="text-xl font-semibold mb-2">{title}</h3>

        <p className="text-muted-foreground mb-6 max-w-md">
          {description}
        </p>

        {children}

        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            {action && (
              <Button onClick={action.onClick} size="lg">
                {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                {action.label}
              </Button>
            )}

            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant="outline"
                size="lg"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Compact Empty State
 * For smaller areas like tables
 */
export const CompactEmptyState = ({
  icon: Icon,
  message,
  action,
}: {
  icon: LucideIcon;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon className="w-12 h-12 text-muted-foreground mb-3" aria-hidden="true" />
      <p className="text-muted-foreground mb-3">{message}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
};
