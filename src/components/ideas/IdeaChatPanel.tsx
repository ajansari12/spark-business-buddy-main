import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Loader2,
  HelpCircle,
  Lightbulb,
  Scale,
  RefreshCw,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { BusinessIdeaDisplay } from "@/types/ideas-enhanced";
import { useAnalytics } from "@/hooks/useEnhancedAnalytics";
import { useExperiments } from "@/hooks/useExperiments";

interface IdeaChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface IdeaChatPanelProps {
  sessionId: string;
  ideas: BusinessIdeaDisplay[];
  userProfile?: {
    skills_background?: string;
    budget_min?: number;
    budget_max?: number;
    city?: string;
    province?: string;
  };
  className?: string;
}

// Default questions
const DEFAULT_QUESTIONS = [
  { icon: <HelpCircle className="w-4 h-4" />, text: "Why didn't you suggest a food truck?" },
  { icon: <Scale className="w-4 h-4" />, text: "Compare idea #1 and #2 for me" },
  { icon: <Lightbulb className="w-4 h-4" />, text: "What if I had more budget?" },
  { icon: <RefreshCw className="w-4 h-4" />, text: "Show me a lower-risk option" },
];

// Comparison-focused questions for A/B testing
const COMPARISON_QUESTIONS = [
  { icon: <Scale className="w-4 h-4" />, text: "Which idea has the best ROI?" },
  { icon: <TrendingUp className="w-4 h-4" />, text: "Compare all 3 ideas side by side" },
  { icon: <DollarSign className="w-4 h-4" />, text: "Which idea needs the least startup capital?" },
  { icon: <Lightbulb className="w-4 h-4" />, text: "Which idea scales best long-term?" },
];

// Categorize questions for analytics
const categorizeQuestion = (text: string): string => {
  const lower = text.toLowerCase();
  if (lower.includes("compare") || lower.includes("vs") || lower.includes("versus")) return "comparison";
  if (lower.includes("why") || lower.includes("didn't")) return "explanation";
  if (lower.includes("what if") || lower.includes("more budget") || lower.includes("less time")) return "scenario";
  if (lower.includes("risk") || lower.includes("safe")) return "risk";
  return "general";
};

export const IdeaChatPanel = ({
  sessionId,
  ideas,
  userProfile,
  className,
}: IdeaChatPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<IdeaChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Analytics and experiments
  const { track } = useAnalytics();
  const { getExperiment } = useExperiments();
  
  // Get experiment variant for suggested questions
  const experimentVariant = getExperiment("idea_chat_suggestions");
  
  // Select questions based on experiment variant
  const suggestedQuestions = useMemo(() => {
    if (experimentVariant?.variant === "comparison_focused") {
      return COMPARISON_QUESTIONS;
    }
    return DEFAULT_QUESTIONS;
  }, [experimentVariant]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when sheet opens and track analytics
  useEffect(() => {
    if (isOpen) {
      track("idea_chat_opened", { idea_count: ideas.length }, sessionId);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, track, ideas.length, sessionId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const questionCategory = categorizeQuestion(content);
      
      // Track message sent
      track("idea_question_asked", { 
        question_type: questionCategory,
        message_length: content.length,
        messages_count: messages.length,
      }, sessionId);

      const userMessage: IdeaChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        // Build context about the ideas for the AI
        const ideasContext = ideas
          .map(
            (idea, i) =>
              `Idea ${i + 1}: ${idea.name}
- Category: ${idea.category}
- Viability: ${idea.viabilityScore}/10
- Startup Cost: ${idea.startupCost || "N/A"}
- Monthly Revenue: ${idea.monthlyRevenuePotential || "N/A"}
- Why it fits: ${idea.whyItFits || "N/A"}`
          )
          .join("\n\n");

        const userContext = userProfile
          ? `User Profile:
- Location: ${userProfile.city || "N/A"}, ${userProfile.province || "N/A"}
- Skills: ${userProfile.skills_background || "N/A"}
- Budget: $${userProfile.budget_min?.toLocaleString() || "N/A"} - $${userProfile.budget_max?.toLocaleString() || "N/A"}`
          : "";

        // Call the idea chat function
        const { data, error } = await supabase.functions.invoke("ft_idea_chat", {
          body: {
            session_id: sessionId,
            question: content,
            ideas_context: ideasContext,
            user_context: userContext,
            conversation_history: messages.slice(-6).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          },
        });

        if (error) throw error;

        const assistantMessage: IdeaChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer || "I'm sorry, I couldn't process that question. Please try again.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        
        // Track successful response
        // Response received - track as part of question flow
      } catch (err) {
        console.error("Idea chat error:", err);
        // Track error as part of chat flow

        // Provide fallback response
        const fallbackMessage: IdeaChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "I'm having trouble connecting right now. Please try again in a moment, or explore the idea details above for more information.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, fallbackMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, ideas, userProfile, messages, isLoading, track]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    track("idea_question_suggested_clicked", { suggestion_text: suggestion }, sessionId);
    sendMessage(suggestion);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2", className)}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Questions about your ideas?</span>
          <span className="sm:hidden">Ask</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:w-[400px] flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Bot className="w-5 h-5 text-primary" />
            Ask About Your Ideas
          </SheetTitle>
        </SheetHeader>

        {/* Messages area */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="py-4 space-y-4">
            {messages.length === 0 ? (
              // Welcome state with suggestions
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 bg-muted rounded-lg rounded-tl-none p-3">
                    <p className="text-sm">
                      I can help you understand your business ideas better. Ask me anything about:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Why a certain idea was or wasn't suggested</li>
                      <li>• How to compare different ideas</li>
                      <li>• What would change with different parameters</li>
                      <li>• Specific details about any idea</li>
                    </ul>
                  </div>
                </div>

                {/* Suggestion chips */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    Try asking:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.map((q, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="text-xs h-auto py-1.5 px-2 hover:bg-primary/5 transition-colors"
                        onClick={() => handleSuggestionClick(q.text)}
                      >
                        {q.icon}
                        <span className="ml-1">{q.text}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Message list
              messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-3 animate-fade-in",
                    message.role === "user" && "flex-row-reverse"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10"
                    )}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex-1 rounded-lg p-3 max-w-[85%]",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted rounded-tl-none"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))
            )}

            {/* Loading indicator with animated dots */}
            {isLoading && (
              <div className="flex items-start gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg rounded-tl-none p-3">
                  <div className="flex items-center gap-1">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t p-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your ideas..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default IdeaChatPanel;
