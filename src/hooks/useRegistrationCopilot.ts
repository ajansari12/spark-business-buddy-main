import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CopilotMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: string[];
}

interface UseRegistrationCopilotOptions {
  ideaId: string;
  province?: string;
  businessStructure?: string;
}

export function useRegistrationCopilot({
  ideaId,
  province,
  businessStructure,
}: UseRegistrationCopilotOptions) {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askQuestion = useCallback(
    async (question: string, currentStep?: string) => {
      if (!question.trim() || isLoading) return;

      setIsLoading(true);
      setError(null);

      // Add user message immediately for UI responsiveness
      const userMessage: CopilotMessage = {
        role: "user",
        content: question,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "ft_registration_copilot",
          {
            body: {
              idea_id: ideaId,
              question,
              context: {
                province,
                business_structure: businessStructure,
                current_step: currentStep,
              },
            },
          }
        );

        if (fnError) throw fnError;

        if (data?.error) {
          setError(data.error);
          // Remove the user message if there was an error
          setMessages((prev) => prev.slice(0, -1));
          return;
        }

        const assistantMessage: CopilotMessage = {
          role: "assistant",
          content: data.answer,
          timestamp: new Date().toISOString(),
          sources: data.sources,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        console.error("Copilot error:", err);
        setError(err instanceof Error ? err.message : "Failed to get answer");
        // Remove the user message if there was an error
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [ideaId, province, businessStructure, isLoading]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    askQuestion,
    clearMessages,
  };
}
