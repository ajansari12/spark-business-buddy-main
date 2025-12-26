// ============================================================================
// CHAT TYPES - Re-exports from enhanced-types.ts (single source of truth)
// ============================================================================

// Re-export all chat-related types from enhanced-types
export {
  type FTExtractedData,
  type FTNextQuestion,
  type FTSignal,
  type FTMeta,
  type ChatMessage,
  type ProfileSummary,
  type ProgressSection,
  PROGRESS_SECTIONS,
  toProfileSummary,
  calculateProgress,
} from "./enhanced-types";

// Import types locally for use in parser functions
import type { FTMeta, FTSignal } from "./enhanced-types";

// ============================================================================
// RESPONSE PARSING TYPES & FUNCTIONS
// ============================================================================

export interface ChatApiResponse {
  text: string;
  ft_meta: FTMeta;
}

export interface ChatApiError {
  error: string;
}

export interface ParsedResponse {
  text: string;
  meta: FTMeta;
}

// Default meta for fallback scenarios
const DEFAULT_META: FTMeta = {
  extracted: {},
  progress: 0,
  next_question: {
    type: "text",
    prompt: "Tell me more...",
    placeholder: "Tell me more...",
  },
  signal: "CONTINUE",
};

const VALID_SIGNALS: FTSignal[] = [
  "CONTINUE",
  "SHOW_QUICK_PREVIEW",
  "SHOW_TRENDING",
  "READY_TO_PAY",
  "READY_TO_GENERATE",
  "DONE",
];

const VALID_TYPES = [
  "text",
  "select",
  "slider",
  "multi",
  "quick_reply",
  "confirm",
  "trending",
  "quick_preview",
] as const;

/**
 * Robust parser for assistant responses containing FT_META blocks.
 * Supports both new [FT_META] and legacy ```FT_META``` delimiters.
 * Includes validation, fallbacks, and JSON cleanup.
 */
export function parseAssistantResponse(raw: string): ParsedResponse {
  // Try new format first: [FT_META]...[/FT_META]
  let metaMatch = raw.match(/\[FT_META\]\s*([\s\S]*?)\s*\[\/FT_META\]/);

  // Fallback to legacy format: ```FT_META...```
  if (!metaMatch) {
    metaMatch = raw.match(/```FT_META\s*([\s\S]*?)\s*```/);
  }

  let text = raw;
  let meta: FTMeta = { ...DEFAULT_META };

  if (metaMatch) {
    // Remove the FT_META block from visible text (both formats)
    text = raw
      .replace(/\[FT_META\][\s\S]*?\[\/FT_META\]/, "")
      .replace(/```FT_META[\s\S]*?```/, "")
      .trim();

    try {
      // Clean up the JSON string
      let jsonStr = metaMatch[1].trim();

      // Remove any markdown code block markers if present inside
      jsonStr = jsonStr.replace(/^```json?\s*/i, "").replace(/\s*```$/, "");

      // Parse the JSON
      const parsed = JSON.parse(jsonStr);

      // Validate required fields exist
      if (
        typeof parsed.extracted === "object" &&
        typeof parsed.progress === "number" &&
        typeof parsed.next_question === "object" &&
        typeof parsed.signal === "string"
      ) {
        // Determine prompt text (support both prompt and legacy placeholder)
        const promptText =
          parsed.next_question.prompt ||
          parsed.next_question.placeholder ||
          "Continue...";

        // Validate and normalize type
        const questionType = VALID_TYPES.includes(parsed.next_question.type)
          ? parsed.next_question.type
          : "text";

        meta = {
          extracted: parsed.extracted || {},
          progress: Math.min(100, Math.max(0, parsed.progress)),
          next_question: {
            type: questionType,
            prompt: promptText,
            placeholder: promptText, // Keep for legacy consumers
            ...(parsed.next_question.field && {
              field: parsed.next_question.field,
            }),
            ...(parsed.next_question.options && {
              options: parsed.next_question.options,
            }),
            ...(parsed.next_question.min !== undefined && {
              min: parsed.next_question.min,
            }),
            ...(parsed.next_question.max !== undefined && {
              max: parsed.next_question.max,
            }),
            ...(parsed.next_question.step !== undefined && {
              step: parsed.next_question.step,
            }),
            ...(parsed.next_question.unit && {
              unit: parsed.next_question.unit,
            }),
            ...(parsed.next_question.minLabel && {
              minLabel: parsed.next_question.minLabel,
            }),
            ...(parsed.next_question.maxLabel && {
              maxLabel: parsed.next_question.maxLabel,
            }),
          },
          signal: VALID_SIGNALS.includes(parsed.signal)
            ? parsed.signal
            : "CONTINUE",
        };
      }
    } catch (e) {
      console.error("Failed to parse FT_META:", e);
      // Keep default meta
    }
  } else {
    // No FT_META block found - try to find raw JSON at end of message
    const jsonMatch = raw.match(/\{[\s\S]*"signal"[\s\S]*\}$/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.signal && VALID_SIGNALS.includes(parsed.signal)) {
          text = raw.replace(jsonMatch[0], "").trim();
          meta = {
            extracted: parsed.extracted || {},
            progress: Math.min(100, Math.max(0, parsed.progress || 0)),
            next_question: {
              type: VALID_TYPES.includes(parsed.next_question?.type)
                ? parsed.next_question.type
                : "text",
              prompt:
                parsed.next_question?.prompt ||
                parsed.next_question?.placeholder ||
                "Continue...",
              placeholder:
                parsed.next_question?.prompt ||
                parsed.next_question?.placeholder ||
                "Continue...",
              ...(parsed.next_question?.options && {
                options: parsed.next_question.options,
              }),
            },
            signal: parsed.signal,
          };
        }
      } catch {
        // Ignore, use defaults
      }
    }
  }

  // Clean up text
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  return { text, meta };
}

// Helper functions for backwards compatibility with existing code

/**
 * Parse FT_META from content - returns null if no valid FT_META found
 */
export const parseFTMeta = (content: string): FTMeta | null => {
  const result = parseAssistantResponse(content);
  // Check if we found actual meta (not just defaults)
  const hasMetaBlock =
    content.includes("[FT_META]") ||
    content.includes("```FT_META") ||
    content.match(/\{[\s\S]*"signal"[\s\S]*\}$/);
  return hasMetaBlock ? result.meta : null;
};

/**
 * Strip FT_META from visible text
 */
export const stripFTMeta = (content: string): string => {
  return parseAssistantResponse(content).text;
};

/**
 * Get default FT_META for initialization
 */
export const getDefaultFTMeta = (): FTMeta => ({
  extracted: {
    city: null,
    province: null,
    skills_background: null,
    interests: null,
    time_commitment_hours: null,
    budget_min: null,
    budget_max: null,
    income_goal: null,
    constraints: null,
    preferred_industries: [],
  },
  progress: 0,
  next_question: {
    type: "text",
    field: "greeting",
    placeholder: "Type your message...",
    prompt: "Type your message...",
  },
  signal: "CONTINUE",
});
