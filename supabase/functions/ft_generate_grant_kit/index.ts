import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { idea_id, grant_id } = await req.json();

    if (!idea_id || !grant_id) {
      return new Response(JSON.stringify({ error: "idea_id and grant_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for existing kit
    const { data: existingKit } = await supabaseClient
      .from("ft_grant_kits")
      .select("*")
      .eq("idea_id", idea_id)
      .eq("grant_id", grant_id)
      .eq("user_id", user.id)
      .single();

    if (existingKit) {
      return new Response(JSON.stringify({ kit: existingKit, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch idea details
    const { data: idea, error: ideaError } = await supabaseClient
      .from("ft_ideas")
      .select("*")
      .eq("id", idea_id)
      .eq("user_id", user.id)
      .single();

    if (ideaError || !idea) {
      return new Response(JSON.stringify({ error: "Idea not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch grant details
    const { data: grant, error: grantError } = await supabaseClient
      .from("canadian_grants")
      .select("*")
      .eq("id", grant_id)
      .single();

    if (grantError || !grant) {
      return new Response(JSON.stringify({ error: "Grant not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name, city, province")
      .eq("id", user.id)
      .single();

    // Get session data for more context
    const { data: session } = await supabaseClient
      .from("ft_sessions")
      .select("collected_data")
      .eq("id", idea.session_id)
      .single();

    const collectedData = session?.collected_data || {};

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert grant application writer specializing in Canadian business grants.
Generate a professional grant application starter kit with:
1. A cover letter template personalized for this specific grant and business idea
2. A budget template with realistic cost estimates
3. A compelling business summary highlighting why this business deserves funding

Be specific, professional, and persuasive. Reference Canadian business context.`;

    const userPrompt = `Generate a grant application starter kit for:

GRANT DETAILS:
- Name: ${grant.name}
- Organization: ${grant.organization}
- Amount: $${grant.amount_min || 0} - $${grant.amount_max || 0} CAD
- Description: ${grant.description || 'N/A'}
- Why Apply: ${grant.why_apply || 'N/A'}

BUSINESS IDEA:
- Title: ${idea.title}
- Description: ${idea.description || 'N/A'}
- Category: ${idea.category || 'N/A'}
- Startup Cost: $${idea.investment_min || 0} - $${idea.investment_max || 0} CAD

APPLICANT:
- Name: ${profile?.full_name || '[Your Name]'}
- Location: ${collectedData.city || profile?.city || '[City]'}, ${collectedData.province || profile?.province || '[Province]'}
- Skills: ${collectedData.skills_background || 'N/A'}

Return as JSON:
{
  "cover_letter": "Full cover letter text with [PLACEHOLDER] markers for customization",
  "budget_template": {
    "categories": [
      { "item": "Category name", "amount": number, "justification": "Why needed" }
    ],
    "total": number,
    "notes": "Budget notes"
  },
  "business_summary": "2-3 paragraph compelling business summary"
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI API error:", await aiResponse.text());
      return new Response(JSON.stringify({ error: "Failed to generate kit" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let kitData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        kitData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (e) {
      console.error("Parse error:", e);
      kitData = {
        cover_letter: content,
        budget_template: { categories: [], total: 0, notes: "" },
        business_summary: "",
      };
    }

    // Store in database
    const { data: newKit, error: insertError } = await supabaseClient
      .from("ft_grant_kits")
      .insert({
        user_id: user.id,
        idea_id,
        grant_id,
        cover_letter: kitData.cover_letter,
        budget_template: kitData.budget_template,
        business_summary: kitData.business_summary,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save kit" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Grant kit generated for user ${user.id}, idea ${idea_id}, grant ${grant_id}`);

    return new Response(JSON.stringify({ kit: newKit, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Grant kit error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
