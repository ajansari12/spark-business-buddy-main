import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BusinessNameSuggestion {
  name: string;
  tagline: string;
  domain_suggestions: string[];
  rationale: string;
}

const SYSTEM_PROMPT = `You are a creative business naming expert specializing in Canadian businesses. Generate creative, memorable business name suggestions.

## Guidelines
- Names should be professional yet memorable
- Consider .ca domain availability (suggest names that are likely available)
- Include both creative/playful and professional options
- Consider Canadian market appeal
- Avoid names that are too generic or hard to spell
- Each name should work well for branding
- Include domain suggestions (.ca, .com, .co)

## Output Format
Return ONLY a valid JSON array with 10-15 business name suggestions:

[
  {
    "name": "Business Name",
    "tagline": "Short catchy tagline (max 8 words)",
    "domain_suggestions": ["name.ca", "name.com", "getname.ca"],
    "rationale": "1-2 sentences explaining why this name works for this business"
  }
]

IMPORTANT: Return ONLY the JSON array, no markdown, no explanations.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { idea_id } = await req.json();

    if (!idea_id) {
      return new Response(JSON.stringify({ error: "idea_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the idea and verify ownership
    const { data: idea, error: ideaError } = await supabase
      .from("ft_ideas")
      .select("*, session:ft_sessions!inner(user_id, collected_data)")
      .eq("id", idea_id)
      .single();

    if (ideaError || !idea) {
      console.error("Idea fetch error:", ideaError);
      return new Response(JSON.stringify({ error: "Idea not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (idea.session.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if names already exist (idempotency)
    if (idea.business_names && Array.isArray(idea.business_names) && idea.business_names.length > 0) {
      console.log("Returning cached business names for idea:", idea_id);
      return new Response(JSON.stringify({ names: idea.business_names, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get city from collected data
    const collectedData = idea.session.collected_data || {};
    const city = collectedData.city || "Canada";

    // Build prompt
    const userPrompt = `Generate 10-15 creative business name suggestions for the following business:

Business Type: ${idea.title}
Category: ${idea.category}
Description: ${idea.description}
Location: ${city}
Target Market: ${idea.market_analysis?.target_customer || "General consumers/businesses"}

Create names that:
1. Reflect the business type and values
2. Appeal to the Canadian market
3. Are easy to remember and spell
4. Have available .ca domain potential
5. Mix of professional and creative options

Return ONLY a JSON array of name suggestions.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Generating business names for idea:", idea_id);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8, // Higher creativity for names
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log("Raw AI response:", content.substring(0, 500));

    // Parse JSON from response
    let names: BusinessNameSuggestion[];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        names = JSON.parse(jsonMatch[0]);
      } else {
        names = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("Failed to parse names:", parseError);
      return new Response(JSON.stringify({ error: "Failed to parse generated names" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate structure
    if (!Array.isArray(names) || names.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid response structure" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store names in database
    const { error: updateError } = await supabase
      .from("ft_ideas")
      .update({ business_names: names })
      .eq("id", idea_id);

    if (updateError) {
      console.error("Failed to save business names:", updateError);
      // Don't fail the request, just log the error
    }

    console.log(`Generated ${names.length} business names for idea:`, idea_id);

    return new Response(JSON.stringify({ names, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ft_generate_business_names error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
