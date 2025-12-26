import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Market research data structure
interface MarketResearch {
  marketSize: {
    size_cad: string;
    growth_rate: string;
    num_businesses: string;
    citations: string[];
  };
  industryTrends: {
    trends: string[];
    opportunities: string[];
    citations: string[];
  };
  competitorData: {
    competitors: string[];
    gaps: string[];
    citations: string[];
  };
  newsData: {
    highlights: string[];
    statistics: string[];
    citations: string[];
  };
}

// Search Perplexity for market size data
async function searchMarketSize(businessType: string, province: string, apiKey: string): Promise<MarketResearch['marketSize']> {
  try {
    const query = `What is the market size for ${businessType} industry in ${province}, Canada? Include approximate revenue figures in CAD, growth rate percentage, and estimated number of businesses. Be specific with numbers.`;
    
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "Provide specific market data for Canadian businesses. Include numbers and cite sources." },
          { role: "user", content: query }
        ],
      }),
    });

    if (!response.ok) {
      console.warn("Perplexity market size search failed:", response.status);
      return { size_cad: "", growth_rate: "", num_businesses: "", citations: [] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    // Extract key data points from the response
    const sizeMatch = content.match(/\$[\d.,]+ (?:billion|million|B|M)/i);
    const growthMatch = content.match(/(\d+\.?\d*)%\s*(?:growth|CAGR|increase)/i);
    const numMatch = content.match(/([\d,]+)\s*(?:businesses|companies|establishments)/i);

    return {
      size_cad: sizeMatch?.[0] || content.slice(0, 200),
      growth_rate: growthMatch?.[1] ? `${growthMatch[1]}%` : "",
      num_businesses: numMatch?.[1] || "",
      citations: citations.slice(0, 2),
    };
  } catch (error) {
    console.error("Market size search error:", error);
    return { size_cad: "", growth_rate: "", num_businesses: "", citations: [] };
  }
}

// Search Perplexity for industry trends
async function searchIndustryTrends(businessType: string, province: string, apiKey: string): Promise<MarketResearch['industryTrends']> {
  try {
    const query = `What are the top 3-5 trends affecting ${businessType} businesses in Canada in 2024-2025? Focus on opportunities for new entrepreneurs in ${province}.`;
    
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "Provide actionable industry trends for Canadian entrepreneurs. Be specific and cite sources." },
          { role: "user", content: query }
        ],
      }),
    });

    if (!response.ok) {
      console.warn("Perplexity trends search failed:", response.status);
      return { trends: [], opportunities: [], citations: [] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    // Extract trends and opportunities from numbered lists or bullet points
    const lines = content.split('\n').filter((l: string) => l.trim());
    const trends: string[] = [];
    const opportunities: string[] = [];

    lines.forEach((line: string) => {
      const cleaned = line.replace(/^[\d\.\-\*•]+\s*/, '').trim();
      if (cleaned.length > 20 && cleaned.length < 200) {
        if (cleaned.toLowerCase().includes('opportunit') || cleaned.toLowerCase().includes('growth')) {
          opportunities.push(cleaned);
        } else {
          trends.push(cleaned);
        }
      }
    });

    return {
      trends: trends.slice(0, 4),
      opportunities: opportunities.slice(0, 3),
      citations: citations.slice(0, 2),
    };
  } catch (error) {
    console.error("Industry trends search error:", error);
    return { trends: [], opportunities: [], citations: [] };
  }
}

// Search Perplexity for competitors
async function searchCompetitors(businessType: string, city: string, province: string, apiKey: string): Promise<MarketResearch['competitorData']> {
  try {
    const query = `Who are the top 3-5 competitors or established businesses in the ${businessType} space in ${city}, ${province}, Canada? What market gaps could a new business exploit?`;
    
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "Identify real competitors and market gaps for Canadian businesses. Be specific with company names where possible." },
          { role: "user", content: query }
        ],
      }),
    });

    if (!response.ok) {
      console.warn("Perplexity competitor search failed:", response.status);
      return { competitors: [], gaps: [], citations: [] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    // Extract competitors and gaps
    const lines = content.split('\n').filter((l: string) => l.trim());
    const competitors: string[] = [];
    const gaps: string[] = [];

    lines.forEach((line: string) => {
      const cleaned = line.replace(/^[\d\.\-\*•]+\s*/, '').trim();
      if (cleaned.length > 10 && cleaned.length < 150) {
        if (cleaned.toLowerCase().includes('gap') || cleaned.toLowerCase().includes('opportunit') || cleaned.toLowerCase().includes('lack')) {
          gaps.push(cleaned);
        } else if (cleaned.match(/[A-Z][a-z]+/) && !cleaned.startsWith('The ')) {
          competitors.push(cleaned);
        }
      }
    });

    return {
      competitors: competitors.slice(0, 5),
      gaps: gaps.slice(0, 3),
      citations: citations.slice(0, 2),
    };
  } catch (error) {
    console.error("Competitor search error:", error);
    return { competitors: [], gaps: [], citations: [] };
  }
}

