import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Settings {
  tone: 'professional' | 'casual' | 'excited';
  includeEmojis: boolean;
  includeHashtags: boolean;
}

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

    const { idea_id, platforms, settings, regenerate } = await req.json();

    if (!idea_id) {
      return new Response(JSON.stringify({ error: "idea_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestedPlatforms = platforms || ['linkedin', 'twitter', 'instagram', 'facebook'];
    const postSettings: Settings = settings || { tone: 'professional', includeEmojis: true, includeHashtags: true };
    const isPartialRegenerate = regenerate && requestedPlatforms.length < 4;

    // Check for existing content
    const { data: existingContent } = await supabaseClient
      .from("ft_generated_content")
      .select("*")
      .eq("idea_id", idea_id)
      .eq("user_id", user.id)
      .eq("content_type", "social")
      .single();

    // Return cached if not regenerating
    if (!regenerate && existingContent) {
      return new Response(JSON.stringify({ content: existingContent, cached: true }), {
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

    // Get session data for context
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

    const toneDescriptions = {
      professional: "professional and authoritative, suitable for business audiences",
      casual: "friendly and conversational, relatable to everyday people",
      excited: "enthusiastic and energetic, conveying excitement and urgency"
    };

    const systemPrompt = `You are an expert social media marketer specializing in small business launch announcements.
Generate engaging, platform-optimized social media posts for a Canadian business launch.

Tone: ${toneDescriptions[postSettings.tone]}
Include emojis: ${postSettings.includeEmojis ? 'Yes, use appropriate emojis' : 'No, avoid emojis'}
Include hashtags: ${postSettings.includeHashtags ? 'Yes, include relevant hashtags' : 'No, skip hashtags'}`;

    const userPrompt = `Generate social media posts for this Canadian business launch:

BUSINESS IDEA:
- Title: ${idea.title}
- Description: ${idea.description || 'N/A'}
- Category: ${idea.category || 'N/A'}
- Tagline: ${idea.tagline || 'N/A'}
- Location: ${collectedData.city || 'Canada'}, ${collectedData.province || 'ON'}

Generate posts for these platforms: ${requestedPlatforms.join(', ')}

PLATFORM REQUIREMENTS:
- LinkedIn: Professional, 3 paragraphs with line breaks, 3-5 industry hashtags, 1300 chars max
- Twitter: Under 280 characters STRICTLY, punchy and engaging, hashtags at the end only
- Instagram: Use emojis liberally, line breaks between sections, 10+ hashtags at end, engaging and visual
- Facebook: Conversational, start with a question hook, encourage engagement and sharing

Return as JSON with this exact structure:
{
  "linkedin": {
    "content": "Full LinkedIn post text",
    "hashtags": ["hashtag1", "hashtag2"]
  },
  "twitter": {
    "content": "Tweet text under 280 chars",
    "hashtags": ["hashtag1"]
  },
  "instagram": {
    "content": "Instagram caption with emojis",
    "hashtags": ["hashtag1", "hashtag2", "etc"]
  },
  "facebook": {
    "content": "Facebook post with question hook",
    "hashtags": []
  }
}`;

    console.log(`Generating social posts for idea ${idea_id}, user ${user.id}`);

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
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to generate posts" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let postsData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        postsData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      console.error("Parse error:", e, "Content:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Merge with existing posts if partial regenerate
    let mergedPosts = postsData;
    if (isPartialRegenerate && existingContent?.content?.posts) {
      mergedPosts = {
        ...existingContent.content.posts,
        ...postsData,
      };
      console.log(`Merged ${requestedPlatforms.join(', ')} with existing posts`);
    }

    // Add metadata
    const socialContent = {
      posts: mergedPosts,
      settings: postSettings,
      generated_at: new Date().toISOString(),
    };

    // Check if we need to update or insert
    const { data: existingRecord } = await supabaseClient
      .from("ft_generated_content")
      .select("id")
      .eq("idea_id", idea_id)
      .eq("user_id", user.id)
      .eq("content_type", "social")
      .single();

    let savedContent;
    if (existingRecord) {
      const { data, error: updateError } = await supabaseClient
        .from("ft_generated_content")
        .update({
          content: socialContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRecord.id)
        .select()
        .single();

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(JSON.stringify({ error: "Failed to save posts" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      savedContent = data;
    } else {
      const { data, error: insertError } = await supabaseClient
        .from("ft_generated_content")
        .insert({
          user_id: user.id,
          idea_id,
          content_type: "social",
          content: socialContent,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(JSON.stringify({ error: "Failed to save posts" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      savedContent = data;
    }

    console.log(`Social posts generated for user ${user.id}, idea ${idea_id}`);

    return new Response(JSON.stringify({ content: savedContent, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Social posts generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
