// supabase/functions/ft_idea_chat/index.ts
// Edge function for answering questions about generated business ideas

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are FastTrack's AI assistant helping users understand their personalized business ideas.

## YOUR ROLE
You help users:
1. Understand why certain ideas were suggested (and others weren't)
2. Compare different business ideas
3. Explore "what if" scenarios (different budget, time, etc.)
4. Get specific details about any idea
5. Make decisions about which idea to pursue

## CONTEXT
You have access to:
- The user's profile (skills, budget, location, time availability)
- All generated business ideas with details
- The user's questions and conversation history

## RESPONSE GUIDELINES

1. **Be Specific**: Reference actual data from the ideas and user profile
   - Good: "Idea #1 requires $15,000 startup cost, which is 75% of your $20,000 budget..."
   - Bad: "This idea fits your budget well."

2. **Compare Meaningfully**: When asked to compare, create clear contrasts
   - Use tables or structured comparisons when helpful
   - Highlight trade-offs (risk vs reward, time vs money)

3. **Explain "Why Not"**: If asked why something wasn't suggested, explain based on:
   - Budget constraints
   - Time availability
   - Skill match
   - Local market conditions
   - Risk level preferences

4. **"What If" Scenarios**: When users ask about changes:
   - "With $50k instead of $20k, you could consider franchises like..."
   - "If you had 40 hours/week, rapid-growth businesses become viable..."

5. **Keep It Conversational**: You're a helpful advisor, not a report generator
   - 2-4 paragraphs max unless comparison requested
   - Use occasional formatting (bullets, bold) for clarity
   - Reference ideas by name, not just numbers

## DON'T
- Make up new business ideas (stick to the ones generated)
- Provide legal, tax, or financial advice
- Make promises about success or income
- Be overly promotional or salesy

## DO
- Be honest about risks and challenges
- Acknowledge uncertainty when appropriate
- Encourage users to do additional research
- Suggest specific next steps`;

interface IdeaChatInput {
  session_id: string;
  question: string;
  ideas_context: string;
  user_context: string;
  conversation_history?: { role: string; content: string }[];
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input: IdeaChatInput = await req.json();

    // Validate input
    if (!input.session_id || !input.question) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client and verify user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from("ft_sessions")
      .select("user_id")
      .eq("id", input.session_id)
      .single();

    if (sessionError || !session || session.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build conversation messages
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "system",
        content: `## CURRENT CONTEXT

### User's Generated Business Ideas:
${input.ideas_context}

### User's Profile:
${input.user_context}

Answer the user's question based on this context. Be specific and reference actual data.`,
      },
    ];

    // Add conversation history if provided
    if (input.conversation_history && input.conversation_history.length > 0) {
      for (const msg of input.conversation_history) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    // Add current question
    messages.push({
      role: "user",
      content: input.question,
    });

    // Call AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("ft_idea_chat: Calling AI with question:", input.question.substring(0, 100));

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 800,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      // Handle rate limits and payment required
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    console.log("ft_idea_chat: Response generated successfully");

    // Return answer
    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("ft_idea_chat error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process question" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
