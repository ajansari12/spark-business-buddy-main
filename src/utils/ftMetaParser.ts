// ============================================================================
// ROBUST FT_META PARSING WITH ZOD VALIDATION
// Fixes parsing reliability issues with strict validation and fallbacks
// ============================================================================

import { z } from "zod";

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

// Extracted data schema (what we collect from users)
export const FTExtractedDataSchema = z.object({
  city: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  skills_background: z.string().nullable().optional(),
  interests: z.string().nullable().optional(),
  time_commitment_hours: z.number().nullable().optional(),
  budget_min: z.number().nullable().optional(),
  budget_max: z.number().nullable().optional(),
  income_goal: z.string().nullable().optional(),
  constraints: z.string().nullable().optional(),
  preferred_industries: z.array(z.string()).optional().default([]),
  age_range: z.string().nullable().optional(),
  residency_status: z.string().nullable().optional(),
  years_in_canada: z.string().nullable().optional(),
  user_confirmed: z.boolean().optional(),
});

// Next question schema
const NextQuestionTypeSchema = z.enum([
  "text",
  "select",
  "multi",
  "slider",
  "quick_reply",
  "confirm",
  "trending",
]);

export const FTNextQuestionSchema = z.object({
  type: NextQuestionTypeSchema,
  prompt: z.string().optional(),
  placeholder: z.string().optional(),
  field: z.string().optional(),
  options: z
    .array(
      z.union([
        z.string(),
        z.object({ value: z.string(), label: z.string() }),
      ])
    )
    .optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  unit: z.string().optional(),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
});

// Signal schema
export const FTSignalSchema = z.enum([
  "CONTINUE",
  "SHOW_TRENDING",
  "READY_TO_PAY",
  "READY_TO_GENERATE",
  "DONE",
]);

// Complete FT_META schema
export const FTMetaSchema = z.object({
  extracted: FTExtractedDataSchema.partial().default({}),
  progress: z.number().min(0).max(100),
  next_question: FTNextQuestionSchema,
  signal: FTSignalSchema,
});

// Type exports
export type FTExtractedData = z.infer<typeof FTExtractedDataSchema>;
export type FTNextQuestion = z.infer<typeof FTNextQuestionSchema>;
export type FTSignal = z.infer<typeof FTSignalSchema>;
export type FTMeta = z.infer<typeof FTMetaSchema>;

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_NEXT_QUESTION: FTNextQuestion = {
  type: "text",
  prompt: "Tell me more...",
  placeholder: "Type your message...",
};

export const DEFAULT_FT_META: FTMeta = {
  extracted: {},
  progress: 0,
  next_question: DEFAULT_NEXT_QUESTION,
  signal: "CONTINUE",
};

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

interface ParseResult {
  success: boolean;
  meta: FTMeta;
  text: string;
  errors?: string[];
  source: "ft_meta_block" | "raw_json" | "fallback";
}

/**
 * Extract FT_META block from AI response text
 */
function extractFTMetaBlock(content: string): {
  jsonString: string | null;
  textContent: string;
  format: "bracket" | "backtick" | "raw_json" | null;
} {
  // Try [FT_META]...[/FT_META] format (preferred)
  const bracketMatch = content.match(/\[FT_META\]\s*([\s\S]*?)\s*\[\/FT_META\]/);
  if (bracketMatch) {
    const textContent = content
      .replace(/\[FT_META\][\s\S]*?\[\/FT_META\]/, "")
      .trim();
    return {
      jsonString: bracketMatch[1].trim(),
      textContent,
      format: "bracket",
    };
  }

  // Try ```FT_META...``` format (legacy)
  const backtickMatch = content.match(/```FT_META\s*([\s\S]*?)\s*```/);
  if (backtickMatch) {
    const textContent = content
      .replace(/```FT_META[\s\S]*?```/, "")
      .trim();
    return {
      jsonString: backtickMatch[1].trim(),
      textContent,
      format: "backtick",
    };
  }

  // Try raw JSON at end of message (last resort)
  const rawJsonMatch = content.match(/(\{[\s\S]*"signal"[\s\S]*\})$/);
  if (rawJsonMatch) {
    const textContent = content.replace(rawJsonMatch[0], "").trim();
    return {
      jsonString: rawJsonMatch[1],
      textContent,
      format: "raw_json",
    };
  }

  return {
    jsonString: null,
    textContent: content.trim(),
    format: null,
  };
}

/**
 * Clean JSON string before parsing
 */
