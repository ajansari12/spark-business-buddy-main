import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatContainerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export const ChatContainer = ({
  open,
  children,
}: ChatContainerProps) => {
  const isMobile = useIsMobile();

  // Mobile: Full-screen fixed overlay
  if (isMobile) {
    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col safe-top animate-fade-in">
        {children}
      </div>
    );
  }

  // Desktop: Full-width centered container
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-2xl flex flex-col border-x border-border">
        {children}
      </div>
    </div>
  );
};
