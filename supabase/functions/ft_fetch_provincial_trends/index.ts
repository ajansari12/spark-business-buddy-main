import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_TTL_HOURS = 24;
const CACHE_TYPE = 'provincial_trends';

interface TrendingBusiness {
  name: string;
  category: string;
  growth: number;
  avgStartupCost: number;
  description: string;
  icon: string;
}

interface ProvinceStats {
  newBusinesses: number;
  topCategory: string;
  avgStartupCost: number;
  totalEntrepreneurs: number;
}

interface EmergingOpportunity {
  name: string;
  reason: string;
  growth: number;
}

interface DecliningCategory {
  name: string;
  reason: string;
  decline: number;
}

interface TrendsResponse {
  province: string;
  provinceName: string;
  topBusinessTypes: TrendingBusiness[];
  stats: ProvinceStats;
  emergingOpportunities: EmergingOpportunity[];
  categoriesToAvoid: DecliningCategory[];
  lastUpdated: string;
}

function generateCacheKey(province: string, timeRange: string): string {
  return `trends_${province.toLowerCase()}_${timeRange}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { province = 'ALL', timeRange = '30d' } = await req.json();
    const cacheKey = generateCacheKey(province, timeRange);

    // Check cache first
    const { data: cachedData } = await supabase
      .from('ft_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .eq('cache_type', CACHE_TYPE)
      .single();

    if (cachedData && new Date(cachedData.expires_at) > new Date()) {
      console.log('Returning cached trends data');
      return new Response(JSON.stringify(cachedData.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch fresh data from Perplexity
    const trendsData = await fetchTrendsFromPerplexity(province, timeRange);

    // Cache the results
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS);

    await supabase.from('ft_cache').upsert({
      cache_key: cacheKey,
      cache_type: CACHE_TYPE,
      data: trendsData,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'cache_key,cache_type' });

    return new Response(JSON.stringify(trendsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching trends:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchTrendsFromPerplexity(province: string, timeRange: string): Promise<TrendsResponse> {
  const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
  
  const provinceNames: Record<string, string> = {
    'ALL': 'All Canada',
    'AB': 'Alberta',
    'BC': 'British Columbia',
    'MB': 'Manitoba',
    'NB': 'New Brunswick',
    'NL': 'Newfoundland and Labrador',
    'NS': 'Nova Scotia',
    'NT': 'Northwest Territories',
    'NU': 'Nunavut',
    'ON': 'Ontario',
    'PE': 'Prince Edward Island',
    'QC': 'Quebec',
    'SK': 'Saskatchewan',
    'YT': 'Yukon',
  };

  const timeRangeLabels: Record<string, string> = {
    '30d': 'in the last 30 days',
    '90d': 'in the last 90 days (3 months)',
    '1y': 'in the past year',
  };

  const provinceName = provinceNames[province] || 'All Canada';
  const locationContext = province === 'ALL' 
    ? 'across Canada' 
    : `in ${provinceName}, Canada`;
  const timeContext = timeRangeLabels[timeRange] || 'in the last 30 days';

  const prompt = `Analyze the current business trends ${locationContext} ${timeContext} for 2024-2025.

Return a JSON object with this exact structure:
{
  "topBusinessTypes": [
    {
      "name": "Business type name",
      "category": "Category (e.g., Technology, Food, Health)",
      "growth": 25,
      "avgStartupCost": 15000,
      "description": "Brief description of why it's trending",
      "icon": "one of: store, laptop, truck, heart, utensils, home, briefcase, camera, wrench, leaf"
    }
  ],
  "stats": {
    "newBusinesses": 12500,
    "topCategory": "Technology",
    "avgStartupCost": 25000,
    "totalEntrepreneurs": 85000
  },
  "emergingOpportunities": [
    {
      "name": "Opportunity name",
      "reason": "Why it's emerging",
      "growth": 45
    }
  ],
  "categoriesToAvoid": [
    {
      "name": "Category name",
      "reason": "Why to avoid",
      "decline": -15
    }
  ]
}

Provide exactly 5 topBusinessTypes, 3 emergingOpportunities, and 2 categoriesToAvoid.
Use realistic Canadian market data for the ${timeContext} period. Growth values are percentages (positive for growth, negative for decline).
Return ONLY valid JSON, no additional text.`;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: 'You are a Canadian business trends analyst. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      province,
      provinceName,
      topBusinessTypes: parsed.topBusinessTypes || [],
      stats: parsed.stats || { newBusinesses: 0, topCategory: 'Unknown', avgStartupCost: 0, totalEntrepreneurs: 0 },
      emergingOpportunities: parsed.emergingOpportunities || [],
      categoriesToAvoid: parsed.categoriesToAvoid || [],
      lastUpdated: new Date().toISOString(),
    };

  } catch (error) {
    console.error('Perplexity API error:', error);
    
    // Return fallback data
    return {
      province,
      provinceName,
      topBusinessTypes: [
        { name: 'E-commerce Store', category: 'Retail', growth: 28, avgStartupCost: 5000, description: 'Online retail continues to grow', icon: 'store' },
        { name: 'Digital Marketing Agency', category: 'Marketing', growth: 22, avgStartupCost: 3000, description: 'Demand for digital services increasing', icon: 'laptop' },
        { name: 'Food Truck', category: 'Food', growth: 18, avgStartupCost: 50000, description: 'Mobile food service trending', icon: 'truck' },
        { name: 'Home Health Services', category: 'Health', growth: 35, avgStartupCost: 10000, description: 'Aging population driving demand', icon: 'heart' },
        { name: 'Meal Prep Service', category: 'Food', growth: 24, avgStartupCost: 8000, description: 'Health-conscious consumers growing', icon: 'utensils' },
      ],
      stats: { newBusinesses: 15000, topCategory: 'Technology', avgStartupCost: 25000, totalEntrepreneurs: 85000 },
      emergingOpportunities: [
        { name: 'AI Consulting', reason: 'Businesses adopting AI rapidly', growth: 85 },
        { name: 'Sustainable Products', reason: 'Environmental awareness increasing', growth: 45 },
        { name: 'Senior Care Tech', reason: 'Aging population needs', growth: 55 },
      ],
      categoriesToAvoid: [
        { name: 'Traditional Print Media', reason: 'Declining readership', decline: -18 },
        { name: 'DVD/Video Rental', reason: 'Streaming dominance', decline: -35 },
      ],
      lastUpdated: new Date().toISOString(),
    };
  }
}
