import { useState, useRef, useCallback } from "react";
import { BusinessIdea } from "@/types/ideas";
import { IdeaCard } from "./IdeaCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeableCardsProps {
  ideas: BusinessIdea[];
  onToggleFavorite: (id: string) => void;
  onViewDetails: (idea: BusinessIdea) => void;
}

export const SwipeableCards = ({
  ideas,
  onToggleFavorite,
  onViewDetails,
}: SwipeableCardsProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const goToNext = useCallback(() => {
    if (currentIndex < ideas.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, ideas.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    // Only track horizontal movement if it's more horizontal than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setDragOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    const threshold = 80;
    
    if (dragOffset < -threshold && currentIndex < ideas.length - 1) {
      goToNext();
    } else if (dragOffset > threshold && currentIndex > 0) {
      goToPrev();
    }
    
    setIsDragging(false);
    setDragOffset(0);
  };

  // Calculate rotation based on drag
  const getRotation = () => {
    return dragOffset * 0.03; // Subtle rotation during drag
  };

  return (
    <div className="relative px-4">
      {/* Position indicator */}
      <div className="text-center mb-4">
        <span className="text-sm font-medium text-muted-foreground">
          {currentIndex + 1} of {ideas.length}
        </span>
      </div>

      {/* Stacked cards container */}
      <div
        ref={containerRef}
        className="relative h-[520px] w-full max-w-sm mx-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {ideas.map((idea, index) => {
          const offset = index - currentIndex;
          const isActive = index === currentIndex;
          const isNext = offset === 1;
          const isPrev = offset === -1;
          const isVisible = Math.abs(offset) <= 2;

          if (!isVisible) return null;

          // Calculate transform for stacking effect
          let scale = 1;
          let translateY = 0;
          let opacity = 1;
          let zIndex = ideas.length - Math.abs(offset);
          let translateX = 0;

          if (isActive) {
            translateX = isDragging ? dragOffset : 0;
          } else if (isNext) {
            scale = 0.95;
            translateY = 12;
            opacity = 0.7;
          } else if (isPrev) {
            scale = 0.95;
            translateY = 12;
            opacity = 0;
          } else if (offset === 2) {
            scale = 0.9;
            translateY = 24;
            opacity = 0.4;
          } else {
            opacity = 0;
          }

          return (
            <div
              key={idea.id}
              className={cn(
                "absolute inset-0 transition-all",
                isDragging && isActive ? "duration-0" : "duration-300 ease-out"
              )}
              style={{
                transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) rotate(${isActive ? getRotation() : 0}deg)`,
                opacity,
                zIndex,
              }}
            >
              <IdeaCard
                idea={idea}
                onToggleFavorite={() => onToggleFavorite(idea.id)}
                onViewDetails={() => onViewDetails(idea)}
              />
            </div>
          );
        })}
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center gap-2 mt-6">
        {ideas.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300 touch-target",
              index === currentIndex
                ? "bg-primary w-6"
                : "bg-muted-foreground/30 w-2 hover:bg-muted-foreground/50"
            )}
            aria-label={`Go to idea ${index + 1}`}
          />
        ))}
      </div>

      {/* Desktop navigation arrows */}
      <button
        onClick={goToPrev}
        disabled={currentIndex === 0}
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background border border-border items-center justify-center shadow-md disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted transition-colors z-10"
        aria-label="Previous idea"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={goToNext}
        disabled={currentIndex === ideas.length - 1}
        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background border border-border items-center justify-center shadow-md disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted transition-colors z-10"
        aria-label="Next idea"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Swipe hint for mobile */}
      <p className="text-center text-xs text-muted-foreground mt-4 sm:hidden">
        Swipe left or right to browse ideas
      </p>
    </div>
  );
};
