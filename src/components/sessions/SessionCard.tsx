import { formatDistanceToNow } from "date-fns";
import { Session, getStatusConfig, getStatusBadgeClasses } from "@/types/sessions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Lightbulb } from "lucide-react";
import { generateSessionName } from "@/utils/sessionHelpers";

interface SessionCardProps {
  session: Session;
  onAction: (session: Session) => void;
}

export const SessionCard = ({ session, onAction }: SessionCardProps) => {
  const config = getStatusConfig(session.status);
  const relativeTime = formatDistanceToNow(session.updatedAt, { addSuffix: true });
  const sessionName = generateSessionName(session.collectedData);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground text-sm truncate">
                {sessionName}
              </h3>
              <p className="text-xs text-muted-foreground">{relativeTime}</p>
            </div>
          </div>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full shrink-0 ${getStatusBadgeClasses(config.color)}`}
          >
            {config.label}
          </span>
        </div>

        <Progress value={session.progress} className="h-1 mb-3" />

        <Button
          onClick={() => onAction(session)}
          className="w-full touch-target"
          variant={config.color === "green" ? "default" : "outline"}
        >
          {config.action}
        </Button>
      </CardContent>
    </Card>
  );
};
