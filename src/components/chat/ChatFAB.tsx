import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useSessions } from "@/hooks/useSessions";
import { useTrackEvent } from "@/hooks/useTrackEvent";
import { Session } from "@/types/sessions";
import { ChatModal } from "./ChatModal";
import { ResumeSessionDialog } from "@/components/sessions/ResumeSessionDialog";

export const ChatFAB = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { getActiveSession } = useSessions(user?.id);
  const { track } = useTrackEvent();
  const [modalOpen, setModalOpen] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleClick = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    track("chat_opened", { source: "fab" });

    // Check for active session before proceeding
    setIsChecking(true);
    const session = await getActiveSession();
    setIsChecking(false);

    if (session) {
      setActiveSession(session);
      setResumeDialogOpen(true);
    } else {
      openChat();
    }
  };

  const openChat = (sessionId?: string, forceNew?: boolean) => {
    if (isMobile) {
      navigate("/chat", { state: { sessionId, forceNew } });
    } else {
      // For desktop, we still navigate to chat for now
      // Could open modal with session context in future
      navigate("/chat", { state: { sessionId, forceNew } });
    }
  };

  const handleContinue = (session: Session) => {
    track("session_resumed", null, session.id);
    setResumeDialogOpen(false);
    openChat(session.id);
  };

  const handleStartFresh = () => {
    setResumeDialogOpen(false);
    openChat(undefined, true);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isChecking}
        className="fixed z-50 w-14 h-14 rounded-full shadow-lg bg-accent hover:bg-accent/90 text-accent-foreground bottom-20 right-4 md:bottom-6 md:right-6"
        size="icon"
      >
        <Rocket className={`w-6 h-6 ${isChecking ? "animate-pulse" : ""}`} />
      </Button>

      <ChatModal open={modalOpen} onOpenChange={setModalOpen} />

      <ResumeSessionDialog
        open={resumeDialogOpen}
        onOpenChange={setResumeDialogOpen}
        session={activeSession}
        onContinue={handleContinue}
        onStartFresh={handleStartFresh}
      />
    </>
  );
};
