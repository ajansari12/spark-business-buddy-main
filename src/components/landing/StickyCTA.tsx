import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface StickyCTAProps {
  onStartJourney: () => void;
}

export const StickyCTA = ({ onStartJourney }: StickyCTAProps) => {
  const { scrollDirection, isAtTop } = useScrollDirection();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const isVisible = scrollDirection === "up" && !isAtTop;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 p-4 safe-bottom transition-transform duration-300",
        "bg-background/80 backdrop-blur-lg border-t border-border",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <Button
        onClick={onStartJourney}
        size="lg"
        className="w-full h-12 text-base rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
      >
        Start Your Journey
        <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </div>
  );
};
