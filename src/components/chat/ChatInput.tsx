import { useState, useEffect } from "react";
import { FTNextQuestion } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  nextQuestion: FTNextQuestion;
  onSend: (message: string) => void;
  disabled?: boolean;
}

// Helper to normalize options to { value, label } format
const normalizeOptions = (
  options?: Array<{ value: string; label: string } | string>
): Array<{ value: string; label: string }> => {
  if (!options) return [];
  return options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );
};

// Helper to get placeholder text (supports both prompt and placeholder)
const getPlaceholder = (nextQuestion: FTNextQuestion): string => {
  return nextQuestion.prompt || nextQuestion.placeholder || "Type your message...";
};

export const ChatInput = ({ nextQuestion, onSend, disabled }: ChatInputProps) => {
  const [value, setValue] = useState("");
  const [sliderValue, setSliderValue] = useState<number[]>([50]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Reset state when question type changes
  useEffect(() => {
    setIsTransitioning(true);
    setValue("");
    setSelectedOptions([]);
    if (nextQuestion.min !== undefined) {
      setSliderValue([nextQuestion.min]);
    }
    const timer = setTimeout(() => setIsTransitioning(false), 150);
    return () => clearTimeout(timer);
  }, [nextQuestion.field, nextQuestion.type, nextQuestion.min, nextQuestion.prompt]);

  const handleSubmit = () => {
    if (nextQuestion.type === "multi" && selectedOptions.length > 0) {
      onSend(selectedOptions.join(", "));
      setSelectedOptions([]);
    } else if (nextQuestion.type === "slider") {
      onSend(sliderValue[0].toString());
    } else if (value.trim()) {
      onSend(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleOption = (optionValue: string) => {
    setSelectedOptions((prev) =>
      prev.includes(optionValue)
        ? prev.filter((v) => v !== optionValue)
        : [...prev, optionValue]
    );
  };

  const handleQuickReply = (optionValue: string) => {
    onSend(optionValue);
  };

  const containerClass = cn(
    "p-4 bg-background border-t border-border safe-bottom transition-opacity duration-150",
    isTransitioning ? "opacity-0" : "opacity-100"
  );

  const options = normalizeOptions(nextQuestion.options);

  // Quick reply - horizontal scrollable chips
  if (nextQuestion.type === "quick_reply" && options.length > 0) {
    return (
      <div className={containerClass}>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {options.map((option) => (
            <Button
              key={option.value}
              variant="outline"
              size="sm"
              className="touch-target whitespace-nowrap flex-shrink-0"
              onClick={() => handleQuickReply(option.value)}
              disabled={disabled}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Confirm - two action buttons (new type from battle-tested prompt)
  if (nextQuestion.type === "confirm" && options.length > 0) {
    return (
      <div className={containerClass}>
        <div className="flex flex-col gap-2">
          {options.map((option, index) => (
            <Button
              key={option.value}
              variant={index === 0 ? "default" : "outline"}
              className="touch-target w-full"
              onClick={() => handleQuickReply(option.value)}
              disabled={disabled}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Slider input
  if (nextQuestion.type === "slider") {
    const min = nextQuestion.min ?? 0;
    const max = nextQuestion.max ?? 100;
    const step = nextQuestion.step ?? 1;
    const unit = nextQuestion.unit || "";
    const minLabel = nextQuestion.minLabel ?? `${min.toLocaleString()}${unit ? ` ${unit}` : ""}`;
    const maxLabel = nextQuestion.maxLabel ?? `${max.toLocaleString()}${unit ? ` ${unit}` : ""}`;

    return (
      <div className={containerClass}>
        <div className="mb-4">
          <div className="text-center mb-3">
            <span className="text-lg font-semibold text-foreground">
              {sliderValue[0].toLocaleString()}{unit ? ` ${unit}` : ""}
            </span>
          </div>
          <Slider
            value={sliderValue}
            onValueChange={setSliderValue}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={disabled}
          className="w-full touch-target"
        >
          Continue
          <Send className="ml-2 w-4 h-4" />
        </Button>
      </div>
    );
  }

  // Select - radio-like buttons
  if (nextQuestion.type === "select" && options.length > 0) {
    return (
      <div className={containerClass}>
        <div className="grid grid-cols-2 gap-2 mb-3 max-h-48 overflow-y-auto">
          {options.map((option) => (
            <Button
              key={option.value}
              variant={value === option.value ? "default" : "outline"}
              className="touch-target text-sm"
              onClick={() => setValue(option.value)}
              disabled={disabled}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!value || disabled}
          className="w-full touch-target"
        >
          Continue
          <Send className="ml-2 w-4 h-4" />
        </Button>
      </div>
    );
  }

  // Multi-select - checkbox-like buttons
  if (nextQuestion.type === "multi" && options.length > 0) {
    return (
      <div className={containerClass}>
        <p className="text-xs text-muted-foreground mb-2">Select all that apply:</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {options.map((option) => (
            <Button
              key={option.value}
              variant={selectedOptions.includes(option.value) ? "default" : "outline"}
              size="sm"
              className="touch-target"
              onClick={() => toggleOption(option.value)}
              disabled={disabled}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={selectedOptions.length === 0 || disabled}
          className="w-full touch-target"
        >
          Continue
          <Send className="ml-2 w-4 h-4" />
        </Button>
      </div>
    );
  }

  // Default text input
  return (
    <div className={containerClass}>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder(nextQuestion)}
          disabled={disabled}
          className="touch-target flex-1"
        />
        <Button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          size="icon"
          className="touch-target"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