// Search Perplexity for recent news
async function searchRecentNews(businessType: string, province: string, apiKey: string): Promise<MarketResearch['newsData']> {
  try {
    const query = `What recent news or statistics about ${businessType} in Canada would be relevant for a business pitch? Focus on growth, investment, policy changes, or market developments in 2024-2025.`;
    
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "Provide recent, relevant news and statistics for Canadian businesses. Include specific numbers and dates." },
          { role: "user", content: query }
        ],
        search_recency_filter: "month",
      }),
    });

    if (!response.ok) {
      console.warn("Perplexity news search failed:", response.status);
      return { highlights: [], statistics: [], citations: [] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    // Extract highlights and statistics
    const lines = content.split('\n').filter((l: string) => l.trim());
    const highlights: string[] = [];
    const statistics: string[] = [];

    lines.forEach((line: string) => {
      const cleaned = line.replace(/^[\d\.\-\*•]+\s*/, '').trim();
      if (cleaned.length > 20 && cleaned.length < 200) {
        if (cleaned.match(/\d+%|\$[\d.,]+|[\d,]+ (?:jobs|businesses|million|billion)/i)) {
          statistics.push(cleaned);
        } else {
          highlights.push(cleaned);
        }
      }
    });

    return {
      highlights: highlights.slice(0, 3),
      statistics: statistics.slice(0, 3),
      citations: citations.slice(0, 3),
    };
  } catch (error) {
    console.error("News search error:", error);
    return { highlights: [], statistics: [], citations: [] };
  }
}

// Fetch all market research in parallel
async function fetchMarketResearch(
  businessType: string,
  city: string,
  province: string,
  apiKey: string
): Promise<MarketResearch> {
  console.log(`Fetching market research for: ${businessType} in ${city}, ${province}`);
  
  const [marketSize, industryTrends, competitorData, newsData] = await Promise.all([
    searchMarketSize(businessType, province, apiKey),
    searchIndustryTrends(businessType, province, apiKey),
    searchCompetitors(businessType, city, province, apiKey),
    searchRecentNews(businessType, province, apiKey),
  ]);

  return { marketSize, industryTrends, competitorData, newsData };
}

