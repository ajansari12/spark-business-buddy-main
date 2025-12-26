import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

// Sanitize user input to prevent prompt injection and XSS
function sanitizeUserInput(input: string): string {
  // Remove HTML/script tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove common prompt injection patterns
  const suspiciousPatterns = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+instructions?/gi,
    /disregard\s+(all\s+)?(previous|above|prior)\s+instructions?/gi,
    /forget\s+(all\s+)?(previous|above|prior)\s+instructions?/gi,
    /you\s+are\s+now\s+/gi,
    /new\s+instructions?:/gi,
    /system\s*:\s*/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<<SYS>>/gi,
    /<\/SYS>/gi,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      console.warn("[SECURITY] Suspicious input pattern detected:", input.substring(0, 100));
      sanitized = sanitized.replace(pattern, '[FILTERED]');
    }
  }
  
  // Escape special characters that could affect JSON or prompts
  sanitized = sanitized
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .trim();
  
  return sanitized;
}

// ============================================================================
// INPUT VALIDATION SCHEMAS
// ============================================================================

const uuidSchema = z.string().uuid("Invalid UUID format");

const contextSchema = z.object({
  province: z.string().max(50).optional(),
  business_structure: z.string().max(50).optional(),
  current_step: z.string().max(100).optional(),
}).optional();

const requestBodySchema = z.object({
  idea_id: uuidSchema,
  question: z.string()
    .min(1, "Question cannot be empty")
    .max(2000, "Question must be less than 2000 characters")
    .transform(s => sanitizeUserInput(s.trim())),
  context: contextSchema,
});

type RequestBody = z.infer<typeof requestBodySchema>;

interface CopilotMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const perplexityApiKey = Deno.env.get("PERPLEXITY_API_KEY");

    if (!perplexityApiKey) {
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate input with Zod
    let requestBody: RequestBody;
    try {
      const rawBody = await req.json();
      requestBody = requestBodySchema.parse(rawBody);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error("[ft_registration_copilot] Validation error:", validationError.errors);
        return new Response(JSON.stringify({ 
          error: "Invalid request data",
          details: validationError.errors.map(e => e.message).join(", ")
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw validationError;
    }

    const { idea_id, question, context } = requestBody;

    console.log(`[ft_registration_copilot] Question for idea ${idea_id}: ${question.substring(0, 100)}...`);

    // Fetch idea details for context
    const { data: idea, error: ideaError } = await supabase
      .from("ft_ideas")
      .select("*")
      .eq("id", idea_id)
      .eq("user_id", user.id)
      .single();

    if (ideaError || !idea) {
      return new Response(JSON.stringify({ error: "Resource not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch registration progress for context
    const { data: progress } = await supabase
      .from("ft_registration_progress")
      .select("*")
      .eq("idea_id", idea_id)
      .eq("user_id", user.id)
      .single();

    // Build rich context for the copilot
    const businessContext = `
Business: ${idea.title}
Description: ${idea.description || idea.tagline || "N/A"}
Category: ${idea.category || "General"}
Province: ${context?.province || progress?.province || "Canada"}
Business Structure: ${context?.business_structure || progress?.business_structure || "sole_proprietorship"}
Current Step: ${context?.current_step || "general"}
    `.trim();

    // Province name mapping
    const provinceNames: Record<string, string> = {
      "ON": "Ontario",
      "BC": "British Columbia",
      "AB": "Alberta",
      "QC": "Quebec",
      "SK": "Saskatchewan",
      "MB": "Manitoba",
    };
    const provinceName = provinceNames[context?.province || progress?.province || ""] || "Canada";

    // Call Perplexity for the answer
    const systemPrompt = `You are a friendly and knowledgeable Canadian business registration expert helping someone register their business in ${provinceName}.

Context about their business:
${businessContext}

Your role:
1. Answer questions specifically about business registration in ${provinceName}
2. Provide accurate, up-to-date information with official government sources when possible
3. Be concise but thorough - aim for 2-3 paragraphs max
4. If you mention costs or timelines, be clear they may change and recommend verifying with official sources
5. If a question is outside the scope of business registration, politely redirect to the registration topic
6. Always mention the official government website where they can complete the step or get more info

Important: Base your answers on current 2024-2025 Canadian regulations and provincial requirements.`;

    const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${perplexityApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        max_tokens: 1000,
      }),
    });

    if (!perplexityResponse.ok) {
      console.error("[ft_registration_copilot] External API error:", perplexityResponse.status);
      
      if (perplexityResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit reached. Please try again in a moment." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to get answer" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const perplexityData = await perplexityResponse.json();
    const answer = perplexityData.choices?.[0]?.message?.content || "I couldn't find an answer to that question.";
    const citations = perplexityData.citations || [];

    console.log("[ft_registration_copilot] Answer generated, length:", answer.length);

    // Store the conversation in ft_registration_progress
    const existingMessages: CopilotMessage[] = progress?.copilot_messages || [];
    const newMessages: CopilotMessage[] = [
      ...existingMessages,
      {
        role: "user",
        content: question,
        timestamp: new Date().toISOString(),
      },
      {
        role: "assistant",
        content: answer,
        timestamp: new Date().toISOString(),
        sources: citations,
      },
    ];

    // Keep only last 20 messages to avoid bloating the JSONB field
    const trimmedMessages = newMessages.slice(-20);

    await supabase
      .from("ft_registration_progress")
      .update({ copilot_messages: trimmedMessages })
      .eq("idea_id", idea_id)
      .eq("user_id", user.id);

    // Log the event
    await supabase.from("ft_events").insert({
      user_id: user.id,
      event_name: "registration_copilot_question",
      event_data: {
        idea_id,
        question_length: question.length,
        answer_length: answer.length,
        province: provinceName,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      answer,
      sources: citations,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[ft_registration_copilot] Unexpected error:", error);
    return new Response(JSON.stringify({ 
      error: "An unexpected error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