function cleanJsonString(jsonStr: string): string {
  let cleaned = jsonStr;

  // Remove markdown code block markers if present inside
  cleaned = cleaned.replace(/^```json?\s*/i, "").replace(/\s*```$/, "");

  // Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  // Fix common typos
  cleaned = cleaned.replace(/"CONTINU"/g, '"CONTINUE"');
  cleaned = cleaned.replace(/"READY_TO_PA"/g, '"READY_TO_PAY"');

  // Remove control characters except newlines and tabs
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

  return cleaned.trim();
}

/**
 * Parse and validate FT_META from AI response
 */
export function parseFTMeta(content: string): ParseResult {
  const { jsonString, textContent, format } = extractFTMetaBlock(content);

  if (!jsonString) {
    return {
      success: false,
      meta: DEFAULT_FT_META,
      text: textContent,
      errors: ["No FT_META block found in response"],
      source: "fallback",
    };
  }

  const cleaned = cleanJsonString(jsonString);

  try {
    const parsed = JSON.parse(cleaned);
    const validated = FTMetaSchema.safeParse(parsed);

    if (validated.success) {
      return {
        success: true,
        meta: validated.data,
        text: textContent,
        source: format === "raw_json" ? "raw_json" : "ft_meta_block",
      };
    }

    // Validation failed - try to salvage what we can
    const errors = validated.error.errors.map(
      (e) => `${e.path.join(".")}: ${e.message}`
    );

    // Attempt partial recovery
    const recovered = recoverPartialMeta(parsed);

    return {
      success: false,
      meta: recovered,
      text: textContent,
      errors,
      source: "fallback",
    };
  } catch (parseError) {
    return {
      success: false,
      meta: DEFAULT_FT_META,
      text: textContent,
      errors: [`JSON parse error: ${parseError}`],
      source: "fallback",
    };
  }
}

/**
 * Attempt to recover a valid FTMeta from partially valid data
 */
function recoverPartialMeta(data: unknown): FTMeta {
  if (!data || typeof data !== "object") {
    return DEFAULT_FT_META;
  }

  const obj = data as Record<string, unknown>;
  const meta: FTMeta = { ...DEFAULT_FT_META };

  // Recover extracted data
  if (obj.extracted && typeof obj.extracted === "object") {
    try {
      const extractedResult = FTExtractedDataSchema.partial().safeParse(
        obj.extracted
      );
      if (extractedResult.success) {
        meta.extracted = extractedResult.data;
      }
    } catch {
      // Keep default empty
    }
  }

  // Recover progress
  if (typeof obj.progress === "number") {
    meta.progress = Math.min(100, Math.max(0, obj.progress));
  }

  // Recover signal
  if (typeof obj.signal === "string") {
    const signalResult = FTSignalSchema.safeParse(obj.signal);
    if (signalResult.success) {
      meta.signal = signalResult.data;
    }
  }

  // Recover next_question
  if (obj.next_question && typeof obj.next_question === "object") {
    const nq = obj.next_question as Record<string, unknown>;
    
    meta.next_question = {
      type: NextQuestionTypeSchema.safeParse(nq.type).success
        ? (nq.type as FTNextQuestion["type"])
        : "text",
      prompt:
        typeof nq.prompt === "string"
          ? nq.prompt
          : typeof nq.placeholder === "string"
          ? nq.placeholder
          : "Continue...",
    };

    // Add options if present
    if (Array.isArray(nq.options)) {
      meta.next_question.options = nq.options;
    }

    // Add slider properties if present
    if (typeof nq.min === "number") meta.next_question.min = nq.min;
    if (typeof nq.max === "number") meta.next_question.max = nq.max;
    if (typeof nq.step === "number") meta.next_question.step = nq.step;
    if (typeof nq.unit === "string") meta.next_question.unit = nq.unit;
  }

  return meta;
}

/**
 * Strip FT_META from visible text
 */
