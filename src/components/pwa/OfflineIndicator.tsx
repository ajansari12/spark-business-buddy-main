import { useEffect, useState } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { WifiOff, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

export const OfflineIndicator = () => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setIsVisible(true);
      setShowBackOnline(false);
    } else if (wasOffline && isOnline) {
      setShowBackOnline(true);
      setIsVisible(true);
      
      // Hide "back online" after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setShowBackOnline(false), 300);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!isVisible && !showBackOnline && isOnline) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 safe-top",
        isOnline
          ? "bg-green-600 text-white"
          : "bg-destructive text-destructive-foreground",
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>You're back online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>You're offline</span>
        </>
      )}
    </div>
  );
};
