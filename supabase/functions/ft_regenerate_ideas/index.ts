import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: isAdmin } = await supabaseClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body for optional session_ids filter
    let sessionIds: string[] | null = null;
    try {
      const body = await req.json();
      sessionIds = body.session_ids || null;
    } catch {
      // No body provided, regenerate all
    }

    // Fetch sessions with ideas_generated status
    let query = supabaseClient
      .from("ft_sessions")
      .select("id, user_id, collected_data, status")
      .eq("status", "ideas_generated");

    if (sessionIds && sessionIds.length > 0) {
      query = query.in("id", sessionIds);
    }

    const { data: sessions, error: sessionsError } = await query;

    if (sessionsError) {
      console.error("[ft_regenerate_ideas] Error fetching sessions:", sessionsError);
      return new Response(JSON.stringify({ error: "Failed to fetch sessions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!sessions || sessions.length === 0) {
      return new Response(JSON.stringify({ 
        message: "No sessions found to regenerate",
        regenerated: 0,
        skipped: 0,
        errors: []
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[ft_regenerate_ideas] Found ${sessions.length} sessions to process`);

    const results = {
      regenerated: 0,
      skipped: 0,
      errors: [] as string[],
      details: [] as { session_id: string; status: string; reason?: string }[],
    };

    // Process each session
    for (const session of sessions) {
      const collectedData = session.collected_data as Record<string, any> || {};
      
      // Check for required fields
      const skills = collectedData.skills_background || collectedData.skills;
      const interests = collectedData.interests;
      const budgetMin = collectedData.budget_min || collectedData.budget?.min;
      const budgetMax = collectedData.budget_max || collectedData.budget?.max;

      if (!skills || !interests) {
        console.log(`[ft_regenerate_ideas] Skipping session ${session.id} - missing required data`);
        results.skipped++;
        results.details.push({
          session_id: session.id,
          status: "skipped",
          reason: `Missing required fields: ${!skills ? 'skills' : ''} ${!interests ? 'interests' : ''}`.trim(),
        });
        continue;
      }

      try {
        console.log(`[ft_regenerate_ideas] Processing session ${session.id}`);

        // Delete existing ideas for this session
        const { error: deleteError } = await supabaseClient
          .from("ft_ideas")
          .delete()
          .eq("session_id", session.id);

        if (deleteError) {
          console.error(`[ft_regenerate_ideas] Error deleting ideas for session ${session.id}:`, deleteError);
          results.errors.push(`Session ${session.id}: Failed to delete old ideas`);
          results.details.push({
            session_id: session.id,
            status: "error",
            reason: "Failed to delete old ideas",
          });
          continue;
        }

        // Update session status to trigger regeneration
        await supabaseClient
          .from("ft_sessions")
          .update({ status: "paid" })
          .eq("id", session.id);

        // Call ft_generate_ideas with force_regenerate
        const generateResponse = await fetch(`${supabaseUrl}/functions/v1/ft_generate_ideas`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_id: session.id,
            force_regenerate: true,
          }),
        });

        if (!generateResponse.ok) {
          const errorText = await generateResponse.text();
          console.error(`[ft_regenerate_ideas] Error generating ideas for session ${session.id}:`, errorText);
          results.errors.push(`Session ${session.id}: ${errorText}`);
          results.details.push({
            session_id: session.id,
            status: "error",
            reason: errorText,
          });
          
          // Restore session status on failure
          await supabaseClient
            .from("ft_sessions")
            .update({ status: "ideas_generated" })
            .eq("id", session.id);
          continue;
        }

        const generateResult = await generateResponse.json();
        console.log(`[ft_regenerate_ideas] Successfully regenerated ${generateResult.ideas?.length || 0} ideas for session ${session.id}`);

        results.regenerated++;
        results.details.push({
          session_id: session.id,
          status: "success",
          reason: `Generated ${generateResult.ideas?.length || 0} new ideas`,
        });

        // Log event
        await supabaseClient.from("ft_events").insert({
          user_id: session.user_id,
          session_id: session.id,
          event_name: "ideas_regenerated",
          event_data: { 
            ideas_count: generateResult.ideas?.length || 0,
            triggered_by: user.id,
          },
        });

        // Rate limiting delay between sessions (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (err) {
        console.error(`[ft_regenerate_ideas] Exception processing session ${session.id}:`, err);
        results.errors.push(`Session ${session.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        results.details.push({
          session_id: session.id,
          status: "error",
          reason: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    console.log(`[ft_regenerate_ideas] Complete. Regenerated: ${results.regenerated}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`);

    return new Response(JSON.stringify({
      message: `Regeneration complete`,
      regenerated: results.regenerated,
      skipped: results.skipped,
      errors: results.errors,
      details: results.details,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[ft_regenerate_ideas] Fatal error:", err);
    return new Response(JSON.stringify({ 
      error: err instanceof Error ? err.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
