import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ExternalLink,
  Phone,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface StrategyCallBookingProps {
  ideaTitle: string;
}

export function StrategyCallBooking({ ideaTitle }: StrategyCallBookingProps) {
  // Calendly URL - can be configured via environment variable in the future
  const calendlyUrl = "https://calendly.com/fasttrack-business/strategy-call";

  const openCalendly = () => {
    // Add idea context to the URL for reference
    const urlWithContext = `${calendlyUrl}?a1=${encodeURIComponent(ideaTitle)}`;
    window.open(urlWithContext, "_blank");
  };

  return (
    <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
          <Phone className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">1-on-1 Strategy Call</h3>
          <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/30">VIP Exclusive</Badge>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Book a 30-minute strategy session with a business advisor to discuss your "{ideaTitle}" business plan.
      </p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>30 minutes</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>Choose a time that works for you</span>
        </div>
      </div>

      <div className="bg-card/50 rounded-xl p-3 mb-4">
        <p className="text-xs font-medium text-foreground mb-2">What we'll cover:</p>
        <ul className="space-y-1.5">
          {[
            "Review your business idea and strategy",
            "Identify potential challenges and solutions",
            "Discuss funding and grant opportunities",
            "Create a personalized action plan",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <Button onClick={openCalendly} className="w-full">
        <Calendar className="w-4 h-4 mr-2" />
        Book Your Strategy Call
        <ExternalLink className="w-3 h-3 ml-2" />
      </Button>
    </div>
  );
}
