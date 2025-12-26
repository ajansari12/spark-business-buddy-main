import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[FT_ABANDONED_SESSION_CHECK] ${step}${detailsStr}`);
};

// Generate email HTML
function generateAbandonedSessionEmail(
  userName: string,
  sessionSummary: string,
  resumeUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Continue Your Business Discovery</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1E3A5F 0%, #2E4A6F 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                FastTrack.Business
              </h1>
              <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0; font-size: 14px;">
                Your personalized business discovery awaits
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1E3A5F; margin: 0 0 20px; font-size: 22px;">
                Hey ${userName}! 👋
              </h2>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                We noticed you started exploring business ideas but didn't get to see your personalized recommendations. Your discovery session is still waiting for you!
              </p>
              
              ${sessionSummary ? `
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #D52B1E;">
                <h3 style="color: #1E3A5F; margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  What you've shared so far:
                </h3>
                <p style="color: #52525b; font-size: 14px; line-height: 1.6; margin: 0;">
                  ${sessionSummary}
                </p>
              </div>
              ` : ''}
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Pick up right where you left off – your answers are saved, and we're ready to match you with business ideas tailored to your unique skills and goals.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${resumeUrl}" style="display: inline-block; background-color: #D52B1E; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(213, 43, 30, 0.3);">
                      Continue Where You Left Off →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin: 30px 0 0;">
                This link will take you directly back to your session.
              </p>
            </td>
          </tr>
          
          <!-- Benefits Reminder -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px;">
              <h3 style="color: #1E3A5F; margin: 0 0 16px; font-size: 16px; text-align: center;">
                What you'll get with FastTrack:
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #22c55e; font-size: 18px;">✓</span>
                    <span style="color: #52525b; font-size: 14px; margin-left: 8px;">Personalized business ideas matched to your skills</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #22c55e; font-size: 18px;">✓</span>
                    <span style="color: #52525b; font-size: 14px; margin-left: 8px;">Verified market data & real competitor analysis</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #22c55e; font-size: 18px;">✓</span>
                    <span style="color: #52525b; font-size: 14px; margin-left: 8px;">Canadian grants you actually qualify for</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 10px;">
                © ${new Date().getFullYear()} FastTrack.Business. All rights reserved.
              </p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                Don't want these reminders? <a href="mailto:support@fasttrack.business?subject=Unsubscribe" style="color: #1E3A5F;">Unsubscribe</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Extract summary from collected_data
function extractSessionSummary(collectedData: Record<string, unknown> | null): string {
  if (!collectedData) return "";

  const parts: string[] = [];

  if (collectedData.province) {
    parts.push(`Located in ${collectedData.province}`);
  }
  if (collectedData.city) {
    parts.push(`${collectedData.city}`);
  }
  if (collectedData.skills && Array.isArray(collectedData.skills)) {
    parts.push(`Skills: ${(collectedData.skills as string[]).slice(0, 3).join(", ")}`);
  }
  if (collectedData.interests && Array.isArray(collectedData.interests)) {
    parts.push(`Interests: ${(collectedData.interests as string[]).slice(0, 3).join(", ")}`);
  }
  if (collectedData.budget) {
    parts.push(`Budget: ${collectedData.budget}`);
  }
  if (collectedData.timeCommitment) {
    parts.push(`Time commitment: ${collectedData.timeCommitment}`);
  }

  return parts.join(" • ");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse request body for optional parameters
    const body = await req.json().catch(() => ({}));
    const hoursThreshold = body.hours_threshold || 24;
    const dryRun = body.dry_run || false;

    logStep("Parameters", { hoursThreshold, dryRun });

    // Calculate threshold time
    const thresholdTime = new Date();
    thresholdTime.setHours(thresholdTime.getHours() - hoursThreshold);

    // Find abandoned sessions:
    // - Status is 'intake' (still collecting data)
    // - Updated more than X hours ago
    // - Haven't been notified yet (last_notified_at is null)
    const { data: abandonedSessions, error: sessionsError } = await supabase
      .from("ft_sessions")
      .select(`
        id,
        user_id,
        collected_data,
        updated_at,
        progress
      `)
      .eq("status", "intake")
      .lt("updated_at", thresholdTime.toISOString())
      .is("last_notified_at", null)
      .order("updated_at", { ascending: true });

    if (sessionsError) {
      throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
    }

    logStep("Found abandoned sessions", { count: abandonedSessions?.length || 0 });

    if (!abandonedSessions || abandonedSessions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "No abandoned sessions found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const results: Array<{ sessionId: string; email: string; success: boolean; error?: string }> = [];
    const baseUrl = Deno.env.get("SITE_URL") || "https://fasttrack.business";

    for (const session of abandonedSessions) {
      try {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", session.user_id)
          .maybeSingle();

        if (profileError || !profile?.email) {
          logStep("No email for user", { userId: session.user_id });
          results.push({
            sessionId: session.id,
            email: "",
            success: false,
            error: "No email found",
          });
          continue;
        }

        const userName = profile.full_name?.split(" ")[0] || "there";
        const sessionSummary = extractSessionSummary(session.collected_data as Record<string, unknown>);
        const resumeUrl = `${baseUrl}/chat?session=${session.id}`;

        const emailHtml = generateAbandonedSessionEmail(userName, sessionSummary, resumeUrl);

        if (dryRun) {
          logStep("DRY RUN - Would send email", { 
            to: profile.email, 
            sessionId: session.id,
            summary: sessionSummary 
          });
          results.push({
            sessionId: session.id,
            email: profile.email,
            success: true,
          });
          continue;
        }

        // Send email via Resend
        const { error: emailError } = await resend.emails.send({
          from: "FastTrack Business <noreply@fasttrack.business>",
          to: [profile.email],
          subject: "Continue finding your perfect business idea 🚀",
          html: emailHtml,
        });

        if (emailError) {
          throw new Error(emailError.message);
        }

        // Update session to mark as notified
        const { error: updateError } = await supabase
          .from("ft_sessions")
          .update({
            last_notified_at: new Date().toISOString(),
            status: "abandoned_notified",
          })
          .eq("id", session.id);

        if (updateError) {
          logStep("Warning: Failed to update session", { sessionId: session.id, error: updateError.message });
        }

        logStep("Email sent successfully", { sessionId: session.id, to: profile.email });
        results.push({
          sessionId: session.id,
          email: profile.email,
          success: true,
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logStep("Failed to process session", { sessionId: session.id, error: errorMessage });
        results.push({
          sessionId: session.id,
          email: "",
          success: false,
          error: errorMessage,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    logStep("Processing complete", { successCount, failCount });

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        sent: successCount,
        failed: failCount,
        results,
        dry_run: dryRun,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
