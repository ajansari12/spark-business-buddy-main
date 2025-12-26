import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache configuration - 24 hours for competitor data (relatively stable)
const CACHE_TTL_SECONDS = 86400; // 24 hours
const CACHE_TYPE = "competitors";

interface CompetitorSearchRequest {
  business_type: string;
  city: string;
  province: string;
  count?: number;
  force_refresh?: boolean;
}

interface VerifiedCompetitor {
  name: string;
  description: string;
  website?: string;
  google_rating?: string;
  price_range?: string;
  strengths: string[];
  weaknesses: string[];
  is_verified: boolean;
}

interface CompetitorSearchResponse {
  competitors: VerifiedCompetitor[];
  competitive_gap: string;
  market_saturation: string;
  citations: string[];
  _meta?: {
    cached_at?: string;
    expires_at?: string;
    from_cache?: boolean;
    stale?: boolean;
  };
}

// Generate cache key from request parameters
function generateCacheKey(params: CompetitorSearchRequest): string {
  return `competitors::${params.business_type.toLowerCase().trim()}::${params.city.toLowerCase().trim()}::${params.province.toLowerCase().trim()}`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    
    console.log('[ft_search_competitors] Checking PERPLEXITY_API_KEY...');
    
    if (!PERPLEXITY_API_KEY) {
      console.error('[ft_search_competitors] PERPLEXITY_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Search service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client for caching
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestBody: CompetitorSearchRequest = await req.json();
    const { business_type, city, province, count = 5, force_refresh = false } = requestBody;

    if (!business_type || !city || !province) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: business_type, city, province' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cacheKey = generateCacheKey(requestBody);
    console.log(`[ft_search_competitors] Cache key: ${cacheKey}, force_refresh: ${force_refresh}`);

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
          console.log(`[ft_search_competitors] Cache HIT (fresh) for ${cacheKey}`);
          const response = cached.data as CompetitorSearchResponse;
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
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Cache is stale - return stale data and trigger background refresh
          console.log(`[ft_search_competitors] Cache STALE for ${cacheKey}, returning stale + refreshing`);
          
          refreshCacheInBackground(supabaseUrl, supabaseServiceKey, cacheKey, requestBody, PERPLEXITY_API_KEY);
          
          const response = cached.data as CompetitorSearchResponse;
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
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    console.log(`[ft_search_competitors] Cache MISS, calling Perplexity API for ${business_type} in ${city}`);

    // ========================================================================
    // CALL PERPLEXITY API
    // ========================================================================
    let response: CompetitorSearchResponse;
    try {
      response = await fetchCompetitors(requestBody, PERPLEXITY_API_KEY);
    } catch (apiError) {
      console.error("[ft_search_competitors] Perplexity API error:", apiError);
      
      // Graceful degradation: try to return stale cache if available
      const { data: staleCache } = await supabase
        .from("ft_cache")
        .select("data, updated_at, expires_at")
        .eq("cache_key", cacheKey)
        .eq("cache_type", CACHE_TYPE)
        .maybeSingle();

      if (staleCache) {
        console.log("[ft_search_competitors] API failed, returning stale cache as fallback");
        const staleResponse = staleCache.data as CompetitorSearchResponse;
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
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      console.error("[ft_search_competitors] Cache write error:", upsertError);
    } else {
      console.log(`[ft_search_competitors] Cached result for ${cacheKey}, expires: ${expiresAt}`);
    }

    console.log(`[ft_search_competitors] Returning ${response.competitors.length} competitors`);

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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ft_search_competitors] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        competitors: [],
        competitive_gap: '',
        market_saturation: 'Unknown',
        citations: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function fetchCompetitors(
  params: CompetitorSearchRequest,
  apiKey: string
): Promise<CompetitorSearchResponse> {
  const { business_type, city, province, count = 5 } = params;
  const targetCount = Math.min(Math.max(count, 3), 15);
  
  console.log(`[ft_search_competitors] Searching ${targetCount} competitors for: ${business_type} in ${city}, ${province}`);

  const searchQuery = `Find the top ${targetCount} ${business_type} businesses in ${city}, ${province}, Canada. For each business provide: company name, brief description, website URL if available, Google rating and review count, approximate price range or pricing tiers, 2 key strengths, and 2 weaknesses or gaps in their service. Also identify what market opportunity or gap exists that a new business could fill.`;

  const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: `You are a market research assistant. Return competitor analysis in valid JSON format only. Structure:
{
  "competitors": [
    {
      "name": "Business Name",
      "description": "Brief description of what they do",
      "website": "example.com",
      "google_rating": "4.5 (123 reviews)",
      "price_range": "$1,000 - $5,000",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"]
    }
  ],
  "competitive_gap": "Description of market opportunity",
  "market_saturation": "Low/Moderate/High - X active competitors found"
}
Return ONLY valid JSON, no markdown or explanation.`
        },
        { role: 'user', content: searchQuery }
      ],
      temperature: 0.2,
      max_tokens: 2000,
    }),
  });

  if (!perplexityResponse.ok) {
    const errorText = await perplexityResponse.text();
    console.error('[ft_search_competitors] Perplexity API error:', perplexityResponse.status, errorText);
    throw new Error('Failed to search for competitors');
  }

  const perplexityData = await perplexityResponse.json();
  const content = perplexityData.choices?.[0]?.message?.content || '';
  const citations = perplexityData.citations || [];

  // Parse the JSON response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        competitors: (parsed.competitors || []).map((c: VerifiedCompetitor) => ({
          name: c.name || 'Unknown Business',
          description: c.description || '',
          website: c.website,
          google_rating: c.google_rating,
          price_range: c.price_range,
          strengths: Array.isArray(c.strengths) ? c.strengths : [],
          weaknesses: Array.isArray(c.weaknesses) ? c.weaknesses : [],
          is_verified: true,
        })),
        competitive_gap: parsed.competitive_gap || 'Market opportunity exists for differentiated service',
        market_saturation: parsed.market_saturation || 'Moderate',
        citations,
      };
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (parseError) {
    console.error('[ft_search_competitors] Error parsing Perplexity response:', parseError);
    console.log('[ft_search_competitors] Raw content:', content.substring(0, 500));
    
    return {
      competitors: [],
      competitive_gap: 'Market analysis in progress',
      market_saturation: 'Unknown',
      citations,
    };
  }
}

// Background refresh function (fire-and-forget)
function refreshCacheInBackground(
  supabaseUrl: string,
  supabaseServiceKey: string,
  cacheKey: string,
  params: CompetitorSearchRequest,
  apiKey: string
): void {
  const bgSupabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const refreshTask = (async () => {
    try {
      console.log(`[ft_search_competitors] Background refresh starting for ${cacheKey}`);
      const response = await fetchCompetitors(params, apiKey);
      
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

      console.log(`[ft_search_competitors] Background refresh completed for ${cacheKey}`);
    } catch (error) {
      console.error("[ft_search_competitors] Background refresh failed:", error);
    }
  })();

  refreshTask.catch(() => {});
}
