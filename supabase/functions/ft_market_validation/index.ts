import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cache configuration - 6 hours for market validation (changes more frequently)
const CACHE_TTL_SECONDS = 21600; // 6 hours
const CACHE_TYPE = "market_validation";

interface MarketValidationRequest {
  business_type: string;
  city: string;
  province: string;
  force_refresh?: boolean;
}

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
  _meta?: {
    cached_at?: string;
    expires_at?: string;
    from_cache?: boolean;
    stale?: boolean;
  };
}

// Generate cache key from request parameters
function generateCacheKey(params: MarketValidationRequest): string {
  return `market::${params.business_type.toLowerCase().trim()}::${params.city.toLowerCase().trim()}::${params.province.toLowerCase().trim()}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const perplexityApiKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!perplexityApiKey) {
      return new Response(JSON.stringify({ error: "PERPLEXITY_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client for caching
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: MarketValidationRequest = await req.json();
    const { business_type, city, province, force_refresh = false } = body;

    if (!business_type || !city || !province) {
      return new Response(JSON.stringify({ error: "Missing required fields: business_type, city, province" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cacheKey = generateCacheKey(body);
    console.log(`[ft_market_validation] Cache key: ${cacheKey}, force_refresh: ${force_refresh}`);

    // ========================================================================
    // CHECK CACHE (unless force_refresh is true)
    // ========================================================================
    if (!force_refresh) {
      const { data: cached, error: cacheError } = await supabase
        .from("ft_cache")
        .select("data, expires_at, updated_at")
        .eq("cache_key", cacheKey)
        .eq("cache_type", CACHE_TYPE)
        .maybeSingle();

      if (!cacheError && cached) {
        const expiresAt = new Date(cached.expires_at);
        const now = new Date();
        
        if (expiresAt > now) {
          // Cache is fresh - return immediately
          console.log(`[ft_market_validation] Cache HIT (fresh) for ${cacheKey}`);
          const response = cached.data as MarketSignals;
          return new Response(
            JSON.stringify({
              ...response,
              _meta: {
                cached_at: cached.updated_at,
                expires_at: cached.expires_at,
                from_cache: true,
                stale: false,
              },
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          // Cache is stale - return stale data and trigger background refresh
          console.log(`[ft_market_validation] Cache STALE for ${cacheKey}, returning stale + refreshing`);
          
          refreshCacheInBackground(supabaseUrl, supabaseServiceKey, cacheKey, body, perplexityApiKey);
          
          const response = cached.data as MarketSignals;
          return new Response(
            JSON.stringify({
              ...response,
              _meta: {
                cached_at: cached.updated_at,
                expires_at: cached.expires_at,
                from_cache: true,
                stale: true,
              },
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    console.log(`[ft_market_validation] Cache MISS, calling Perplexity API for ${business_type} in ${city}`);

    // ========================================================================
    // CALL PERPLEXITY API
    // ========================================================================
    let marketSignals: MarketSignals;
    try {
      marketSignals = await fetchMarketSignals(body, perplexityApiKey);
    } catch (apiError) {
      console.error("[ft_market_validation] Perplexity API error:", apiError);
      
      // Graceful degradation: try to return stale cache if available
      const { data: staleCache } = await supabase
        .from("ft_cache")
        .select("data, updated_at, expires_at")
        .eq("cache_key", cacheKey)
        .eq("cache_type", CACHE_TYPE)
        .maybeSingle();

      if (staleCache) {
        console.log("[ft_market_validation] API failed, returning stale cache as fallback");
        const staleResponse = staleCache.data as MarketSignals;
        return new Response(
          JSON.stringify({
            ...staleResponse,
            _meta: {
              cached_at: staleCache.updated_at,
              expires_at: staleCache.expires_at,
              from_cache: true,
              stale: true,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw apiError;
    }

    // ========================================================================
    // STORE IN CACHE
    // ========================================================================
    const expiresAt = new Date(Date.now() + CACHE_TTL_SECONDS * 1000).toISOString();
    const now = new Date().toISOString();

    const { error: upsertError } = await supabase
      .from("ft_cache")
      .upsert({
        cache_key: cacheKey,
        cache_type: CACHE_TYPE,
        data: marketSignals,
        expires_at: expiresAt,
        updated_at: now,
      }, { onConflict: "cache_key,cache_type" });

    if (upsertError) {
      console.error("[ft_market_validation] Cache write error:", upsertError);
    } else {
      console.log(`[ft_market_validation] Cached result for ${cacheKey}, expires: ${expiresAt}`);
    }

    console.log(`[ft_market_validation] Returning market signals for "${business_type}": demand=${marketSignals.demand_indicator}`);

    return new Response(
      JSON.stringify({
        ...marketSignals,
        _meta: {
          cached_at: now,
          expires_at: expiresAt,
          from_cache: false,
          stale: false,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[ft_market_validation] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function fetchMarketSignals(
  params: MarketValidationRequest,
  apiKey: string
): Promise<MarketSignals> {
  const { business_type, city, province } = params;

  console.log(`[ft_market_validation] Validating market for "${business_type}" in ${city}, ${province}`);

  // Parallel searches for different market signals
  const [jobPostingsResult, businessActivityResult, regulatoryResult, newsResult] = await Promise.all([
    searchJobPostings(business_type, city, province, apiKey),
    searchBusinessActivity(business_type, city, province, apiKey),
    searchRegulations(business_type, province, apiKey),
    searchNews(business_type, city, province, apiKey),
  ]);

  // Aggregate demand indicator
  let demandScore = 0;
  if (jobPostingsResult.count >= 10) demandScore += 2;
  else if (jobPostingsResult.count >= 5) demandScore += 1;
  
  if (businessActivityResult.openings.length > businessActivityResult.closures.length) demandScore += 2;
  else if (businessActivityResult.openings.length >= businessActivityResult.closures.length) demandScore += 1;
  
  if (newsResult.sentiment === "positive") demandScore += 2;
  else if (newsResult.sentiment === "neutral") demandScore += 1;

  const demandIndicator: "high" | "moderate" | "low" = 
    demandScore >= 5 ? "high" : demandScore >= 3 ? "moderate" : "low";

  return {
    job_posting_count: jobPostingsResult.count,
    job_posting_examples: jobPostingsResult.examples,
    recent_business_activity: {
      openings: businessActivityResult.openings,
      closures: businessActivityResult.closures,
    },
    regulatory_notes: regulatoryResult.notes,
    news_sentiment: newsResult.sentiment,
    news_highlights: newsResult.highlights,
    demand_indicator: demandIndicator,
    citations: [
      ...jobPostingsResult.citations,
      ...businessActivityResult.citations,
      ...regulatoryResult.citations,
      ...newsResult.citations,
    ].slice(0, 10),
  };
}

async function searchJobPostings(
  businessType: string,
  city: string,
  province: string,
  apiKey: string
): Promise<{ count: number; examples: string[]; citations: string[] }> {
  try {
    const query = `How many job postings are there for "${businessType}" business or related positions in ${city}, ${province}, Canada? This is a business idea for starting a company. List 3-5 examples of actual job postings or companies hiring in this specific industry.`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: `You are a job market researcher. Respond in JSON format:
{
  "estimated_job_count": number,
  "examples": ["Job title at Company A", "Job title at Company B"],
  "notes": "Brief analysis"
}`,
          },
          { role: "user", content: query },
        ],
        search_recency_filter: "month",
      }),
    });

    if (!response.ok) {
      console.error(`Job posting search failed: ${response.status}`);
      return { count: 0, examples: [], citations: [] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          count: parsed.estimated_job_count || 0,
          examples: parsed.examples || [],
          citations,
        };
      }
    } catch {
      const countMatch = content.match(/(\d+)\s*(job|position|posting)/i);
      return {
        count: countMatch ? parseInt(countMatch[1]) : 0,
        examples: [],
        citations,
      };
    }

    return { count: 0, examples: [], citations };
  } catch (error) {
    console.error("Job posting search error:", error);
    return { count: 0, examples: [], citations: [] };
  }
}

async function searchBusinessActivity(
  businessType: string,
  city: string,
  province: string,
  apiKey: string
): Promise<{ openings: string[]; closures: string[]; citations: string[] }> {
  try {
    const query = `Recent business activity for companies providing "${businessType}" services or products in ${city}, ${province}, Canada in the past year. This is a specific business industry. List any new similar businesses that opened and any that closed.`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: `You are a business analyst. Respond in JSON format:
{
  "openings": ["New business name 1", "New business name 2"],
  "closures": ["Closed business name"],
  "market_trend": "growing|stable|declining"
}`,
          },
          { role: "user", content: query },
        ],
        search_recency_filter: "year",
      }),
    });

    if (!response.ok) {
      return { openings: [], closures: [], citations: [] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          openings: parsed.openings || [],
          closures: parsed.closures || [],
          citations,
        };
      }
    } catch {
      // Return empty on parse failure
    }

    return { openings: [], closures: [], citations };
  } catch (error) {
    console.error("Business activity search error:", error);
    return { openings: [], closures: [], citations: [] };
  }
}

async function searchRegulations(
  businessType: string,
  province: string,
  apiKey: string
): Promise<{ notes: string; citations: string[] }> {
  try {
    const query = `What are the key regulations, permits, and licenses required to start a "${businessType}" business or company in ${province}, Canada? Focus on this specific type of business.`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "You are a Canadian business regulation expert. Provide a concise summary of key requirements in 2-3 sentences.",
          },
          { role: "user", content: query },
        ],
      }),
    });

    if (!response.ok) {
      return { notes: "Unable to fetch regulatory information", citations: [] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    const notes = content.replace(/```[\s\S]*?```/g, "").trim();

    return { notes, citations };
  } catch (error) {
    console.error("Regulation search error:", error);
    return { notes: "Unable to fetch regulatory information", citations: [] };
  }
}

async function searchNews(
  businessType: string,
  city: string,
  province: string,
  apiKey: string
): Promise<{ sentiment: "positive" | "neutral" | "negative"; highlights: string[]; citations: string[] }> {
  try {
    const query = `Recent news about the "${businessType}" industry and market in ${city}, ${province}, Canada. This is a specific business type. Is the business outlook positive, neutral, or negative for starting this type of company?`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: `You are a business news analyst. Respond in JSON format:
{
  "sentiment": "positive" | "neutral" | "negative",
  "highlights": ["Key news point 1", "Key news point 2"],
  "outlook": "Brief analysis"
}`,
          },
          { role: "user", content: query },
        ],
        search_recency_filter: "month",
      }),
    });

    if (!response.ok) {
      return { sentiment: "neutral", highlights: [], citations: [] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          sentiment: parsed.sentiment || "neutral",
          highlights: parsed.highlights || [],
          citations,
        };
      }
    } catch {
      const lowerContent = content.toLowerCase();
      const positiveWords = ["growth", "growing", "positive", "increase", "opportunity", "boom", "thriving"];
      const negativeWords = ["decline", "closing", "negative", "decrease", "struggling", "challenging"];
      
      const positiveCount = positiveWords.filter(w => lowerContent.includes(w)).length;
      const negativeCount = negativeWords.filter(w => lowerContent.includes(w)).length;
      
      const sentiment = positiveCount > negativeCount ? "positive" : 
                       negativeCount > positiveCount ? "negative" : "neutral";
      
      return { sentiment, highlights: [], citations };
    }

    return { sentiment: "neutral", highlights: [], citations };
  } catch (error) {
    console.error("News search error:", error);
    return { sentiment: "neutral", highlights: [], citations: [] };
  }
}

// Background refresh function (fire-and-forget)
function refreshCacheInBackground(
  supabaseUrl: string,
  supabaseServiceKey: string,
  cacheKey: string,
  params: MarketValidationRequest,
  apiKey: string
): void {
  const bgSupabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const refreshTask = (async () => {
    try {
      console.log(`[ft_market_validation] Background refresh starting for ${cacheKey}`);
      const response = await fetchMarketSignals(params, apiKey);
      
      const expiresAt = new Date(Date.now() + CACHE_TTL_SECONDS * 1000).toISOString();
      const now = new Date().toISOString();

      await bgSupabase
        .from("ft_cache")
        .upsert({
          cache_key: cacheKey,
          cache_type: CACHE_TYPE,
          data: response,
          expires_at: expiresAt,
          updated_at: now,
        }, { onConflict: "cache_key,cache_type" });

      console.log(`[ft_market_validation] Background refresh completed for ${cacheKey}`);
    } catch (error) {
      console.error("[ft_market_validation] Background refresh failed:", error);
    }
  })();

  refreshTask.catch(() => {});
}
