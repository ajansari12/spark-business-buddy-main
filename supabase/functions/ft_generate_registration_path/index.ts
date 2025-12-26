import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegistrationStep {
  id: string;
  title: string;
  description: string;
  cost_estimate?: string;
  time_estimate?: string;
  government_url?: string;
  is_industry_specific: boolean;
  is_baseline: boolean;
  perplexity_sources?: string[];
  source_verified?: boolean;
  url_status?: string;
}

interface BusinessStructureFee {
  province_code: string;
  structure_type: string;
  verified_fee: string;
  fee_notes?: string;
  perplexity_sources?: string[];
}

interface RequestBody {
  idea_id: string;
  province: string;
  business_structure: string;
}

interface UrlHealthResult {
  accessible: boolean;
  status_code?: number;
  error?: string;
}

// Verified fallback URLs for common industry requirements
const FALLBACK_URLS: Record<string, Record<string, string>> = {
  // Common Canada-wide resources
  "insurance": {
    "default": "https://www.fsrao.ca/consumers/how-fsra-protects-consumers/property-and-other-insurance",
    "ON": "https://www.fsrao.ca/consumers/how-fsra-protects-consumers/property-and-other-insurance",
    "BC": "https://www.bcfsa.ca/industry-resources/insurance-sector",
    "AB": "https://www.abcouncil.ab.ca/",
    "QC": "https://lautorite.qc.ca/en/general-public/insurance",
  },
  "professional_liability": {
    "default": "https://www.fsrao.ca/consumers/how-fsra-protects-consumers/property-and-other-insurance",
    "ON": "https://www.fsrao.ca/consumers/how-fsra-protects-consumers/property-and-other-insurance",
  },
  "general_liability": {
    "default": "https://www.fsrao.ca/consumers/how-fsra-protects-consumers/property-and-other-insurance",
  },
  "business_insurance": {
    "default": "https://www.canada.ca/en/services/business/permits.html",
    "ON": "https://www.ontario.ca/page/business-services",
    "BC": "https://www2.gov.bc.ca/gov/content/employment-business/business",
    "AB": "https://www.alberta.ca/business.aspx",
  },
  "cyber_security": {
    "default": "https://www.cyber.gc.ca/en/guidance/cyber-security-small-business",
  },
  "cybersecure_canada": {
    "default": "https://ised-isde.canada.ca/site/cybersecure-canada/en",
  },
  "pipeda": {
    "default": "https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/",
  },
  "privacy": {
    "default": "https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/",
    "BC": "https://www.oipc.bc.ca/",
    "AB": "https://www.oipc.ab.ca/",
    "QC": "https://www.cai.gouv.qc.ca/",
  },
  "health_safety": {
    "default": "https://www.canada.ca/en/services/jobs/workplace/health-safety.html",
    "ON": "https://www.ontario.ca/page/workplace-health-and-safety",
    "BC": "https://www.worksafebc.com/",
    "AB": "https://www.alberta.ca/occupational-health-safety.aspx",
    "QC": "https://www.cnesst.gouv.qc.ca/en",
  },
  "wsib": {
    "ON": "https://www.wsib.ca/en",
  },
  "wcb": {
    "BC": "https://www.worksafebc.com/",
    "AB": "https://www.wcb.ab.ca/",
    "SK": "https://www.wcbsask.com/",
    "MB": "https://www.wcb.mb.ca/",
  },
  "permits_licenses": {
    "default": "https://www.canada.ca/en/services/business/permits.html",
    "ON": "https://www.ontario.ca/page/business-licences-and-permits",
    "BC": "https://www2.gov.bc.ca/gov/content/employment-business/business/managing-a-business/permits-licences",
    "AB": "https://www.alberta.ca/business-licences-permits.aspx",
  },
  "municipal_license": {
    "default": "https://www.canada.ca/en/services/business/permits.html",
  },
};

