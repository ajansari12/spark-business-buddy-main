import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

interface HeroProps {
  onStartJourney: () => void;
}

export const Hero = ({ onStartJourney }: HeroProps) => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center px-4 pt-16 pb-8 safe-top">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30 -z-10" />
      
      <div className="container max-w-lg mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6 animate-fade-in">
          <Sparkles className="w-4 h-4" />
          <span>AI-Powered Business Launch</span>
        </div>
        
        {/* Main headline */}
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          Launch Your Canadian Business{" "}
          <span className="text-accent">Faster</span>
        </h1>
        
        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-md mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Get personalized business ideas tailored to your skills, location, and budget in just minutes.
        </p>
        
        {/* CTA Button */}
        <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <Button
            onClick={onStartJourney}
            size="lg"
            className="touch-target w-full sm:w-auto text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
          >
            Start Your Journey
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
        
        {/* Price indicator */}
        <p className="mt-4 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.4s" }}>
          Only <span className="font-semibold text-foreground">$9.99 CAD</span> for your personalized business ideas
        </p>
      </div>
    </section>
  );
};
