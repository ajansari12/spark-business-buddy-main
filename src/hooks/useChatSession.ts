import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage, FTMeta, FTExtractedData, ChatApiResponse, getDefaultFTMeta } from "@/types/chat";
import { toast } from "sonner";
import { savePendingMessage, getPendingMessages, deletePendingMessage } from "@/lib/offlineStorage";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ft_chat`;

interface UseChatSessionOptions {
  userId?: string;
  sessionId?: string | null; // Explicit session ID for resume
  forceNew?: boolean; // Force create new session
  profile?: { 
    province?: string | null; 
    city?: string | null; 
    full_name?: string | null;
  } | null;
}

// Helper to get full extracted data with defaults
const getFullExtractedData = (partial: Partial<FTExtractedData>): FTExtractedData => ({
  city: partial.city ?? null,
  province: partial.province ?? null,
  skills_background: partial.skills_background ?? null,
  interests: partial.interests ?? null,
  time_commitment_hours: partial.time_commitment_hours ?? null,
  budget_min: partial.budget_min ?? null,
  budget_max: partial.budget_max ?? null,
  income_goal: partial.income_goal ?? null,
  constraints: partial.constraints ?? null,
  preferred_industries: partial.preferred_industries ?? [],
});

export const useChatSession = ({ userId, sessionId: explicitSessionId, forceNew, profile }: UseChatSessionOptions = {}) => {
  const [sessionId, setSessionId] = useState<string | null>(explicitSessionId ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentMeta, setCurrentMeta] = useState<FTMeta>(getDefaultFTMeta());
  const [error, setError] = useState<{ type: "network" | "rate_limit"; retryFn?: () => void } | null>(null);
  const hasInitialized = useRef(false);

  // Get auth token for API calls
  const getAuthToken = async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  // Generate a welcome message based on profile data (client-side, no server call)
  const generateWelcomeMessage = useCallback((sessionProgress: number = 0): ChatMessage => {
    const hasLocation = profile?.city && profile?.province;
    
    if (hasLocation) {
      // User has completed onboarding with location - skip to skills
      return {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Hey! 👋 I'm FastTrack, here to help you discover business ideas that fit your life.\n\nI see you're in ${profile.city}, ${profile.province} – great market with lots of opportunity!\n\nLet's find the right business for you. What's your background – skills, work experience, or education?`,
        timestamp: new Date(),
        ftMeta: {
          extracted: { 
            province: profile.province, 
            city: profile.city 
          },
          progress: sessionProgress || 15,
          next_question: { 
            type: "text", 
            prompt: "e.g., sales, marketing, trades, tech..." 
          },
          signal: "CONTINUE"
        }
      };
    }
    
    // No location data - start with province question
    return {
      id: crypto.randomUUID(),
      role: "assistant", 
      content: `Hey! 👋 I'm FastTrack, here to help you discover business ideas that fit your life.\n\nLet's start simple – which province are you in?`,
      timestamp: new Date(),
      ftMeta: {
        extracted: {},
        progress: sessionProgress || 0,
        next_question: {
          type: "select",
          prompt: "Select your province",
          options: ["Ontario", "Quebec", "British Columbia", "Alberta", "Manitoba", "Saskatchewan", "Nova Scotia", "New Brunswick", "Newfoundland and Labrador", "Prince Edward Island", "Northwest Territories", "Yukon", "Nunavut"]
        },
        signal: "CONTINUE"
      }
    };
  }, [profile]);

  // Check for existing session or create new one
  const initializeSession = useCallback(async () => {
    if (!userId || hasInitialized.current) return;
    hasInitialized.current = true;
    setIsInitializing(true);

    try {
      // If explicit session ID provided, load that session
      if (explicitSessionId && !forceNew) {
        const { data: explicitSession, error: explicitError } = await supabase
          .from("ft_sessions")
          .select("*")
          .eq("id", explicitSessionId)
          .eq("user_id", userId)
          .single();

        if (!explicitError && explicitSession) {
          setSessionId(explicitSession.id);
          const collectedData = explicitSession.collected_data as unknown as Partial<FTExtractedData> | null;
          if (collectedData) {
            setCurrentMeta((prev) => ({
              ...prev,
              progress: explicitSession.progress,
              extracted: collectedData,
            }));
          }

          // Load existing messages
          const { data: existingMessages } = await supabase
            .from("ft_messages")
            .select("*")
            .eq("session_id", explicitSession.id)
            .order("created_at", { ascending: true });

          if (existingMessages && existingMessages.length > 0) {
            const loadedMessages: ChatMessage[] = existingMessages.map((msg) => ({
              id: msg.id,
              role: msg.role as "user" | "assistant",
              content: msg.content,
              timestamp: new Date(msg.created_at),
              ftMeta: msg.meta as unknown as FTMeta | undefined,
            }));
            setMessages(loadedMessages);

            const lastAssistantMsg = [...loadedMessages].reverse().find((m) => m.role === "assistant" && m.ftMeta);
            if (lastAssistantMsg?.ftMeta) {
              // CRITICAL: Validate signal against actual data
              // Historical messages may have stale READY_TO_PAY from before fix
              let validatedSignal = lastAssistantMsg.ftMeta.signal;
              
              if (validatedSignal === "READY_TO_PAY" && !(collectedData as Record<string, unknown>)?.user_confirmed) {
                console.warn("useChatSession: Stale READY_TO_PAY signal found (explicit session), user_confirmed is missing - correcting to CONTINUE");
                validatedSignal = "CONTINUE";
                
                // Also correct session status in database if it's stale
                if (explicitSession.status === "ready_to_pay") {
                  console.warn("useChatSession: Correcting stale session status to 'intake'");
                  supabase
                    .from("ft_sessions")
                    .update({ status: "intake" })
                    .eq("id", explicitSession.id)
                    .then(() => console.log("Session status corrected to intake"));
                }
              }
              
              // ADDITIONAL: Validate next_question makes sense with message content
              // Historical messages may have stale confirm type when AI actually asked a question
              let validatedNextQuestion = lastAssistantMsg.ftMeta.next_question;
              const messageContent = lastAssistantMsg.content || "";
              
              if (validatedNextQuestion?.type === "confirm" && messageContent.includes("?")) {
                console.warn("useChatSession: Stale confirm type found but message asks a question - correcting to text input");
                validatedNextQuestion = { type: "text", prompt: "Your answer" };
              }
              
              // Preserve full collected_data from session, not just last message's extraction
              setCurrentMeta({
                ...lastAssistantMsg.ftMeta,
                signal: validatedSignal,
                next_question: validatedNextQuestion,
                extracted: collectedData || lastAssistantMsg.ftMeta.extracted,
              });
            }
          } else {
            // Session exists but no messages - generate welcome client-side
            const sessionProgress = explicitSession?.progress || 0;
            const welcomeMsg = generateWelcomeMessage(sessionProgress);
            setMessages([welcomeMsg]);
            setCurrentMeta(welcomeMsg.ftMeta!);
          }
          setIsInitializing(false);
          return;
        }
      }

      // If forceNew, skip checking for existing session
      if (forceNew) {
        const { data: newSession, error: createError } = await supabase
          .from("ft_sessions")
          .insert({ user_id: userId })
          .select()
          .single();

        if (createError) {
          console.error("Error creating session:", createError);
          toast.error("Failed to create session");
          setIsInitializing(false);
          return;
        }

        setSessionId(newSession.id);
        // Generate welcome message client-side (no fake user message)
        const welcomeMsg = generateWelcomeMessage(0);
        setMessages([welcomeMsg]);
        setCurrentMeta(welcomeMsg.ftMeta!);
        setIsInitializing(false);
        return;
      }

      // Check for existing in-progress session
      const { data: existingSession, error: fetchError } = await supabase
        .from("ft_sessions")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["intake", "ready_to_pay"])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching session:", fetchError);
      }

      if (existingSession) {
        setSessionId(existingSession.id);
        const collectedData = existingSession.collected_data as unknown as Partial<FTExtractedData> | null;
        if (collectedData) {
          setCurrentMeta((prev) => ({
            ...prev,
            progress: existingSession.progress,
            extracted: collectedData,
          }));
        }

        // Load existing messages
        const { data: existingMessages } = await supabase
          .from("ft_messages")
          .select("*")
          .eq("session_id", existingSession.id)
          .order("created_at", { ascending: true });

        if (existingMessages && existingMessages.length > 0) {
          const loadedMessages: ChatMessage[] = existingMessages.map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            timestamp: new Date(msg.created_at),
            ftMeta: msg.meta as unknown as FTMeta | undefined,
          }));
          setMessages(loadedMessages);

          // Get latest meta from last assistant message, but preserve full collected_data
          const lastAssistantMsg = [...loadedMessages].reverse().find((m) => m.role === "assistant" && m.ftMeta);
          if (lastAssistantMsg?.ftMeta) {
            // CRITICAL: Validate signal against actual data
            // Historical messages may have stale READY_TO_PAY from before fix
            let validatedSignal = lastAssistantMsg.ftMeta.signal;
            
            if (validatedSignal === "READY_TO_PAY" && !(collectedData as Record<string, unknown>)?.user_confirmed) {
              console.warn("useChatSession: Stale READY_TO_PAY signal found (existing session), user_confirmed is missing - correcting to CONTINUE");
              validatedSignal = "CONTINUE";
              
              // Also correct session status in database if it's stale
              if (existingSession.status === "ready_to_pay") {
                console.warn("useChatSession: Correcting stale session status to 'intake'");
                supabase
                  .from("ft_sessions")
                  .update({ status: "intake" })
                  .eq("id", existingSession.id)
                  .then(() => console.log("Session status corrected to intake"));
              }
            }
            
            // ADDITIONAL: Validate next_question makes sense with message content
            // Historical messages may have stale confirm type when AI actually asked a question
            let validatedNextQuestion = lastAssistantMsg.ftMeta.next_question;
            const messageContent = lastAssistantMsg.content || "";
            
            if (validatedNextQuestion?.type === "confirm" && messageContent.includes("?")) {
              console.warn("useChatSession: Stale confirm type found but message asks a question - correcting to text input");
              validatedNextQuestion = { type: "text", prompt: "Your answer" };
            }
            
            setCurrentMeta({
              ...lastAssistantMsg.ftMeta,
              signal: validatedSignal,
              next_question: validatedNextQuestion,
              extracted: collectedData || lastAssistantMsg.ftMeta.extracted,
            });
          }
        } else {
          // Session exists but no messages - generate welcome client-side
          const sessionProgress = existingSession?.progress || 0;
          const welcomeMsg = generateWelcomeMessage(sessionProgress);
          setMessages([welcomeMsg]);
          setCurrentMeta(welcomeMsg.ftMeta!);
        }
      } else {
        // Create new session
        const { data: newSession, error: createError } = await supabase
          .from("ft_sessions")
          .insert({ user_id: userId })
          .select()
          .single();

        if (createError) {
          console.error("Error creating session:", createError);
          toast.error("Failed to create session");
          setIsInitializing(false);
          return;
        }

        setSessionId(newSession.id);
        // Generate welcome message client-side (no fake user message)
        const welcomeMsg = generateWelcomeMessage(0);
        setMessages([welcomeMsg]);
        setCurrentMeta(welcomeMsg.ftMeta!);
      }
    } catch (err) {
      console.error("Session initialization error:", err);
      toast.error("Failed to initialize chat");
    } finally {
      setIsInitializing(false);
    }
  }, [userId, explicitSessionId, forceNew, generateWelcomeMessage]);

  useEffect(() => {
    if (userId) {
      initializeSession();
    }
  }, [userId, initializeSession]);

  const sendMessage = useCallback(async (content: string) => {
    if (!sessionId) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    // Check if offline
    if (!navigator.onLine) {
      // Queue message for later
      await savePendingMessage(sessionId, content);
      setMessages((prev) => [...prev, { ...userMessage, pending: true } as ChatMessage]);
      toast.info("Message saved. Will send when online.");
      return;
    }

    // Optimistically add user message
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        toast.error("Please log in to continue");
        setIsLoading(false);
        return;
      }

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_message: content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          setError({ type: "rate_limit" });
          toast.error("Rate limit reached. Please wait a moment.");
        } else if (response.status === 402) {
          toast.error("AI credits exhausted.");
        } else {
          setError({ type: "network", retryFn: () => sendMessage(content) });
          toast.error(errorData.error || "Failed to send message");
        }
        setIsLoading(false);
        return;
      }

      const data: ChatApiResponse = await response.json();

      // Pattern detection: Force READY_TO_PAY if message indicates ideas are being generated
      const isGeneratingMessage = (text: string): boolean => {
        const patterns = [
          /ideas are being crafted/i,
          /generating your.*ideas/i,
          /crafting your.*ideas/i,
          /preparing your.*results/i,
          /business ideas are being.*right now/i,
          /let me generate/i,
          /I'll.*generate.*ideas/i,
          /personalized.*ideas.*on the way/i,
        ];
        return patterns.some(p => p.test(text));
      };

      let meta = data.ft_meta;
      if (isGeneratingMessage(data.text) && meta.signal !== "READY_TO_PAY") {
        console.log("useChatSession: Detected generating message, forcing READY_TO_PAY signal");
        meta = { ...meta, signal: "READY_TO_PAY", progress: 100 };
      }

      // Add assistant message (server already persisted)
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.text,
        timestamp: new Date(),
        ftMeta: meta,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setCurrentMeta(meta);
    } catch (err) {
      console.error("Error sending message:", err);
      // If network error, queue message for later
      if (!navigator.onLine) {
        await savePendingMessage(sessionId, content);
        toast.info("Message queued. Will send when online.");
      } else {
        setError({ type: "network", retryFn: () => sendMessage(content) });
        toast.error("Failed to send message. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Sync pending messages when coming back online
  const syncPendingMessages = useCallback(async () => {
    if (!sessionId) return;
    
    const pending = await getPendingMessages();
    if (pending.length === 0) return;

    toast.info("Syncing pending messages...");
    
    for (const msg of pending) {
      if (msg.sessionId !== sessionId) continue;
      
      try {
        const token = await getAuthToken();
        if (!token) continue;

        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            session_id: sessionId,
            user_message: msg.content,
          }),
        });

        if (response.ok) {
          await deletePendingMessage(msg.id);
          const data: ChatApiResponse = await response.json();
          
          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.text,
            timestamp: new Date(),
            ftMeta: data.ft_meta,
          };

          setMessages((prev) => [...prev, assistantMessage]);
          setCurrentMeta(data.ft_meta);
        }
      } catch (err) {
        console.error("Failed to sync message:", err);
      }
    }
    
    toast.success("Messages synced!");
  }, [sessionId]);

  // Listen for online event to sync
  useEffect(() => {
    const handleOnline = () => {
      syncPendingMessages();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncPendingMessages]);

  const resetSession = useCallback(async () => {
    if (!userId) return;

    setMessages([]);
    setCurrentMeta(getDefaultFTMeta());
    hasInitialized.current = false;

    // Create new session
    const { data: newSession, error: createError } = await supabase
      .from("ft_sessions")
      .insert({ user_id: userId })
      .select()
      .single();

    if (createError) {
      console.error("Error creating session:", createError);
      toast.error("Failed to start new session");
      return;
    }

    setSessionId(newSession.id);
    // Generate welcome message client-side (no fake user message)
    const welcomeMsg = generateWelcomeMessage(0);
    setMessages([welcomeMsg]);
    setCurrentMeta(welcomeMsg.ftMeta!);
  }, [userId, generateWelcomeMessage]);

  return {
    sessionId,
    messages,
    isLoading,
    isInitializing,
    currentMeta,
    error,
    sendMessage,
    resetSession,
  };
};
