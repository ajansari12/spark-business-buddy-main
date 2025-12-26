import { useEffect, useRef, useCallback, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useChatSession } from "@/hooks/useChatSession";
import { useAnalytics } from "@/hooks/useEnhancedAnalytics";
import { useExperiments } from "@/hooks/useExperiments";
import { EnhancedProgressBar } from "@/components/chat/EnhancedProgressBar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatError } from "@/components/chat/ChatError";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { TrendingBusinesses } from "@/components/chat/TrendingBusinesses";
import { QuickPreview } from "@/components/chat/QuickPreview";
import { Rocket, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FTExtractedData } from "@/types/chat";
import { Button } from "@/components/ui/button";

interface LocationState {
  sessionId?: string;
  forceNew?: boolean;
}

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading: authLoading } = useAuth();
  const { track, trackPageView, startTiming, trackTiming } = useAnalytics();
  const { isFeatureEnabled, trackConversion } = useExperiments();
  
  // Get session options from navigation state
  const state = location.state as LocationState | null;
  const sessionIdFromState = state?.sessionId;
  const forceNew = state?.forceNew;

  const {
    sessionId,
    messages,
    isLoading,
    isInitializing,
    currentMeta,
    error,
    sendMessage,
    resetSession,
  } = useChatSession({ 
    userId: user?.id, 
    sessionId: sessionIdFromState,
    forceNew,
    profile  // Pass profile for personalized greeting
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProgressRef = useRef<number>(0);
  const [showTrending, setShowTrending] = useState(false);
  const [trendingDismissed, setTrendingDismissed] = useState(false);
  const [showQuickPreview, setShowQuickPreview] = useState(false);
  const [quickPreviewDismissed, setQuickPreviewDismissed] = useState(false);
  const [isNavigatingToResults, setIsNavigatingToResults] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Track intake completion and show special UI based on signals
  useEffect(() => {
    if (currentMeta.progress === 100 && lastProgressRef.current < 100) {
      track("intake_completed", null, sessionId);
    }
    
    // Show quick preview after initial questions (province + skills collected)
    if (currentMeta.signal === "SHOW_QUICK_PREVIEW" && !quickPreviewDismissed) {
      setShowQuickPreview(true);
      track("quick_preview_shown", null, sessionId);
    }
    
    // Show trending when signal is SHOW_TRENDING and not dismissed
    if (currentMeta.signal === "SHOW_TRENDING" && !trendingDismissed) {
      setShowTrending(true);
    }
    
    lastProgressRef.current = currentMeta.progress;
  }, [currentMeta.progress, currentMeta.signal, sessionId, track, trendingDismissed, quickPreviewDismissed]);

  // Auto-navigate to results when READY_TO_PAY signal is received
  useEffect(() => {
    if (currentMeta.signal === "READY_TO_PAY" && !isLoading && sessionId && !isNavigatingToResults) {
      setIsNavigatingToResults(true);
      track("checkout_started", null, sessionId);
      
      const navigateToResults = async () => {
        // Brief delay to show the loading transition
        await new Promise(resolve => setTimeout(resolve, 800));
        
        let extractedData = currentMeta.extracted;
        const hasMinimumData = extractedData?.city || extractedData?.province || extractedData?.skills_background;
        
        if (!hasMinimumData) {
          const { data: sessionData } = await supabase
            .from("ft_sessions")
            .select("collected_data")
            .eq("id", sessionId)
            .maybeSingle();
          
          if (sessionData?.collected_data) {
            extractedData = sessionData.collected_data as unknown as FTExtractedData;
          }
        }
        
        navigate("/results", { state: { sessionId, extractedData } });
      };
      
      navigateToResults();
    }
  }, [currentMeta.signal, isLoading, sessionId, currentMeta.extracted, navigate, track, isNavigatingToResults]);

  // Handle sending messages with tracking
  const handleSendMessage = useCallback((content: string) => {
    track("chat_message_sent", null, sessionId);
    setShowTrending(false);
    setShowQuickPreview(false);
    sendMessage(content);
  }, [sendMessage, sessionId, track]);

  // Handle continuing from quick preview
  const handleContinueFromPreview = useCallback(() => {
    track("quick_preview_continued", null, sessionId);
    setShowQuickPreview(false);
    setQuickPreviewDismissed(true);
  }, [sessionId, track]);

  // Handle selecting a trending business (receives full object now)
  const handleSelectTrending = useCallback((business: { 
    business_type: string; 
    trend_reason: string;
    estimated_cost_min: number;
    estimated_cost_max: number;
    growth_potential: "High" | "Medium" | "Moderate";
    time_to_launch: string;
    why_trending?: string;
  }) => {
    track("trending_business_selected", { businessType: business.business_type }, sessionId);
    setShowTrending(false);
    setTrendingDismissed(true);
    // Send the selected business type as the user's message with full business object in context
    // The message includes a marker that the edge function can detect to store the full object
    sendMessage(`I'm interested in starting a ${business.business_type} business [SELECTED_TRENDING:${JSON.stringify(business)}]`);
  }, [sendMessage, sessionId, track]);

  // Handle skipping trending suggestions
  const handleSkipTrending = useCallback(() => {
    track("trending_skipped", null, sessionId);
    setShowTrending(false);
    setTrendingDismissed(true);
  }, [sessionId, track]);

  // Handle READY_TO_PAY signal - navigate to results (bypassing payment for now)
  const handleUnlockIdeas = useCallback(async () => {
    track("checkout_started", null, sessionId);
    
    // Ensure we have full collected_data - fetch from session if currentMeta.extracted is incomplete
    let extractedData = currentMeta.extracted;
    const hasMinimumData = extractedData?.city || extractedData?.province || extractedData?.skills_background;
    
    if (!hasMinimumData && sessionId) {
      const { data: sessionData } = await supabase
        .from("ft_sessions")
        .select("collected_data")
        .eq("id", sessionId)
        .maybeSingle();
      
      if (sessionData?.collected_data) {
        extractedData = sessionData.collected_data as unknown as FTExtractedData;
      }
    }
    
    navigate("/results", { state: { sessionId, extractedData } });
  }, [currentMeta.extracted, sessionId, track, navigate]);

  const handleBack = () => {
    navigate("/app/sessions");
  };

  const handleSaveExit = () => {
    // Session is auto-saved, just navigate away
    navigate("/app/sessions");
  };

  const handleStartOver = async () => {
    await resetSession();
  };

  // Show loading overlay when navigating to results
  if (isNavigatingToResults) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background animate-fade-in">
        <div className="relative">
          <Sparkles className="w-12 h-12 text-primary animate-pulse" />
          <div className="absolute inset-0 w-12 h-12 bg-primary/20 rounded-full animate-ping" />
        </div>
        <p className="mt-6 text-lg font-medium text-foreground">Preparing your ideas...</p>
        <p className="mt-2 text-sm text-muted-foreground">This will only take a moment</p>
      </div>
    );
  }

  if (authLoading || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Rocket className="w-8 h-8 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <ChatContainer open={true} onOpenChange={(open) => !open && handleBack()}>
      {/* Header */}
      <ChatHeader
        onBack={handleBack}
        onSaveExit={handleSaveExit}
        onStartOver={handleStartOver}
        isTyping={isLoading}
      />

      {/* Progress bar */}
      <EnhancedProgressBar 
        progress={currentMeta.progress} 
        collectedData={currentMeta.extracted as Record<string, unknown>}
        className="px-4 py-3 border-b border-border"
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message, index) => (
          <MessageBubble key={message.id} message={message} index={index} />
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <TypingIndicator />
        )}
        {error && <ChatError type={error.type} onRetry={error.retryFn} />}
        <div ref={messagesEndRef} />
      </div>

      {/* View Ideas button - fallback when progress is high enough */}
      {currentMeta.progress >= 85 && 
       currentMeta.extracted?.income_goal && 
       currentMeta.extracted?.city && 
       !isNavigatingToResults && (
        <div className="px-4 py-3 border-t border-border bg-background/80 backdrop-blur-sm">
          <Button 
            onClick={handleUnlockIdeas}
            className="w-full"
            size="lg"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            View My Business Ideas
          </Button>
        </div>
      )}

      {/* Input area */}
      {showQuickPreview && currentMeta.extracted ? (
        <QuickPreview
          province={currentMeta.extracted.province || "Ontario"}
          city={currentMeta.extracted.city || undefined}
          skillsBackground={currentMeta.extracted.skills_background || undefined}
          onContinue={handleContinueFromPreview}
        />
      ) : showTrending && currentMeta.extracted ? (
        <TrendingBusinesses
          budgetMin={currentMeta.extracted.budget_min || 5000}
          budgetMax={currentMeta.extracted.budget_max || 50000}
          province={currentMeta.extracted.province || "Ontario"}
          city={currentMeta.extracted.city || undefined}
          skillsBackground={currentMeta.extracted.skills_background || undefined}
          onSelect={handleSelectTrending}
          onSkip={handleSkipTrending}
        />
      ) : (
        <ChatInput
          nextQuestion={currentMeta.next_question}
          onSend={handleSendMessage}
          disabled={isLoading}
        />
      )}
    </ChatContainer>
  );
};

export default Chat;
