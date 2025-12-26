import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight, ChevronDown, MapPin, DollarSign, Clock, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { CanadianMarketFitScore } from "@/components/ideas/CanadianMarketFitScore";
import { TrendingBadge } from "@/components/ideas/TrendingBadge";

interface HeroSectionProps {
  onStartJourney: () => void;
}

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 1500, delay: number = 0) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    const tick = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      // Easing function for smooth animation
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(target * eased);
      
      if (now < endTime) {
        requestAnimationFrame(tick);
      } else {
        setCount(target);
      }
    };
    
    const timeout = setTimeout(() => {
      requestAnimationFrame(tick);
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [target, duration, delay, started]);

  return { count, start: () => setStarted(true) };
}

export const HeroSection = ({ onStartJourney }: HeroSectionProps) => {
  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight - 100, behavior: "smooth" });
  };

  const cardRef = useRef<HTMLDivElement>(null);
  const isCardInView = useInView(cardRef, { once: true, margin: "-100px" });
  const { count: scoreCount, start: startScoreAnimation } = useAnimatedCounter(8.7, 1500, 800);

  useEffect(() => {
    if (isCardInView) {
      startScoreAnimation();
    }
  }, [isCardInView, startScoreAnimation]);

  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 safe-top overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/50 -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.05),transparent_50%)] -z-10" />
      
      {/* Content */}
      <div className="container max-w-lg lg:max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12">
          {/* Text content */}
          <motion.div 
            className="text-center lg:text-left lg:flex-1"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Canadian badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm font-medium border-primary/30 bg-primary/5">
                🇨🇦 Made for Canadian Entrepreneurs
              </Badge>
            </motion.div>
            
            {/* Main headline */}
            <motion.h1 
              className="font-display text-2xl sm:text-3xl lg:text-5xl font-bold text-foreground leading-tight mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Find Your Perfect Business Idea in{" "}
              <span className="text-accent">10 Minutes</span>
            </motion.h1>
            
            {/* Subheadline */}
            <motion.p 
              className="text-base lg:text-lg text-muted-foreground mb-8 max-w-md mx-auto lg:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              AI-powered business ideas tailored to your skills, budget, and city — with real Canadian market data.
            </motion.p>
            
            {/* CTAs */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Button
                onClick={onStartJourney}
                size="lg"
                className="w-full sm:w-auto h-14 text-lg px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
            
            {/* Trust indicators */}
            <motion.div 
              className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center lg:justify-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <span className="text-sm text-muted-foreground flex items-center justify-center lg:justify-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                50+ Canadian entrepreneurs helped
              </span>
              <span className="text-sm text-muted-foreground flex items-center justify-center lg:justify-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Personalized to YOUR profile
              </span>
              <span className="text-sm text-muted-foreground flex items-center justify-center lg:justify-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Real market data & viability scores
              </span>
            </motion.div>
            
            {/* Secondary link */}
            <motion.div 
              className="mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Link 
                to="/pricing" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
              >
                See Pricing →
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Animated Preview Card */}
          <motion.div 
            ref={cardRef}
            className="hidden lg:flex lg:flex-1 items-center justify-center"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          >
            <Card className="w-full max-w-sm shadow-2xl border-border/50 overflow-hidden">
              <CardHeader className="pb-3">
                {/* Trending Badge */}
                <div className="flex justify-end mb-2">
                  <TrendingBadge type="trending" size="sm" />
                </div>
                
                {/* Category & Risk */}
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    Service
                  </Badge>
                  <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Low Risk
                  </Badge>
                </div>
                
                {/* Title */}
                <h3 className="font-semibold text-lg text-foreground">
                  Mobile Pet Grooming
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Toronto, ON
                </p>
                
                {/* Animated Score */}
                <div className="mt-3">
                  <CanadianMarketFitScore
                    score={scoreCount}
                    size="sm"
                    animated={false}
                    showBreakdown={false}
                  />
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs">Startup Cost</span>
                    </div>
                    <p className="font-semibold text-sm text-foreground">$2,500 - $5,000</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs">Time to Launch</span>
                    </div>
                    <p className="font-semibold text-sm text-foreground">2-4 weeks</p>
                  </div>
                </div>
                
                {/* Quick Win */}
                <div className="mt-3 bg-accent/10 border border-accent/20 rounded-lg p-3">
                  <p className="text-xs text-foreground">
                    <span className="font-medium text-accent">🚀 Start Today:</span> Partner with 3 local dog walkers for referrals
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <button 
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground hover:text-foreground transition-colors animate-[bounce_2s_ease-in-out_infinite]"
        aria-label="Scroll to content"
      >
        <ChevronDown className="w-6 h-6" />
      </button>
    </section>
  );
};
