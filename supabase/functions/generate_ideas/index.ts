import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are FastTrack's Business Idea Generator. Based on the user's profile data, generate 3-5 highly personalized, actionable business ideas tailored to the Canadian market.

## Your Task
Analyze the user's:
- Location (city, province)
- Skills and experience
- Budget range
- Time commitment
- Goals

Then generate business ideas that:
1. Match their skill set
2. Fit within their budget
3. Are achievable with their time commitment
4. Align with their goals
5. Have real market potential in their Canadian location

## Output Format
Return ONLY a valid JSON array with 3-5 business ideas. Each idea must have this exact structure:

[
  {
    "id": "1",
    "name": "Business Name",
    "tagline": "A catchy one-liner (max 10 words)",
    "description": "2-3 sentences explaining the business concept",
    "whyItFits": "2-3 sentences explaining why this matches their profile",
    "startupCost": "$X,XXX - $X,XXX",
    "potentialRevenue": "$X,XXX - $X,XXX/month",
    "timeToLaunch": "X weeks/months",
    "firstSteps": [
      "Step 1 - specific action",
      "Step 2 - specific action", 
      "Step 3 - specific action"
    ],
    "localAdvantage": "Why this works well in their specific location"
  }
]

## Important Guidelines
- Be specific to their Canadian province/city
- Include realistic startup costs in CAD
- Suggest businesses they can actually start with their stated budget
- Consider local regulations and market conditions
- Make first steps immediately actionable
- NO markdown, NO explanations, ONLY the JSON array`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { extractedData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating ideas for:", extractedData);

    const userPrompt = `Generate personalized business ideas for this Canadian entrepreneur:

Location: ${extractedData.city || "Unknown"}, ${extractedData.province || "Unknown"}
Skills & Experience: ${extractedData.skills?.join(", ") || "Not specified"}
Budget: ${extractedData.budget || "Not specified"}
Time Commitment: ${extractedData.time_commitment || "Not specified"}
Goals: ${extractedData.goals?.join(", ") || "Not specified"}

Generate 3-5 business ideas that perfectly match this profile. Return ONLY a JSON array.`;

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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to generate ideas" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log("Raw AI response:", content);

    // Parse the JSON from the response
    let ideas;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        ideas = JSON.parse(jsonMatch[0]);
      } else {
        ideas = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("Failed to parse ideas:", parseError);
      return new Response(
        JSON.stringify({ error: "Failed to parse generated ideas" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ideas }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate_ideas error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
