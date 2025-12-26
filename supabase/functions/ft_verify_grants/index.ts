import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// INPUT VALIDATION SCHEMAS
// ============================================================================

const uuidSchema = z.string().uuid("Invalid UUID format");

const verificationRequestSchema = z.object({
  grant_id: uuidSchema.optional(),
  grant_ids: z.array(uuidSchema).max(100, "Maximum 100 grants per request").optional(),
  grant_name: z.string().max(200, "Grant name too long").optional(),
  batch: z.boolean().optional(),
  stale_days: z.number().int().min(1).max(365).optional(),
  verify_all: z.boolean().optional(),
}).refine(
  (data) => data.grant_id || data.grant_ids || data.grant_name || data.batch || data.verify_all,
  { message: "Must provide grant_id, grant_ids, grant_name, batch=true, or verify_all=true" }
);

type VerificationRequest = z.infer<typeof verificationRequestSchema>;

interface VerificationResult {
  grant_id: string;
  grant_name: string;
  current_status: "open" | "closed" | "unknown";
  confidence: "high" | "medium" | "low";
  sources: string[];
  deadline_found?: string;
  notes: string;
  raw_response?: string;
  url_status?: "accessible" | "broken" | "timeout";
}

interface UrlHealthResult {
  isAccessible: boolean;
  statusCode?: number;
  error?: string;
}