// Collect all unique citations
function collectCitations(research: MarketResearch): string[] {
  const allCitations = [
    ...research.marketSize.citations,
    ...research.industryTrends.citations,
    ...research.competitorData.citations,
    ...research.newsData.citations,
  ];
  // Remove duplicates and limit to 6
  return [...new Set(allCitations)].slice(0, 6);
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

    const { idea_id, regenerate } = await req.json();

    if (!idea_id) {
      return new Response(JSON.stringify({ error: "idea_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for existing pitch (unless regenerating)
    if (!regenerate) {
      const { data: existingContent } = await supabaseClient
        .from("ft_generated_content")
        .select("*")
        .eq("idea_id", idea_id)
        .eq("user_id", user.id)
        .eq("content_type", "pitch")
        .single();

      if (existingContent) {
        return new Response(JSON.stringify({ content: existingContent, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
    const city = collectedData.city || profile?.city || "Toronto";
    const province = collectedData.province || profile?.province || "Ontario";

    // Fetch real-time market data from Perplexity
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    let marketResearch: MarketResearch | null = null;
    let marketDataSources: string[] = [];

    if (PERPLEXITY_API_KEY) {
      console.log(`Fetching real-time market data for ${idea.title} in ${city}, ${province}`);
      try {
        marketResearch = await fetchMarketResearch(idea.title, city, province, PERPLEXITY_API_KEY);
        marketDataSources = collectCitations(marketResearch);
        console.log(`Market research completed, ${marketDataSources.length} citations found`);
      } catch (err) {
        console.warn("Market research failed, continuing without:", err);
      }
    } else {
      console.log("PERPLEXITY_API_KEY not configured, skipping market research");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert business pitch writer specializing in Canadian small businesses and startups.
Generate a comprehensive one-page business pitch that is professional, compelling, and investor-ready.
Focus on Canadian market context, regulations, and opportunities.
CRITICAL: Use the provided real-time market research data with specific numbers and statistics.
Always cite sources where market data is provided. Reference specific numbers from the market research.`;

    // Build market research section for the prompt
    let marketResearchPrompt = "";
    if (marketResearch) {
      marketResearchPrompt = `

REAL-TIME MARKET DATA (Perplexity Search - ${new Date().toLocaleDateString()}):

MARKET SIZE & GROWTH:
${marketResearch.marketSize.size_cad || 'Data being researched'}
${marketResearch.marketSize.growth_rate ? `Growth Rate: ${marketResearch.marketSize.growth_rate}` : ''}
${marketResearch.marketSize.num_businesses ? `Active Businesses: ${marketResearch.marketSize.num_businesses}` : ''}

INDUSTRY TRENDS:
${marketResearch.industryTrends.trends.length > 0 ? marketResearch.industryTrends.trends.join('\n• ') : 'Trends being analyzed'}

OPPORTUNITIES FOR NEW ENTRANTS:
${marketResearch.industryTrends.opportunities.length > 0 ? marketResearch.industryTrends.opportunities.join('\n• ') : 'Opportunities being identified'}

COMPETITOR LANDSCAPE IN ${city.toUpperCase()}:
${marketResearch.competitorData.competitors.length > 0 ? marketResearch.competitorData.competitors.join(', ') : 'Competitor analysis in progress'}
${marketResearch.competitorData.gaps.length > 0 ? `\nMarket Gaps: ${marketResearch.competitorData.gaps.join('; ')}` : ''}

RECENT NEWS & STATISTICS:
${marketResearch.newsData.highlights.length > 0 ? marketResearch.newsData.highlights.join('\n• ') : ''}
${marketResearch.newsData.statistics.length > 0 ? `\nKey Statistics: ${marketResearch.newsData.statistics.join('; ')}` : ''}

DATA SOURCES: ${marketDataSources.length > 0 ? marketDataSources.join(', ') : 'Perplexity AI search'}

IMPORTANT: Use specific numbers and statistics from this market research in your pitch. Reference the data sources where appropriate.`;
    }

    const userPrompt = `Generate a one-page business pitch for this Canadian business idea:

BUSINESS IDEA:
- Title: ${idea.title}
- Description: ${idea.description || 'N/A'}
- Category: ${idea.category || 'N/A'}
- Tagline: ${idea.tagline || 'N/A'}
- Viability Score: ${idea.viability_score || 'N/A'}/10
- Risk Level: ${idea.risk_level || 'N/A'}
- Startup Cost: $${idea.investment_min || 0} - $${idea.investment_max || 0} CAD
- Time to Launch: ${idea.time_to_launch || 'N/A'}
- Time to Revenue: ${idea.time_to_revenue || 'N/A'}

MARKET ANALYSIS:
${JSON.stringify(idea.market_analysis || {}, null, 2)}
${marketResearchPrompt}

FOUNDER:
- Name: ${profile?.full_name || '[Founder Name]'}
- Location: ${city}, ${province}
- Skills: ${collectedData.skills_background || 'N/A'}
- Budget: ${collectedData.budget || 'N/A'}
- Time Available: ${collectedData.time_commitment || 'N/A'}

Return as JSON with this exact structure:
{
  "business_name": "Suggested catchy business name",
  "elevator_pitch": "2-3 compelling sentences that capture the essence of the business. Include a specific market statistic if available.",
  "problem": "Clear description of the problem being solved (2-3 sentences)",
  "solution": "How this business uniquely solves the problem (2-3 sentences)",
  "target_customer": "Specific description of the ideal customer profile",
  "market_opportunity": "Canadian market size and opportunity with SPECIFIC data points from the market research. Include growth rates and market size figures.",
  "revenue_model": "How the business will make money with pricing examples",
  "why_now": "Market timing - why this is the right time for this business. Reference trends or news from the market research.",
  "action_plan": [
    "Day 1-7: First action item",
    "Day 8-14: Second action item",
    "Day 15-21: Third action item",
    "Day 22-30: Fourth action item"
  ],
  "market_data_sources": ["Source 1 URL", "Source 2 URL"],
  "prompt_used": "Brief summary of the prompt context used"
}`;

    console.log(`Generating pitch for idea ${idea_id}, user ${user.id}`);

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
      
      return new Response(JSON.stringify({ error: "Failed to generate pitch" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let pitchData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        pitchData = JSON.parse(jsonMatch[0]);
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

    // Ensure market_data_sources is populated
    if (!pitchData.market_data_sources || pitchData.market_data_sources.length === 0) {
      pitchData.market_data_sources = marketDataSources;
    }

    // Add the prompt summary for transparency
    pitchData.prompt_used = `Generated based on: ${idea.title} - ${idea.category || 'General'} business in ${province}. Investment range: $${idea.investment_min || 0}-$${idea.investment_max || 0} CAD.${marketResearch ? ' Enriched with real-time market data from Perplexity search.' : ''}`;
    
    // Add metadata about when market research was performed
    pitchData.market_research_date = new Date().toISOString();

    // Check if we need to update or insert
    const { data: existingRecord } = await supabaseClient
      .from("ft_generated_content")
      .select("id")
      .eq("idea_id", idea_id)
      .eq("user_id", user.id)
      .eq("content_type", "pitch")
      .single();

    let savedContent;
    if (existingRecord) {
      // Update existing
      const { data, error: updateError } = await supabaseClient
        .from("ft_generated_content")
        .update({
          content: pitchData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRecord.id)
        .select()
        .single();

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(JSON.stringify({ error: "Failed to save pitch" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      savedContent = data;
    } else {
      // Insert new
      const { data, error: insertError } = await supabaseClient
        .from("ft_generated_content")
        .insert({
          user_id: user.id,
          idea_id,
          content_type: "pitch",
          content: pitchData,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(JSON.stringify({ error: "Failed to save pitch" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      savedContent = data;
    }

    console.log(`Pitch generated successfully for user ${user.id}, idea ${idea_id}, with ${marketDataSources.length} market data sources`);

    return new Response(JSON.stringify({ content: savedContent, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Pitch generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
