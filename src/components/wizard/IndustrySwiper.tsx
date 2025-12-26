import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  DollarSign,
  Users
} from "lucide-react";
import { industries, Industry } from "@/data/industries";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";

interface IndustrySwiperProps {
  onComplete: (selectedIndustries: string[]) => void;
  initialSelections?: string[];
}

export const IndustrySwiper = ({
  onComplete,
  initialSelections = []
}: IndustrySwiperProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(initialSelections);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const currentIndustry = industries[currentIndex];
  const progress = ((currentIndex + 1) / industries.length) * 100;
  const isLastCard = currentIndex >= industries.length - 1;

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      setSwipeDirection(direction);

      if (direction === "right") {
        // Add to selected industries
        setSelectedIndustries(prev => [...prev, currentIndustry.id]);
      }

      // Move to next card after animation
      setTimeout(() => {
        if (currentIndex < industries.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setSwipeDirection(null);
        }
      }, 300);
    },
    [currentIndex, currentIndustry]
  );

  const handleDragEnd = (_event: any, info: PanInfo) => {
    const threshold = 100;

    if (info.offset.x > threshold) {
      handleSwipe("right");
    } else if (info.offset.x < -threshold) {
      handleSwipe("left");
    }
  };

  const handleSkip = () => {
    if (selectedIndustries.length > 0) {
      onComplete(selectedIndustries);
    }
  };

  const handleContinue = () => {
    onComplete(selectedIndustries);
  };

  if (isLastCard && swipeDirection) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Sparkles className="w-20 h-20 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">
            Perfect! We've got {selectedIndustries.length} matches
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Ready to customize your business preferences
          </p>
          <Button size="lg" onClick={handleContinue} className="px-12 py-6 text-lg">
            Continue to Next Step
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            What interests you?
          </h1>
          <p className="text-muted-foreground">
            Swipe right ➡️ if interested, left ⬅️ to pass
          </p>
        </motion.div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {currentIndex + 1} / {industries.length}
          </span>
          <Badge variant="outline">
            {selectedIndustries.length} selected
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Card Stack Container */}
      <div className="relative h-[600px] mb-6">
        {/* Next card preview (behind) */}
        {currentIndex < industries.length - 1 && (
          <Card className="absolute inset-0 top-4 scale-95 opacity-50">
            <CardContent className="p-0">
              <div className="h-full bg-gradient-to-br from-muted to-background" />
            </CardContent>
          </Card>
        )}

        {/* Current card */}
        <motion.div
          className="absolute inset-0"
          style={{ x, rotate, opacity }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          animate={
            swipeDirection
              ? {
                  x: swipeDirection === "right" ? 500 : -500,
                  opacity: 0,
                  transition: { duration: 0.3 }
                }
              : {}
          }
        >
          <Card className="h-full shadow-2xl cursor-grab active:cursor-grabbing">
            <CardContent className="p-0 h-full relative overflow-hidden">
              {/* Hero Image with Gradient */}
              <div
                className="relative h-2/3"
                style={{ background: currentIndustry.heroImage }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-9xl">{currentIndustry.emoji}</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Swipe indicators */}
                <motion.div
                  className="absolute top-8 left-8"
                  style={{
                    opacity: useTransform(x, [0, 100], [0, 1])
                  }}
                >
                  <Badge className="bg-green-500 text-white text-xl px-6 py-2 rotate-12">
                    INTERESTED ✨
                  </Badge>
                </motion.div>

                <motion.div
                  className="absolute top-8 right-8"
                  style={{
                    opacity: useTransform(x, [-100, 0], [1, 0])
                  }}
                >
                  <Badge className="bg-red-500 text-white text-xl px-6 py-2 -rotate-12">
                    PASS 👎
                  </Badge>
                </motion.div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{currentIndustry.name}</h2>
                  <p className="text-muted-foreground">{currentIndustry.description}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Startup Cost</p>
                      <p className="font-semibold text-sm">{currentIndustry.avgStartupCost}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Growth</p>
                      <p className="font-semibold text-sm">{currentIndustry.growthRate}%/year</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Time to Launch</p>
                      <p className="font-semibold text-sm">{currentIndustry.timeToLaunch}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Competition</p>
                      <p className="font-semibold text-sm">{currentIndustry.competition}</p>
                    </div>
                  </div>
                </div>

                {/* Examples */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {currentIndustry.examples.slice(0, 3).map((example) => (
                      <Badge key={example} variant="secondary" className="text-xs">
                        {example}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Demand Score */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Market Demand:</span>
                  <div className="flex gap-1">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-2 h-6 rounded-sm",
                          i < currentIndustry.demandScore
                            ? "bg-primary"
                            : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold">{currentIndustry.demandScore}/10</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button
          size="lg"
          variant="outline"
          onClick={() => handleSwipe("left")}
          className="w-24 h-24 rounded-full"
        >
          <ThumbsDown className="w-8 h-8 text-red-500" />
        </Button>

        <Button
          size="lg"
          onClick={() => handleSwipe("right")}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80"
        >
          <ThumbsUp className="w-8 h-8" />
        </Button>
      </div>

      {/* Skip Button */}
      {selectedIndustries.length >= 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-6"
        >
          <Button variant="ghost" onClick={handleSkip}>
            Skip to next step ({selectedIndustries.length} selected)
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};
