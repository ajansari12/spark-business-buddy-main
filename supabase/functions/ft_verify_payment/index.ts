import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[FT_VERIFY_PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { session_id } = await req.json();
    if (!session_id) {
      throw new Error("Missing session_id");
    }
    logStep("Verifying session", { session_id });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Session retrieved", { status: session.payment_status, metadata: session.metadata });

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ success: false, error: "Payment not completed" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const userId = session.metadata?.user_id;
    const tierId = session.metadata?.tier_id;
    const ftSessionId = session.metadata?.ft_session_id;

    // Update order in database if not already done by webhook
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if order exists and update it
    const { data: existingOrder } = await supabaseAdmin
      .from("ft_orders")
      .select("id, status")
      .eq("stripe_checkout_session_id", session_id)
      .maybeSingle();

    if (existingOrder && existingOrder.status !== "paid") {
      await supabaseAdmin
        .from("ft_orders")
        .update({
          status: "paid",
          stripe_payment_intent_id: session.payment_intent as string,
        })
        .eq("id", existingOrder.id);
      logStep("Order updated to paid");
    }

    // Update session if exists
    if (ftSessionId) {
      await supabaseAdmin
        .from("ft_sessions")
        .update({ status: "paid" })
        .eq("id", ftSessionId);
      logStep("Session updated to paid");
    }

    return new Response(
      JSON.stringify({
        success: true,
        tier_id: tierId,
        user_id: userId,
        session_id: ftSessionId,
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
