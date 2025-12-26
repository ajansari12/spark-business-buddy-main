import { ChatMessage } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Rocket, User } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
  index?: number;
}

export const MessageBubble = ({ message, index = 0 }: MessageBubbleProps) => {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 animate-message-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
      style={{
        animationDelay: `${index * 50}ms`,
        animationFillMode: "both",
      }}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-accent" : "bg-primary"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-accent-foreground" />
        ) : (
          <Rocket className="w-4 h-4 text-primary-foreground" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          "max-w-[80%] px-4 py-3 rounded-2xl",
          isUser
            ? "bg-accent text-accent-foreground rounded-br-md"
            : "bg-card border border-border text-card-foreground rounded-bl-md"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </div>
  );
};
