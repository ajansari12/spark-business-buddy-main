import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  X,
  Bot,
  User,
  Loader2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRegistrationCopilot } from "@/hooks/useRegistrationCopilot";

interface RegistrationCopilotProps {
  ideaId: string;
  province?: string;
  businessStructure?: string;
  currentStep?: string;
}

const SUGGESTED_QUESTIONS = [
  "What documents do I need to register?",
  "How long does registration take?",
  "Do I need a business bank account?",
  "What's the difference between HST and GST?",
  "Do I need a municipal business licence?",
];

export function RegistrationCopilot({
  ideaId,
  province,
  businessStructure,
  currentStep,
}: RegistrationCopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { messages, isLoading, error, askQuestion, clearMessages } =
    useRegistrationCopilot({
      ideaId,
      province,
      businessStructure,
    });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const question = input;
    setInput("");
    await askQuestion(question, currentStep);
  };

  const handleSuggestedQuestion = async (question: string) => {
    await askQuestion(question, currentStep);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-left text-base">Registration Assistant</SheetTitle>
                <p className="text-xs text-muted-foreground">Ask anything about registering your business</p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMessages}
                className="text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <Sparkles className="w-12 h-12 text-primary/40 mx-auto mb-3" />
                  <h3 className="font-medium text-foreground mb-1">
                    How can I help?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Ask me anything about business registration in Canada
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    Suggested questions
                  </p>
                  {SUGGESTED_QUESTIONS.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      disabled={isLoading}
                      className="w-full text-left text-sm px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" && "flex-row-reverse"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      message.role === "assistant"
                        ? "bg-primary/20"
                        : "bg-muted"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <Bot className="w-4 h-4 text-primary" />
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex-1 rounded-lg p-3",
                      message.role === "assistant"
                        ? "bg-muted/50"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground mb-1">Sources:</p>
                        <div className="flex flex-wrap gap-1">
                          {message.sources.slice(0, 3).map((source, i) => (
                            <a
                              key={i}
                              href={source}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {new URL(source).hostname.replace("www.", "")}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            {error && (
              <div className="text-center py-2">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-border flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
