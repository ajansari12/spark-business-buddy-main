import { useState, useRef } from "react";
import { Session } from "@/types/sessions";
import { SessionCard } from "./SessionCard";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface SwipeableSessionCardProps {
  session: Session;
  onAction: (session: Session) => void;
  onDelete: (session: Session) => void;
}

export const SwipeableSessionCard = ({
  session,
  onAction,
  onDelete,
}: SwipeableSessionCardProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    currentX.current = e.touches[0].clientX;
    const diff = startX.current - currentX.current;
    // Only allow left swipe, max 80px
    const newTranslate = Math.min(Math.max(diff, 0), 80);
    setTranslateX(newTranslate);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // Snap to reveal delete or reset
    if (translateX > 40) {
      setTranslateX(80);
    } else {
      setTranslateX(0);
    }
  };

  const handleDeleteClick = () => {
    setTranslateX(0);
    onDelete(session);
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Delete button behind card */}
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-destructive flex items-center justify-center rounded-r-lg">
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive-foreground hover:bg-destructive-foreground/10"
          onClick={handleDeleteClick}
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>

      {/* Swipeable card */}
      <div
        className="relative bg-background transition-transform duration-200 ease-out"
        style={{
          transform: `translateX(-${translateX}px)`,
          transition: isDragging ? "none" : "transform 0.2s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <SessionCard session={session} onAction={onAction} />
      </div>
    </div>
  );
};
