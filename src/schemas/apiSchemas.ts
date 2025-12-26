import { z } from 'zod';

/**
 * API Response Validation Schemas
 * Using Zod for runtime type validation of API responses
 */

// Base schemas
const IdeaSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().optional(),
  startup_cost_min: z.number().optional(),
  startup_cost_max: z.number().optional(),
  time_to_launch: z.string().optional(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  revenue_potential: z.enum(['low', 'medium', 'high', 'very_high']).optional(),
  created_at: z.string().optional(),
});

const ExtractedDataSchema = z.object({
  industries: z.array(z.string()).optional(),
  budget: z.number().optional(),
  time_commitment: z.string().optional(),
  income_goal: z.number().optional(),
  experience_level: z.string().optional(),
  interests: z.array(z.string()).optional(),
});

const ChatSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: z.enum(['active', 'completed', 'ready_to_generate', 'failed']),
  extracted_data: ExtractedDataSchema.optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Generate Ideas Response Schema
export const GenerateIdeasResponseSchema = z.object({
  ideas: z.array(IdeaSchema).min(1),
  session_id: z.string().uuid().optional(),
  count: z.number().optional(),
});

// Chat Message Schema
export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  created_at: z.string(),
});

// Chat Response Schema
export const ChatResponseSchema = z.object({
  message: ChatMessageSchema,
  extracted_data: ExtractedDataSchema.optional(),
  is_ready_to_generate: z.boolean().optional(),
});

// User Profile Schema
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  full_name: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  subscription_tier: z.enum(['free', 'pro', 'enterprise']).optional().default('free'),
  ideas_generated: z.number().optional().default(0),
  credits_remaining: z.number().optional().default(0),
  created_at: z.string().optional(),
});

// Supabase Function Response Wrapper
export const SupabaseFunctionResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema.optional(),
    error: z
      .object({
        message: z.string(),
        code: z.string().optional(),
        details: z.any().optional(),
      })
      .optional()
      .nullable(),
  });

// Payment Schema
export const PaymentSchema = z.object({
  id: z.string(),
  amount: z.number().positive(),
  currency: z.string().default('CAD'),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']),
  tier: z.enum(['pro', 'enterprise']),
  created_at: z.string(),
});

// Referral Schema
export const ReferralSchema = z.object({
  id: z.string().uuid(),
  referrer_id: z.string().uuid(),
  referred_email: z.string().email().optional(),
  referred_user_id: z.string().uuid().optional().nullable(),
  status: z.enum(['pending', 'completed', 'rewarded']),
  reward_amount: z.number().optional(),
  created_at: z.string(),
});

// Document Schema
export const DocumentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  idea_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1),
  content: z.any(), // JSONB content
  type: z.enum(['business_plan', 'market_analysis', 'financial_projection', 'other']),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

// Export type inference helpers
export type Idea = z.infer<typeof IdeaSchema>;
export type GenerateIdeasResponse = z.infer<typeof GenerateIdeasResponseSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type Referral = z.infer<typeof ReferralSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type ExtractedData = z.infer<typeof ExtractedDataSchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>;

/**
 * Safe validator helper
 * Validates data and returns typed result with error handling
 */
export const safeValidate = <T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
};

/**
 * Validate and extract data helper
 * Returns validated data or throws user-friendly error
 */
export const validateOrThrow = <T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  errorMessage: string = 'Invalid data received from server'
): z.infer<T> => {
  const result = safeValidate(schema, data);

  if (!result.success) {
    console.error('Validation failed:', result.error.errors);
    throw new Error(errorMessage);
  }

  return result.data;
};
