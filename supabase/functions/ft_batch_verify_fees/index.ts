import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-job",
};

const SUPPORTED_PROVINCES = [
  { code: "ON", name: "Ontario" },
  { code: "BC", name: "British Columbia" },
  { code: "AB", name: "Alberta" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "MB", name: "Manitoba" },
];

const STRUCTURE_TYPES = [
  { type: "sole_proprietorship", label: "Sole Proprietorship" },
  { type: "partnership", label: "Partnership" },
  { type: "corporation", label: "Corporation" },
];

interface FeeResult {
  province_code: string;
  structure_type: string;
  verified_fee: string;
  fee_notes: string | null;
  perplexity_sources: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const perplexityApiKey = Deno.env.get("PERPLEXITY_API_KEY");

    if (!perplexityApiKey) {
      return new Response(
        JSON.stringify({ error: "PERPLEXITY_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if this is a cron job request
    const isCronJob = req.headers.get("x-cron-job") === "true";
    const authHeader = req.headers.get("Authorization");

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // For cron jobs, skip user auth check
    if (!isCronJob) {
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Missing authorization header" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check admin role
      const { data: hasAdminRole } = await supabaseAdmin.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (!hasAdminRole) {
        return new Response(
          JSON.stringify({ error: "Admin access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.log("[ft_batch_verify_fees] Cron job request detected, skipping user auth");
    }

    const { province_code } = await req.json().catch(() => ({}));
    
    // Determine which provinces to verify
    const provincesToVerify = province_code 
      ? SUPPORTED_PROVINCES.filter(p => p.code === province_code)
      : SUPPORTED_PROVINCES;

    if (provincesToVerify.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid province code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[ft_batch_verify_fees] Starting verification for ${provincesToVerify.length} province(s)`);

    const results: FeeResult[] = [];
    const errors: { province: string; error: string }[] = [];

    for (const province of provincesToVerify) {
      try {
        console.log(`[ft_batch_verify_fees] Querying Perplexity for ${province.name}...`);

        const prompt = `What are the current official government registration fees in ${province.name}, Canada for:
1. Sole Proprietorship registration
2. Partnership registration  
3. Corporation (provincial incorporation)

For each business structure, provide:
- The exact fee amount in CAD
- Any important notes (e.g., "5-year registration", "annual renewal required", "online vs paper fees")

Please provide current 2024/2025 fees from official provincial government sources only.

Format your response as JSON:
{
  "sole_proprietorship": { "fee": "$XX", "notes": "..." },
  "partnership": { "fee": "$XX", "notes": "..." },
  "corporation": { "fee": "$XXX", "notes": "..." }
}`;

        const response = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${perplexityApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [
              { role: "system", content: "You are a helpful assistant that provides accurate government fee information. Always respond with valid JSON when requested." },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[ft_batch_verify_fees] Perplexity error for ${province.name}:`, errorText);
          errors.push({ province: province.name, error: `API error: ${response.status}` });
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        const citations = data.citations || [];

        console.log(`[ft_batch_verify_fees] Response for ${province.name}:`, content.substring(0, 200));

        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error(`[ft_batch_verify_fees] No JSON found in response for ${province.name}`);
          errors.push({ province: province.name, error: "Could not parse fee data" });
          continue;
        }

        let fees;
        try {
          fees = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error(`[ft_batch_verify_fees] JSON parse error for ${province.name}:`, parseError);
          errors.push({ province: province.name, error: "Invalid JSON in response" });
          continue;
        }

        // Map to our structure
        for (const structureType of STRUCTURE_TYPES) {
          const feeData = fees[structureType.type];
          if (feeData) {
            results.push({
              province_code: province.code,
              structure_type: structureType.type,
              verified_fee: feeData.fee || "Contact province",
              fee_notes: feeData.notes || null,
              perplexity_sources: citations,
            });
          }
        }

        // Rate limiting: wait 2 seconds between provinces
        if (provincesToVerify.indexOf(province) < provincesToVerify.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (provinceError) {
        console.error(`[ft_batch_verify_fees] Error processing ${province.name}:`, provinceError);
        errors.push({ province: province.name, error: String(provinceError) });
      }
    }

    // Upsert all results to database
    if (results.length > 0) {
      console.log(`[ft_batch_verify_fees] Upserting ${results.length} fee records...`);

      for (const fee of results) {
        const { error: upsertError } = await supabaseAdmin
          .from("business_structure_fees")
          .upsert(
            {
              province_code: fee.province_code,
              structure_type: fee.structure_type,
              verified_fee: fee.verified_fee,
              fee_notes: fee.fee_notes,
              perplexity_sources: fee.perplexity_sources,
              last_verified: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "province_code,structure_type",
            }
          );

        if (upsertError) {
          console.error(`[ft_batch_verify_fees] Upsert error:`, upsertError);
          errors.push({ province: fee.province_code, error: upsertError.message });
        }
      }
    }

    console.log(`[ft_batch_verify_fees] Complete. ${results.length} fees verified, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        verified_count: results.length,
        provinces_processed: provincesToVerify.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[ft_batch_verify_fees] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
