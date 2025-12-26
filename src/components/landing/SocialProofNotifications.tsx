import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Lightbulb, CheckCircle, Rocket, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: "journey" | "ideas" | "quickwin" | "registered" | "stats";
  icon: React.ReactNode;
  emoji: string;
  message: string;
  name?: string;
  city?: string;
}

interface SocialProofNotificationsProps {
  enabled?: boolean;
  interval?: number;
  maxNotifications?: number;
}

const canadianCities = [
  "Toronto", "Vancouver", "Calgary", "Montreal", "Ottawa", 
  "Edmonton", "Winnipeg", "Halifax", "Victoria", "Quebec City",
  "Mississauga", "Hamilton", "Brampton", "Surrey", "Kitchener"
];

const canadianNames = [
  "Sarah", "Mike", "Emily", "David", "Jessica", "Chris", 
  "Amanda", "Ryan", "Lauren", "Matt", "Ashley", "Tyler",
  "Nicole", "Josh", "Megan", "Alex", "Kayla", "Jordan"
];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateFallbackNotification = (index: number): Notification => {
  const name = getRandomItem(canadianNames);
  const city = getRandomItem(canadianCities);
  
  const types: Notification[] = [
    {
      id: `fallback-${index}-journey`,
      type: "journey",
      emoji: "🎉",
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      message: `${name} from ${city} just started their journey!`,
      name,
      city,
    },
    {
      id: `fallback-${index}-ideas`,
      type: "ideas",
      emoji: "💡",
      icon: <Lightbulb className="w-4 h-4 text-yellow-500" />,
      message: `Someone in ${city} just got 5 business ideas!`,
      city,
    },
    {
      id: `fallback-${index}-quickwin`,
      type: "quickwin",
      emoji: "✅",
      icon: <CheckCircle className="w-4 h-4 text-green-500" />,
      message: `${name} from ${city} completed their Quick Win!`,
      name,
      city,
    },
    {
      id: `fallback-${index}-registered`,
      type: "registered",
      emoji: "🚀",
      icon: <Rocket className="w-4 h-4 text-blue-500" />,
      message: "A new Canadian business was just registered!",
    },
    {
      id: `fallback-${index}-stats`,
      type: "stats",
      emoji: "📊",
      icon: <TrendingUp className="w-4 h-4 text-purple-500" />,
      message: `${Math.floor(Math.random() * 20) + 10} entrepreneurs matched in the last hour`,
    },
  ];
  
  return getRandomItem(types);
};

export const SocialProofNotifications = ({
  enabled = true,
  interval = 10000,
  maxNotifications = 4,
}: SocialProofNotificationsProps) => {
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<Notification[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Fetch real events and create notifications
  const fetchRealEvents = useCallback(async () => {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: events } = await supabase
        .from("ft_events")
        .select("event_name, event_data, created_at")
        .gte("created_at", twentyFourHoursAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(20);

      if (!events || events.length === 0) {
        // Generate fallback notifications
        const fallbacks = Array.from({ length: 10 }, (_, i) => 
          generateFallbackNotification(i)
        );
        setNotificationQueue(fallbacks);
        return;
      }

      // Convert real events to notifications
      const notifications: Notification[] = events.map((event, index) => {
        const city = getRandomItem(canadianCities);
        const name = getRandomItem(canadianNames);

        switch (event.event_name) {
          case "chat_opened":
          case "landing_visit":
            return {
              id: `real-${index}`,
              type: "journey" as const,
              emoji: "🎉",
              icon: <Sparkles className="w-4 h-4 text-amber-500" />,
              message: `${name} from ${city} just started their journey!`,
              name,
              city,
            };
          case "ideas_generated":
            return {
              id: `real-${index}`,
              type: "ideas" as const,
              emoji: "💡",
              icon: <Lightbulb className="w-4 h-4 text-yellow-500" />,
              message: `Someone in ${city} just got 5 business ideas!`,
              city,
            };
          case "checkout_paid":
            return {
              id: `real-${index}`,
              type: "registered" as const,
              emoji: "🚀",
              icon: <Rocket className="w-4 h-4 text-blue-500" />,
              message: "A new Canadian business was just registered!",
            };
          default:
            return generateFallbackNotification(index);
        }
      });

      // Shuffle and set queue
      const shuffled = notifications.sort(() => Math.random() - 0.5);
      setNotificationQueue(shuffled);
    } catch (error) {
      console.error("Error fetching events:", error);
      // Use fallback data
      const fallbacks = Array.from({ length: 10 }, (_, i) => 
        generateFallbackNotification(i)
      );
      setNotificationQueue(fallbacks);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchRealEvents();
    }
  }, [enabled, fetchRealEvents]);

  // Show next notification
  const showNextNotification = useCallback(() => {
    if (notificationQueue.length === 0 || isPaused) return;

    const nextNotification = notificationQueue[0];
    setCurrentNotification(nextNotification);
    setIsVisible(true);
    setNotificationCount((prev) => prev + 1);

    // Rotate queue
    setNotificationQueue((prev) => [...prev.slice(1), prev[0]]);

    // Hide after 5 seconds
    setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  }, [notificationQueue, isPaused]);

  // Notification cycle
  useEffect(() => {
    if (!enabled || isPaused) return;

    // Check if we need to pause after max notifications
    if (notificationCount >= maxNotifications) {
      setIsPaused(true);
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setNotificationCount(0);
      }, 120000); // 2 minutes pause
      return () => clearTimeout(pauseTimer);
    }

    // Initial delay before first notification
    const initialDelay = setTimeout(() => {
      showNextNotification();
    }, 3000);

    return () => clearTimeout(initialDelay);
  }, [enabled, isPaused, notificationCount, maxNotifications, showNextNotification]);

  // Interval for subsequent notifications
  useEffect(() => {
    if (!enabled || isPaused || notificationCount === 0) return;

    const intervalTimer = setInterval(() => {
      if (notificationCount < maxNotifications) {
        showNextNotification();
      }
    }, interval + 5000); // 10 second gap + 5 second display = 15 second cycle

    return () => clearInterval(intervalTimer);
  }, [enabled, isPaused, notificationCount, maxNotifications, interval, showNextNotification]);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 pointer-events-none">
      <AnimatePresence>
        {isVisible && currentNotification && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="pointer-events-auto max-w-[300px] bg-card border border-border rounded-lg shadow-lg p-3"
          >
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarFallback className="bg-primary/10 text-lg">
                  {currentNotification.emoji}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-snug">
                  {currentNotification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Just now</p>
              </div>
              <button
                onClick={handleDismiss}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