// Check URL health with timeout and proper error handling
async function checkUrlHealth(url: string): Promise<UrlHealthResult> {
  try {
    // Try HEAD request first (faster)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return { accessible: true, status_code: response.status };
      }
      
      // If HEAD fails with 405 (method not allowed), try GET
      if (response.status === 405) {
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), 10000);
        
        const getResponse = await fetch(url, {
          method: "GET",
          signal: getController.signal,
          redirect: "follow",
        });
        clearTimeout(getTimeoutId);
        
        return { 
          accessible: getResponse.ok, 
          status_code: getResponse.status 
        };
      }
      
      return { 
        accessible: false, 
        status_code: response.status,
        error: `HTTP ${response.status}`
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { accessible: false, error: "timeout" };
    }
    return { 
      accessible: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

// Find the best fallback URL for a step based on keywords in title
function findFallbackUrl(stepTitle: string, province: string): string | null {
  const titleLower = stepTitle.toLowerCase();
  
  // Map keywords to fallback categories
  const keywordMappings: Array<{ keywords: string[], category: string }> = [
    { keywords: ["professional liability", "errors and omissions", "e&o"], category: "professional_liability" },
    { keywords: ["general liability"], category: "general_liability" },
    { keywords: ["cyber", "cybersecure", "data protection"], category: "cyber_security" },
    { keywords: ["pipeda", "privacy"], category: "pipeda" },
    { keywords: ["wsib", "workplace safety insurance"], category: "wsib" },
    { keywords: ["wcb", "workers compensation", "worksafe"], category: "wcb" },
    { keywords: ["health and safety", "occupational health", "ohs"], category: "health_safety" },
    { keywords: ["insurance", "liability insurance", "business insurance"], category: "business_insurance" },
    { keywords: ["municipal", "city license", "business license", "permit"], category: "permits_licenses" },
  ];
  
  for (const mapping of keywordMappings) {
    for (const keyword of mapping.keywords) {
      if (titleLower.includes(keyword)) {
        const categoryUrls = FALLBACK_URLS[mapping.category];
        if (categoryUrls) {
          return categoryUrls[province] || categoryUrls["default"] || null;
        }
      }
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const perplexityApiKey = Deno.env.get("PERPLEXITY_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { idea_id, province, business_structure, force_refresh }: RequestBody & { force_refresh?: boolean } = await req.json();

    if (!idea_id || !province || !business_structure) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Generating registration path for idea: ${idea_id}, province: ${province}, structure: ${business_structure}, force_refresh: ${force_refresh}`);

    // Fetch idea details
    const { data: idea, error: ideaError } = await supabase
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

    // Check if path already exists and is recent (within 7 days) - skip if force_refresh
    if (!force_refresh) {
      const { data: existingProgress } = await supabase
        .from("ft_registration_progress")
        .select("path_generated_at, custom_steps")
        .eq("idea_id", idea_id)
        .eq("user_id", user.id)
        .single();

      if (existingProgress?.path_generated_at) {
        const pathAge = Date.now() - new Date(existingProgress.path_generated_at).getTime();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        
        if (pathAge < sevenDays && existingProgress.custom_steps?.length > 0) {
          console.log("Returning cached registration path");
          return new Response(JSON.stringify({
            success: true,
            cached: true,
            custom_steps: existingProgress.custom_steps,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    } else {
      console.log("Force refresh requested - bypassing cache");
    }

    // Get province name mapping
    const provinceNames: Record<string, string> = {
      "ON": "Ontario",
      "BC": "British Columbia",
      "AB": "Alberta",
      "QC": "Quebec",
      "SK": "Saskatchewan",
      "MB": "Manitoba",
    };
    const provinceName = provinceNames[province] || province;

    // Build context for Perplexity
    const businessDescription = `${idea.title}: ${idea.description || idea.tagline || ""}`;
    const category = idea.category || "general business";

    // Call Perplexity for industry-specific requirements
    let industrySteps: RegistrationStep[] = [];
    
    if (perplexityApiKey) {
      console.log("Querying Perplexity for industry-specific requirements...");
      
      const searchPrompt = `What specific permits, licenses, certifications, insurance requirements, and regulatory compliance steps are required for a ${category} business (specifically: ${businessDescription}) operating as a ${business_structure} in ${provinceName}, Canada?

Please focus on:
1. Industry-specific permits and licenses (beyond basic business registration)
2. Professional certifications or qualifications required
3. Insurance requirements (liability, professional, etc.)
4. Health and safety requirements
5. Environmental permits if applicable
6. Specific municipal requirements for this business type

For each requirement, provide:
- What it is
- Approximate cost
- Timeline to obtain
- Official government website URL if available

Exclude basic business registration steps (name registration, CRA business number, tax registration) - focus ONLY on industry-specific requirements.`;

      try {
        const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${perplexityApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [
              {
                role: "system",
                content: `You are a Canadian business registration expert. Return a JSON array of additional registration requirements beyond the basic steps. Format:
[
  {
    "id": "unique_step_id",
    "title": "Requirement Name",
    "description": "Clear description of what this is and why it's needed",
    "cost_estimate": "$X-$Y or Free",
    "time_estimate": "X days/weeks",
    "government_url": "https://official-url.ca (if available)"
  }
]
Only include requirements genuinely needed for this specific business type. If no additional requirements beyond basic registration, return [].`,
              },
              { role: "user", content: searchPrompt },
            ],
            max_tokens: 2000,
          }),
        });

        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json();
          const content = perplexityData.choices?.[0]?.message?.content || "";
          const citations = perplexityData.citations || [];
          
          console.log("Perplexity response:", content.substring(0, 500));
          
          // Parse the JSON array from the response
          try {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              industrySteps = parsed.map((step: any, index: number) => ({
                id: step.id || `industry_${index + 1}`,
                title: step.title,
                description: step.description,
                cost_estimate: step.cost_estimate,
                time_estimate: step.time_estimate,
                government_url: step.government_url,
                is_industry_specific: true,
                is_baseline: false,
                perplexity_sources: citations,
              }));
              console.log(`Parsed ${industrySteps.length} industry-specific steps`);
            }
          } catch (parseError) {
            console.error("Error parsing Perplexity response:", parseError);
          }
        } else {
          console.error("Perplexity API error:", perplexityResponse.status);
        }
      } catch (perplexityError) {
        console.error("Error calling Perplexity:", perplexityError);
      }
    } else {
      console.log("No Perplexity API key, skipping industry-specific requirements");
    }

    // Verify business structure fees with Perplexity
    let verifiedFees: BusinessStructureFee[] = [];
    
    if (perplexityApiKey) {
      console.log("Querying Perplexity for current business structure fees...");
      
      const feePrompt = `What are the current official government fees to register a sole proprietorship, partnership, and corporation in ${provinceName}, Canada as of 2024-2025?

Please provide:
1. Sole proprietorship registration fee (with duration if applicable)
2. General partnership registration fee
3. Corporation incorporation fee (provincial only, not federal)

Include any notes about fee variations (e.g., online vs paper, 1-year vs 5-year registration).`;

      try {
        const feeResponse = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${perplexityApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [
              {
                role: "system",
                content: `You are a Canadian business registration expert. Return a JSON array of business structure registration fees. Format:
[
  {
    "structure_type": "sole_proprietorship",
    "verified_fee": "$60 (5-year)",
    "fee_notes": "Online registration via ServiceOntario"
  },
  {
    "structure_type": "partnership",
    "verified_fee": "$60 (5-year)",
    "fee_notes": "Same as sole proprietorship"
  },
  {
    "structure_type": "corporation",
    "verified_fee": "$360",
    "fee_notes": "Provincial incorporation only"
  }
]
Only include the exact current government fees. Be precise with amounts.`,
              },
              { role: "user", content: feePrompt },
            ],
            max_tokens: 1000,
          }),
        });

        if (feeResponse.ok) {
          const feeData = await feeResponse.json();
          const feeContent = feeData.choices?.[0]?.message?.content || "";
          const feeCitations = feeData.citations || [];
          
          console.log("Fee Perplexity response:", feeContent.substring(0, 500));
          
          try {
            const feeJsonMatch = feeContent.match(/\[[\s\S]*\]/);
            if (feeJsonMatch) {
              const parsedFees = JSON.parse(feeJsonMatch[0]);
              verifiedFees = parsedFees.map((fee: any) => ({
                province_code: province,
                structure_type: fee.structure_type,
                verified_fee: fee.verified_fee,
                fee_notes: fee.fee_notes,
                perplexity_sources: feeCitations,
              }));
              console.log(`Parsed ${verifiedFees.length} verified fees`);
            }
          } catch (feeParseError) {
            console.error("Error parsing fee response:", feeParseError);
          }
        } else {
          console.error("Fee Perplexity API error:", feeResponse.status);
        }
      } catch (feeError) {
        console.error("Error calling Perplexity for fees:", feeError);
      }
    }

    // Store verified fees in database
    if (verifiedFees.length > 0) {
      for (const fee of verifiedFees) {
        await supabase
          .from("business_structure_fees")
          .upsert({
            province_code: fee.province_code,
            structure_type: fee.structure_type,
            verified_fee: fee.verified_fee,
            fee_notes: fee.fee_notes,
            perplexity_sources: fee.perplexity_sources,
            last_verified: new Date().toISOString(),
          }, {
            onConflict: "province_code,structure_type",
          });
      }
      console.log("Stored verified fees in database");
    }

    // Verify URLs are accessible with enhanced health checking and fallbacks
    console.log("Verifying URLs and applying fallbacks for broken links...");
    
    const verifiedSteps = await Promise.all(
      industrySteps.map(async (step) => {
        let finalUrl = step.government_url;
        let sourceVerified = false;
        let urlStatus = "unchecked";
        
        // Check original URL if provided
        if (step.government_url) {
          console.log(`Checking URL for "${step.title}": ${step.government_url}`);
          const healthResult = await checkUrlHealth(step.government_url);
          
          if (healthResult.accessible) {
            sourceVerified = true;
            urlStatus = "accessible";
            console.log(`  ✓ URL accessible`);
          } else {
            console.log(`  ✗ URL broken: ${healthResult.error || healthResult.status_code}`);
            urlStatus = healthResult.error === "timeout" ? "timeout" : "broken";
            
            // Try to find a fallback URL
            const fallbackUrl = findFallbackUrl(step.title, province);
            if (fallbackUrl) {
              console.log(`  → Trying fallback URL: ${fallbackUrl}`);
              const fallbackHealth = await checkUrlHealth(fallbackUrl);
              
              if (fallbackHealth.accessible) {
                finalUrl = fallbackUrl;
                sourceVerified = true;
                urlStatus = "accessible";
                console.log(`  ✓ Fallback URL accessible`);
              } else {
                // Keep original URL but mark as broken, or remove it
                finalUrl = undefined;
                sourceVerified = false;
                urlStatus = "broken";
                console.log(`  ✗ Fallback also broken, removing URL`);
              }
            } else {
              // No fallback available, remove broken URL
              finalUrl = undefined;
              sourceVerified = false;
              console.log(`  ! No fallback available, removing broken URL`);
            }
          }
        } else {
          // No URL provided, try to find a fallback
          const fallbackUrl = findFallbackUrl(step.title, province);
          if (fallbackUrl) {
            console.log(`No URL for "${step.title}", trying fallback: ${fallbackUrl}`);
            const fallbackHealth = await checkUrlHealth(fallbackUrl);
            
            if (fallbackHealth.accessible) {
              finalUrl = fallbackUrl;
              sourceVerified = true;
              urlStatus = "accessible";
              console.log(`  ✓ Fallback URL accessible`);
            }
          }
        }
        
        return {
          ...step,
          government_url: finalUrl,
          source_verified: sourceVerified,
          url_status: urlStatus,
        };
      })
    );

    // Store the custom steps in the database
    const { error: updateError } = await supabase
      .from("ft_registration_progress")
      .update({
        custom_steps: verifiedSteps,
        path_generated_at: new Date().toISOString(),
      })
      .eq("idea_id", idea_id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error storing custom steps:", updateError);
    }

    // Also store in registration_requirements table for tracking
    if (verifiedSteps.length > 0) {
      const requirementsToInsert = verifiedSteps.map(step => ({
        idea_id,
        province,
        step_id: step.id,
        title: step.title,
        description: step.description,
        cost_estimate: step.cost_estimate,
        time_estimate: step.time_estimate,
        government_url: step.government_url,
        is_industry_specific: true,
        is_baseline: false,
        source_verified: step.source_verified,
        perplexity_sources: step.perplexity_sources,
        last_verified: new Date().toISOString(),
      }));

      // Upsert to handle duplicates
      for (const req of requirementsToInsert) {
        await supabase
          .from("registration_requirements")
          .upsert(req, {
            onConflict: "idea_id,step_id",
          });
      }
    }

    // Log the event
    await supabase.from("ft_events").insert({
      user_id: user.id,
      event_name: "registration_path_generated",
      event_data: {
        idea_id,
        province,
        business_structure,
        custom_steps_count: verifiedSteps.length,
        verified_urls_count: verifiedSteps.filter(s => s.source_verified).length,
        broken_urls_fixed: verifiedSteps.filter(s => s.url_status === "accessible" && s.government_url !== industrySteps.find(i => i.id === s.id)?.government_url).length,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      cached: false,
      custom_steps: verifiedSteps,
      verified_fees: verifiedFees,
      business_type: category,
      province: provinceName,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating registration path:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