export function stripFTMeta(content: string): string {
  return content
    .replace(/\[FT_META\][\s\S]*?\[\/FT_META\]/g, "")
    .replace(/```FT_META[\s\S]*?```/g, "")
    .replace(/\{[\s\S]*"signal"[\s\S]*\}$/, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate progress from extracted data
 */
export function calculateProgressFromData(
  data: Partial<FTExtractedData>
): number {
  let progress = 0;

  // Location (0-20%)
  if (data.province) progress += 8;
  if (data.city) progress += 12;

  // Background (20-45%)
  if (data.skills_background) progress += 15;
  if (data.interests) progress += 10;

  // Commitment (45-75%)
  if (data.time_commitment_hours) progress += 10;
  if (data.budget_min) progress += 10;
  if (data.budget_max) progress += 10;

  // Goals (75-90%)
  if (data.income_goal) progress += 15;

  // Confirmation (90-100%)
  if (data.user_confirmed) progress += 10;

  return Math.min(100, progress);
}

/**
 * Determine signal from collected data
 */
export function determineSignal(
  data: Partial<FTExtractedData>,
  progress: number
): FTSignal {
  // Check if user confirmed
  if (data.user_confirmed && progress >= 90) {
    return "READY_TO_PAY";
  }

  // Check if all required data collected (should show confirmation)
  const hasAllRequired =
    data.province &&
    data.city &&
    data.skills_background &&
    data.interests &&
    data.time_commitment_hours &&
    data.budget_min &&
    data.income_goal;

  if (hasAllRequired && !data.user_confirmed) {
    // Could trigger showing trending or continue to confirmation
    return "CONTINUE";
  }

  // Show trending after budget is collected
  if (
    data.budget_min &&
    !data.income_goal &&
    progress >= 50 &&
    progress < 75
  ) {
    return "SHOW_TRENDING";
  }

  return "CONTINUE";
}

/**
 * Get next question based on what's missing
 */
export function getNextQuestion(
  data: Partial<FTExtractedData>
): FTNextQuestion {
  // Province
  if (!data.province) {
    return {
      type: "select",
      prompt: "Select your province",
      options: [
        "Alberta",
        "British Columbia",
        "Manitoba",
        "New Brunswick",
        "Newfoundland and Labrador",
        "Northwest Territories",
        "Nova Scotia",
        "Nunavut",
        "Ontario",
        "Prince Edward Island",
        "Quebec",
        "Saskatchewan",
        "Yukon",
      ],
    };
  }

  // City
  if (!data.city) {
    return {
      type: "text",
      prompt: "Which city are you in or nearest to?",
    };
  }

  // Skills
  if (!data.skills_background) {
    return {
      type: "text",
      prompt: "What's your background? Skills, work experience, education?",
    };
  }

  // Interests
  if (!data.interests) {
    return {
      type: "text",
      prompt: "What do you enjoy doing? Hobbies, passions?",
    };
  }

  // Time
  if (!data.time_commitment_hours) {
    return {
      type: "slider",
      prompt: "Hours per week you can commit",
      min: 5,
      max: 60,
      step: 5,
      unit: "hrs/week",
    };
  }

  // Budget
  if (!data.budget_min) {
    return {
      type: "text",
      prompt: "What's your investment budget range? (e.g., $10k-$25k)",
    };
  }

  // Income goal
  if (!data.income_goal) {
    return {
      type: "text",
      prompt: "What's your target income? (e.g., $4,000/month)",
    };
  }

  // All collected - show confirmation
  if (!data.user_confirmed) {
    return {
      type: "confirm",
      prompt: "Ready to see your personalized business ideas?",
      options: ["Yes, show me my ideas!", "Let me change something"],
    };
  }

  return DEFAULT_NEXT_QUESTION;
}

/**
 * Merge new extracted data with existing
 */
export function mergeExtractedData(
  existing: Partial<FTExtractedData>,
  newData: Partial<FTExtractedData>
): Partial<FTExtractedData> {
  const merged = { ...existing };

  for (const key of Object.keys(newData) as Array<keyof FTExtractedData>) {
    const value = newData[key];
    // Only update if value is not null/undefined/empty
    if (value !== null && value !== undefined && value !== "") {
      (merged as Record<keyof FTExtractedData, unknown>)[key] = value;
    }
  }

  return merged;
}

// ============================================================================
// SERVER-SIDE VALIDATION
// ============================================================================

export interface ValidatedResponse {
  text: string;
  meta: FTMeta;
  wasRecovered: boolean;
  recoverySource?: string;
}

/**
 * Validate and potentially fix AI response before sending to client
 */
export function validateAndFixResponse(
  aiResponse: string,
  existingData: Partial<FTExtractedData>,
  previousQuestion?: FTNextQuestion
): ValidatedResponse {
  const parseResult = parseFTMeta(aiResponse);

  if (parseResult.success) {
    return {
      text: parseResult.text,
      meta: parseResult.meta,
      wasRecovered: false,
    };
  }

  // Response was invalid - build server-side meta
  console.warn("FT_META invalid, recovering server-side:", parseResult.errors);

  // Merge any extracted data that was valid
  const mergedData = mergeExtractedData(existingData, parseResult.meta.extracted);
  const serverProgress = calculateProgressFromData(mergedData);
  const serverSignal = determineSignal(mergedData, serverProgress);
  const serverNextQuestion = getNextQuestion(mergedData);

  const recoveredMeta: FTMeta = {
    extracted: parseResult.meta.extracted, // Just the new data from this turn
    progress: serverProgress,
    signal: serverSignal,
    next_question: serverNextQuestion,
  };

  return {
    text: parseResult.text,
    meta: recoveredMeta,
    wasRecovered: true,
    recoverySource: parseResult.source,
  };
}