// Check if application URL is accessible
async function checkUrlHealth(url: string): Promise<UrlHealthResult> {
  if (!url) {
    return { isAccessible: true }; // No URL = skip check
  }
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    // Use HEAD request first (faster, less bandwidth)
    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "FastTrack-LinkChecker/1.0"
      },
      redirect: "follow"
    });
    
    clearTimeout(timeout);
    
    // Check for common error status codes
    if (response.status === 404) {
      return { isAccessible: false, statusCode: 404, error: "Page not found (404)" };
    }
    if (response.status === 410) {
      return { isAccessible: false, statusCode: 410, error: "Page permanently removed (410)" };
    }
    if (response.status >= 500) {
      return { isAccessible: false, statusCode: response.status, error: `Server error (${response.status})` };
    }
    
    return { isAccessible: true, statusCode: response.status };
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name === "AbortError") {
      return { isAccessible: false, error: "Request timeout (10s)" };
    }
    // Some servers block HEAD requests, try GET as fallback
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "FastTrack-LinkChecker/1.0"
        },
        redirect: "follow"
      });
      
      clearTimeout(timeout);
      
      if (response.status === 404) {
        return { isAccessible: false, statusCode: 404, error: "Page not found (404)" };
      }
      if (response.status === 410) {
        return { isAccessible: false, statusCode: 410, error: "Page permanently removed (410)" };
      }
      if (response.status >= 500) {
        return { isAccessible: false, statusCode: response.status, error: `Server error (${response.status})` };
      }
      
      return { isAccessible: true, statusCode: response.status };
    } catch (fallbackError: unknown) {
      const fbErr = fallbackError as Error;
      if (fbErr.name === "AbortError") {
        return { isAccessible: false, error: "Request timeout (10s)" };
      }
      return { 
        isAccessible: false, 
        error: fbErr.message || "Connection failed" 
      };
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const perplexityApiKey = Deno.env.get("PERPLEXITY_API_KEY");

    if (!perplexityApiKey) {
      return new Response(JSON.stringify({ error: "PERPLEXITY_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin status using has_role() function
    const { data: hasAdminRole, error: roleError } = await supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" });

    if (roleError || !hasAdminRole) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate input with Zod
    let body: VerificationRequest;
    try {
      const rawBody = await req.json();
      body = verificationRequestSchema.parse(rawBody);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error("[ft_verify_grants] Validation error:", validationError.errors);
        return new Response(JSON.stringify({ 
          error: "Invalid request data",
          details: validationError.errors.map(e => e.message).join(", ")
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw validationError;
    }

    const results: VerificationResult[] = [];

    // Determine which grants to verify
    let grantsToVerify: { id: string; name: string; organization: string; application_url: string }[] = [];

    if (body.verify_all) {
      // Verify ALL grants regardless of last verification
      console.log("[ft_verify_grants] Verifying ALL grants");
      
      const { data: allGrants, error: fetchError } = await supabase
        .from("canadian_grants")
        .select("id, name, organization, application_url")
        .order("name")
        .limit(100);

      if (fetchError) {
        throw new Error(`Failed to fetch grants: ${fetchError.message}`);
      }

      grantsToVerify = allGrants || [];
    } else if (body.grant_ids && body.grant_ids.length > 0) {
      // Verify specific grants by ID array
      console.log(`[ft_verify_grants] Verifying ${body.grant_ids.length} selected grants`);

      const { data: selectedGrants, error: fetchError } = await supabase
        .from("canadian_grants")
        .select("id, name, organization, application_url")
        .in("id", body.grant_ids);

      if (fetchError) {
        throw new Error(`Failed to fetch selected grants: ${fetchError.message}`);
      }

      grantsToVerify = selectedGrants || [];
    } else if (body.batch) {
      // Batch mode: verify stale grants
      const staleDays = body.stale_days || 30;
      const staleDate = new Date();
      staleDate.setDate(staleDate.getDate() - staleDays);

      console.log(`[ft_verify_grants] Batch mode: finding grants not AI-verified in ${staleDays}+ days`);

      const { data: staleGrants, error: fetchError } = await supabase
        .from("canadian_grants")
        .select("id, name, organization, application_url")
        .or(`auto_verified_at.is.null,auto_verified_at.lt.${staleDate.toISOString()}`)
        .limit(20);

      if (fetchError) {
        throw new Error(`Failed to fetch stale grants: ${fetchError.message}`);
      }

      grantsToVerify = staleGrants || [];
    } else if (body.grant_id) {
      // Single grant by ID
      const { data: grant, error: fetchError } = await supabase
        .from("canadian_grants")
        .select("id, name, organization, application_url")
        .eq("id", body.grant_id)
        .single();

      if (fetchError || !grant) {
        return new Response(JSON.stringify({ error: "Resource not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      grantsToVerify = [grant];
    } else if (body.grant_name) {
      // Single grant by name
      const { data: grant, error: fetchError } = await supabase
        .from("canadian_grants")
        .select("id, name, organization, application_url")
        .ilike("name", `%${body.grant_name}%`)
        .single();

      if (fetchError || !grant) {
        return new Response(JSON.stringify({ error: "Resource not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      grantsToVerify = [grant];
    }

    console.log(`[ft_verify_grants] Verifying ${grantsToVerify.length} grants`);

    // Verify each grant
    for (const grant of grantsToVerify) {
      try {
        // Step 1: Check URL health first
        let urlHealth: UrlHealthResult = { isAccessible: true };
        if (grant.application_url) {
          console.log(`[ft_verify_grants] Checking URL health for ${grant.name}: ${grant.application_url}`);
          urlHealth = await checkUrlHealth(grant.application_url);
          console.log(`[ft_verify_grants] URL health result for ${grant.name}: ${JSON.stringify(urlHealth)}`);
        }

        // Step 2: If URL is broken, mark as unknown immediately and skip Perplexity
        if (!urlHealth.isAccessible) {
          const brokenLinkResult: VerificationResult = {
            grant_id: grant.id,
            grant_name: grant.name,
            current_status: "unknown",
            confidence: "high", // High confidence that URL is broken
            sources: [],
            notes: `Application URL is broken: ${urlHealth.error}. URL: ${grant.application_url}`,
            url_status: urlHealth.error?.includes("timeout") ? "timeout" : "broken",
          };

          results.push(brokenLinkResult);

          // Update database with url_status
          await supabase
            .from("canadian_grants")
            .update({
              status: "unknown",
              url_status: brokenLinkResult.url_status,
              last_verified: new Date().toISOString(),
              verification_notes: brokenLinkResult.notes,
              auto_verified_at: new Date().toISOString(),
            })
            .eq("id", grant.id);

          console.log(`[ft_verify_grants] Marked ${grant.name} as unknown due to broken URL`);

          // Add delay between requests
          if (grantsToVerify.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }

          continue; // Skip Perplexity verification
        }

        // Step 3: URL is accessible, proceed with Perplexity verification
        const verificationResult = await verifyGrantWithPerplexity(
          grant.id,
          grant.name,
          grant.organization,
          perplexityApiKey
        );

        // Add URL status to result
        verificationResult.url_status = "accessible";

        results.push(verificationResult);

        // Update grant in database
        const updateData: Record<string, unknown> = {
          url_status: "accessible",
          last_verified: new Date().toISOString(),
          verification_notes: verificationResult.notes,
          verification_source: verificationResult.sources.join(", "),
          auto_verified_at: new Date().toISOString(),
        };

        // Update status based on confidence level
        if (verificationResult.confidence === "high" || verificationResult.confidence === "medium") {
          updateData.status = verificationResult.current_status;
        } else if (verificationResult.current_status === "unknown" || verificationResult.current_status === "closed") {
          updateData.status = verificationResult.current_status;
        }

        // Update deadline if found
        if (verificationResult.deadline_found) {
          updateData.deadline = verificationResult.deadline_found;
        }

        await supabase
          .from("canadian_grants")
          .update(updateData)
          .eq("id", grant.id);

        console.log(`[ft_verify_grants] Updated grant ${grant.name}: ${verificationResult.current_status} (${verificationResult.confidence})`);

        // Add delay between requests
        if (grantsToVerify.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`[ft_verify_grants] Error verifying ${grant.name}:`, error);
        results.push({
          grant_id: grant.id,
          grant_name: grant.name,
          current_status: "unknown",
          confidence: "low",
          sources: [],
          notes: `Verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }

    return new Response(JSON.stringify({ results, verified_count: results.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[ft_verify_grants] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function verifyGrantWithPerplexity(
  grantId: string,
  grantName: string,
  organization: string,
  apiKey: string
): Promise<VerificationResult> {
  const currentYear = new Date().getFullYear();
  const query = `Is the "${grantName}" program by ${organization} in Canada currently accepting applications in ${currentYear}? Is it open or closed? What is the application deadline if any?`;

  console.log(`[ft_verify_grants] Querying Perplexity for: ${grantName}`);

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
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
          content: `You are a Canadian government funding program researcher. Your task is to verify if programs are currently accepting applications. 
          
Respond in this exact JSON format:
{
  "status": "open" | "closed" | "unknown",
  "confidence": "high" | "medium" | "low",
  "deadline": "YYYY-MM-DD or null",
  "notes": "Brief explanation of findings"
}

Use "high" confidence when you find official government sources confirming the status.
Use "medium" confidence when you find recent news or unofficial sources.
Use "low" confidence when information is unclear or outdated.
Use "closed" if the program has ended, been discontinued, or is not accepting applications.
Use "open" if the program is actively accepting applications.`,
        },
        {
          role: "user",
          content: query,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[ft_verify_grants] Perplexity API error: ${response.status} - ${errorText}`);
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  const citations = data.citations || [];

  console.log(`[ft_verify_grants] Perplexity response for ${grantName}:`, content.substring(0, 200));

  // Parse the response
  let parsedResult: { status?: string; confidence?: string; deadline?: string; notes?: string } = {};
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedResult = JSON.parse(jsonMatch[0]);
    }
  } catch {
    console.log(`[ft_verify_grants] Could not parse JSON, analyzing text response`);
  }

  // Fallback to keyword analysis if JSON parsing fails
  let status: "open" | "closed" | "unknown" = "unknown";
  let confidence: "high" | "medium" | "low" = "low";
  let notes = parsedResult.notes || "";

  if (parsedResult.status) {
    status = parsedResult.status as "open" | "closed" | "unknown";
    confidence = (parsedResult.confidence as "high" | "medium" | "low") || "medium";
  } else {
    const lowerContent = content.toLowerCase();
    
    const closedKeywords = ["closed", "ended", "discontinued", "no longer accepting", "program has ended", "cancelled", "suspended", "not available"];
    const openKeywords = ["open", "accepting applications", "currently available", "apply now", "deadline", "applications open"];
    
    const closedScore = closedKeywords.filter(kw => lowerContent.includes(kw)).length;
    const openScore = openKeywords.filter(kw => lowerContent.includes(kw)).length;

    if (closedScore > openScore && closedScore > 0) {
      status = "closed";
      confidence = closedScore >= 2 ? "high" : "medium";
      notes = `Found ${closedScore} indicators that program is closed.`;
    } else if (openScore > closedScore && openScore > 0) {
      status = "open";
      confidence = openScore >= 2 ? "high" : "medium";
      notes = `Found ${openScore} indicators that program is open.`;
    } else {
      notes = "Could not determine program status from available information.";
    }
  }

  // Extract deadline if mentioned
  let deadline: string | undefined;
  if (parsedResult.deadline && parsedResult.deadline !== "null") {
    deadline = parsedResult.deadline;
  } else {
    const dateMatch = content.match(/deadline[:\s]+(\w+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})/i);
    if (dateMatch) {
      deadline = dateMatch[1];
    }
  }

  return {
    grant_id: grantId,
    grant_name: grantName,
    current_status: status,
    confidence,
    sources: citations,
    deadline_found: deadline,
    notes: notes || content.substring(0, 300),
    raw_response: content,
  };
}
