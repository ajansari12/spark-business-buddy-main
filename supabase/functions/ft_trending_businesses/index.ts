import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cache configuration
const CACHE_TTL_SECONDS = 3600; // 1 hour
const CACHE_TYPE = "trending_businesses";

interface TrendingRequest {
  budget_min: number;
  budget_max: number;
  province: string;
  city?: string;
  skills_background?: string;
  force_refresh?: boolean;
}

interface TrendingBusiness {
  business_type: string;
  trend_reason: string;
  estimated_cost_min: number;
  estimated_cost_max: number;
  growth_potential: "High" | "Medium" | "Moderate";
  time_to_launch: string;
  why_trending: string;
}

interface TrendingResponse {
  businesses: TrendingBusiness[];
  citations: string[];
  _meta?: {
    cached_at?: string;
    expires_at?: string;
    from_cache?: boolean;
    stale?: boolean;
  };
}

// Simple hash function for skills string
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

// Generate cache key from request parameters
function generateCacheKey(params: TrendingRequest): string {
  const skillsHash = params.skills_background 
    ? hashString(params.skills_background.toLowerCase().trim())
    : "none";
  
  return `trending::${params.province}::${params.city || 'none'}::${params.budget_min}::${params.budget_max}::${skillsHash}`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      console.error("PERPLEXITY_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Search service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const body: TrendingRequest = await req.json();
    const { budget_min, budget_max, province, city, skills_background, force_refresh = false } = body;

    if (!budget_min || !budget_max || !province) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: budget_min, budget_max, province" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cacheKey = generateCacheKey(body);
    console.log(`[ft_trending_businesses] Cache key: ${cacheKey}, force_refresh: ${force_refresh}`);

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
          console.log(`[ft_trending_businesses] Cache HIT (fresh) for ${cacheKey}`);
          const response = cached.data as TrendingResponse;
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
          console.log(`[ft_trending_businesses] Cache STALE for ${cacheKey}, returning stale + refreshing`);
          
          // Trigger background refresh (don't await)
          refreshCacheInBackground(supabaseUrl, supabaseServiceKey, cacheKey, body, PERPLEXITY_API_KEY);
          
          const response = cached.data as TrendingResponse;
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

    console.log(`[ft_trending_businesses] Cache MISS, calling Perplexity API for ${city || province}`);

    // ========================================================================
    // CALL PERPLEXITY API
    // ========================================================================
    let response: TrendingResponse;
    try {
      response = await fetchTrendingBusinesses(body, PERPLEXITY_API_KEY);
    } catch (apiError) {
      console.error("[ft_trending_businesses] Perplexity API error:", apiError);
      
      // Graceful degradation: try to return stale cache if available
      const { data: staleCache } = await supabase
        .from("ft_cache")
        .select("data, updated_at, expires_at")
        .eq("cache_key", cacheKey)
        .eq("cache_type", CACHE_TYPE)
        .maybeSingle();

      if (staleCache) {
        console.log("[ft_trending_businesses] API failed, returning stale cache as fallback");
        const staleResponse = staleCache.data as TrendingResponse;
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
        data: response,
        expires_at: expiresAt,
        updated_at: now,
      }, { onConflict: "cache_key,cache_type" });

    if (upsertError) {
      console.error("[ft_trending_businesses] Cache write error:", upsertError);
    } else {
      console.log(`[ft_trending_businesses] Cached result for ${cacheKey}, expires: ${expiresAt}`);
    }

    console.log(`[ft_trending_businesses] Returning ${response.businesses.length} trending businesses`);

    return new Response(
      JSON.stringify({
        ...response,
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
    console.error("[ft_trending_businesses] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function fetchTrendingBusinesses(
  params: TrendingRequest,
  apiKey: string
): Promise<TrendingResponse> {
  const { budget_min, budget_max, province, city, skills_background } = params;

  const location = city ? `${city}, ${province}` : province;
  const skillsContext = skills_background 
    ? `The entrepreneur has experience in: ${skills_background}. Consider businesses that leverage or complement these skills.`
    : "";

  const searchQuery = `What are the top 6-8 trending and emerging small business opportunities in ${location}, Canada in 2025 for someone with a startup budget of $${budget_min.toLocaleString()}-$${budget_max.toLocaleString()} CAD?

${skillsContext}

For each business, provide:
1. Business type/name
2. Why it's trending now (market demand, growth factors)
3. Estimated startup cost range in CAD
4. Growth potential (High/Medium/Moderate)
5. Time to launch estimate

Focus on:
- Businesses growing in demand in Canada
- Low barrier to entry within the budget
- Local market opportunities in ${location}
- Emerging trends and underserved niches`;

  const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "system",
          content: `You are a business opportunity analyst specializing in Canadian small business trends. 
          
Return your response as a valid JSON object with this exact structure:
{
  "businesses": [
    {
      "business_type": "Name of the business type",
      "trend_reason": "Brief explanation of why this is trending",
      "estimated_cost_min": 5000,
      "estimated_cost_max": 15000,
      "growth_potential": "High",
      "time_to_launch": "2-4 weeks",
      "why_trending": "Detailed explanation of market opportunity"
    }
  ]
}

Requirements:
- Return 6-8 businesses maximum
- All costs must be in CAD (numbers only, no currency symbols)
- growth_potential must be exactly "High", "Medium", or "Moderate"
- Be specific to the Canadian market and local opportunities
- Only suggest businesses within the given budget range
- Return ONLY the JSON object, no other text`
        },
        { role: "user", content: searchQuery }
      ],
      search_recency_filter: "month",
    }),
  });

  if (!perplexityResponse.ok) {
    const errorText = await perplexityResponse.text();
    console.error("[ft_trending_businesses] Perplexity API error:", perplexityResponse.status, errorText);
    throw new Error("Failed to search for trending businesses");
  }

  const perplexityData = await perplexityResponse.json();
  const content = perplexityData.choices?.[0]?.message?.content || "";
  const citations = perplexityData.citations || [];

  console.log("[ft_trending_businesses] Raw response:", content.substring(0, 500));

  // Parse the JSON response
  let businesses: TrendingBusiness[] = [];
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*"businesses"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      businesses = parsed.businesses || [];
    } else {
      // Try parsing the whole content
      const parsed = JSON.parse(content);
      businesses = parsed.businesses || [];
    }

    // Validate and clean the businesses
    businesses = businesses
      .filter((b: TrendingBusiness) => 
        b.business_type && 
        typeof b.estimated_cost_min === "number" &&
        typeof b.estimated_cost_max === "number"
      )
      .map((b: TrendingBusiness) => ({
        business_type: b.business_type,
        trend_reason: b.trend_reason || "Emerging market opportunity",
        estimated_cost_min: b.estimated_cost_min,
        estimated_cost_max: b.estimated_cost_max,
        growth_potential: ["High", "Medium", "Moderate"].includes(b.growth_potential) 
          ? b.growth_potential 
          : "Medium",
        time_to_launch: b.time_to_launch || "4-8 weeks",
        why_trending: b.why_trending || b.trend_reason || "Growing demand in the Canadian market",
      }))
      .slice(0, 8); // Max 8 businesses

  } catch (parseError) {
    console.error("[ft_trending_businesses] Failed to parse response:", parseError);
    // Return a fallback response
    businesses = [
      {
        business_type: "Mobile Services Business",
        trend_reason: "Growing demand for convenience services",
        estimated_cost_min: Math.max(params.budget_min, 5000),
        estimated_cost_max: Math.min(params.budget_max, 20000),
        growth_potential: "High",
        time_to_launch: "2-4 weeks",
        why_trending: "Canadians increasingly prefer on-demand mobile services for convenience"
      },
      {
        business_type: "E-commerce Specialty Store",
        trend_reason: "Online shopping continues to grow",
        estimated_cost_min: Math.max(params.budget_min, 2000),
        estimated_cost_max: Math.min(params.budget_max, 15000),
        growth_potential: "High",
        time_to_launch: "1-2 weeks",
        why_trending: "Niche products with targeted marketing see strong growth"
      },
      {
        business_type: "Local Service Franchise",
        trend_reason: "Proven business model with support",
        estimated_cost_min: Math.max(params.budget_min, 10000),
        estimated_cost_max: Math.min(params.budget_max, 50000),
        growth_potential: "Medium",
        time_to_launch: "4-8 weeks",
        why_trending: "Lower risk entry into business ownership"
      }
    ];
  }

  return {
    businesses,
    citations: Array.isArray(citations) ? citations : [],
  };
}

// Background refresh function (fire-and-forget)
function refreshCacheInBackground(
  supabaseUrl: string,
  supabaseServiceKey: string,
  cacheKey: string,
  params: TrendingRequest,
  apiKey: string
): void {
  // Create fresh client for background task
  const bgSupabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const refreshTask = (async () => {
    try {
      console.log(`[ft_trending_businesses] Background refresh starting for ${cacheKey}`);
      const response = await fetchTrendingBusinesses(params, apiKey);
      
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

      console.log(`[ft_trending_businesses] Background refresh completed for ${cacheKey}`);
    } catch (error) {
      console.error("[ft_trending_businesses] Background refresh failed:", error);
    }
  })();

  // Fire and forget - don't await
  refreshTask.catch(() => {}); // Suppress unhandled promise rejection
}
