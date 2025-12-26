import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MarketSignals {
  job_posting_count: number;
  job_posting_examples: string[];
  recent_business_activity: {
    openings: string[];
    closures: string[];
  };
  regulatory_notes: string;
  news_sentiment: "positive" | "neutral" | "negative";
  news_highlights: string[];
  demand_indicator: "high" | "moderate" | "low";
  citations: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token - JWT is already validated by Supabase gateway (verify_jwt = true)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode JWT to get user_id (already validated by gateway)
    const token = authHeader.replace("Bearer ", "");
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.sub;
    
    if (!userId) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log("[ft_backfill] Authenticated user:", userId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use service role to query/update data
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    console.log("[ft_backfill] Request body:", JSON.stringify(body));
    
    const { idea_ids } = body as { idea_ids?: string[] };
    console.log("[ft_backfill] idea_ids received:", idea_ids);

    // Fetch ideas that need market signals
    // If specific idea_ids provided, force refresh those (even if they have signals)
    // Otherwise, only fetch ideas without market_signals
    let query = supabase
      .from("ft_ideas")
      .select(`
        id,
        title,
        category,
        session_id
      `)
      .eq("user_id", userId);

    if (idea_ids && idea_ids.length > 0) {
      // Force refresh specific ideas regardless of existing market_signals
      query = query.in("id", idea_ids);
      console.log(`[ft_backfill] Force refreshing ${idea_ids.length} specific ideas`);
    } else {
      // Only process ideas without market_signals
      query = query.is("market_signals", null);
    }

    const { data: ideas, error: ideasError } = await query;

    if (ideasError) {
      console.error("[ft_backfill] Error fetching ideas:", ideasError);
      return new Response(JSON.stringify({ error: "Failed to fetch ideas" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ideas || ideas.length === 0) {
      return new Response(JSON.stringify({ 
        message: "No ideas need market signals backfill",
        updated_count: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[ft_backfill] Found ${ideas.length} ideas to process:`, ideas.map(i => ({ id: i.id, title: i.title })));

    // Get unique session IDs to fetch collected_data for city/province
    const sessionIds = [...new Set(ideas.map(i => i.session_id))];
    const { data: sessions } = await supabase
      .from("ft_sessions")
      .select("id, collected_data")
      .in("id", sessionIds);

    const sessionMap = new Map(sessions?.map(s => [s.id, s.collected_data]) || []);

    // Process each idea
    const results: { id: string; success: boolean; error?: string }[] = [];
    
    for (const idea of ideas) {
      try {
        const collectedData = sessionMap.get(idea.session_id) as Record<string, unknown> | undefined;
        const city = (collectedData?.city as string) || "Toronto";
        const province = (collectedData?.province as string) || "Ontario";
        // Use idea.title for specific market signals, not generic category
        const businessType = idea.title;

        console.log(`[ft_backfill] Processing idea ${idea.id}: ${businessType} in ${city}, ${province}`);

        // Call ft_market_validation
        const marketValidationUrl = `${supabaseUrl}/functions/v1/ft_market_validation`;
        const response = await fetch(marketValidationUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            business_type: businessType,
            city,
            province,
          }),
        });

        let marketSignals: MarketSignals | null = null;
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[ft_backfill] Market validation failed for ${idea.id}:`, errorText);
        } else {
          marketSignals = await response.json();
        }

        // Call ft_search_competitors for real verified competitors
        console.log(`[ft_backfill] Searching competitors for ${idea.id}: ${businessType}`);
        const competitorSearchUrl = `${supabaseUrl}/functions/v1/ft_search_competitors`;
        const competitorResponse = await fetch(competitorSearchUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            business_type: businessType,
            city,
            province,
          }),
        });

        let competitorData: {
          competitors: Array<{
            name: string;
            website?: string;
            google_rating?: number;
            review_count?: number;
            price_range?: string;
            strengths?: string[];
            weaknesses?: string[];
            is_verified: boolean;
          }>;
          competitive_gap?: string;
          market_saturation?: string;
        } | null = null;

        if (!competitorResponse.ok) {
          const errorText = await competitorResponse.text();
          console.error(`[ft_backfill] Competitor search failed for ${idea.id}:`, errorText);
        } else {
          competitorData = await competitorResponse.json();
          console.log(`[ft_backfill] Found ${competitorData?.competitors?.length || 0} verified competitors for ${idea.id}`);
        }

        // Fetch existing market_analysis to merge with competitor data
        const { data: existingIdea } = await supabase
          .from("ft_ideas")
          .select("market_analysis")
          .eq("id", idea.id)
          .single();

        // Merge verified competitors into existing market_analysis
        const updatedMarketAnalysis = competitorData ? {
          ...(existingIdea?.market_analysis as Record<string, unknown> || {}),
          competitors: competitorData.competitors,
          competitive_gap: competitorData.competitive_gap,
          market_saturation: competitorData.market_saturation,
        } : existingIdea?.market_analysis;

        // Build update object - only include fields that have data
        const updateData: Record<string, unknown> = {};
        if (marketSignals) {
          updateData.market_signals = marketSignals;
        }
        if (updatedMarketAnalysis) {
          updateData.market_analysis = updatedMarketAnalysis;
        }

        if (Object.keys(updateData).length === 0) {
          console.error(`[ft_backfill] No data to update for ${idea.id}`);
          results.push({ id: idea.id, success: false, error: "No market data retrieved" });
          continue;
        }

        // Update the idea with market signals and verified competitors
        const { error: updateError } = await supabase
          .from("ft_ideas")
          .update(updateData)
          .eq("id", idea.id);

        if (updateError) {
          console.error(`[ft_backfill] Update failed for ${idea.id}:`, updateError);
          results.push({ id: idea.id, success: false, error: updateError.message });
        } else {
          console.log(`[ft_backfill] Updated idea ${idea.id} with market signals`);
          results.push({ id: idea.id, success: true });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`[ft_backfill] Error processing idea ${idea.id}:`, error);
        results.push({ 
          id: idea.id, 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log(`[ft_backfill] Completed: ${successCount} success, ${failedCount} failed`);

    return new Response(JSON.stringify({
      message: `Backfill complete: ${successCount} updated, ${failedCount} failed`,
      updated_count: successCount,
      failed_count: failedCount,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[ft_backfill] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
