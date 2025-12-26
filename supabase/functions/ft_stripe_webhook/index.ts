import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIER_NAMES: Record<string, string> = {
  starter: "Starter",
  complete: "Complete", 
  vip: "VIP",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[FT_STRIPE_WEBHOOK] ${step}${detailsStr}`);
};

const sendReceiptEmail = async (email: string, tierName: string, amount: number) => {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    logStep("RESEND_API_KEY not set, skipping email");
    return;
  }

  try {
    const resend = new Resend(resendKey);
    const formattedAmount = (amount / 100).toFixed(2);

    await resend.emails.send({
      from: "FastTrack <noreply@resend.dev>",
      to: [email],
      subject: `Your ${tierName} Purchase Confirmation`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">Thank you for your purchase!</h1>
          <p>Your <strong>${tierName}</strong> package has been successfully activated.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Amount paid:</strong> $${formattedAmount} CAD</p>
            <p style="margin: 10px 0 0;"><strong>Package:</strong> ${tierName}</p>
          </div>
          <p>Your personalized business ideas are now being generated. Head to your dashboard to view the results!</p>
          <a href="https://fasttrack.lovable.app/app/dashboard" 
             style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Go to Dashboard
          </a>
          <p style="color: #6b7280; margin-top: 30px; font-size: 14px;">
            If you have any questions, reply to this email and we'll be happy to help.
          </p>
        </div>
      `,
    });
    logStep("Receipt email sent", { email });
  } catch (error) {
    logStep("Failed to send receipt email", { error: String(error) });
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    // If webhook secret is configured, verify signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event: Stripe.Event;

    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logStep("Webhook signature verification failed", { error: errorMessage });
        return new Response(JSON.stringify({ error: "Webhook signature verification failed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Parse event without verification (for development)
      event = JSON.parse(body) as Stripe.Event;
      logStep("Webhook parsed without signature verification (dev mode)");
    }

    logStep("Event type", { type: event.type });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout.session.completed", {
        sessionId: session.id,
        metadata: session.metadata,
      });

      const userId = session.metadata?.user_id;
      const tierId = session.metadata?.tier_id;
      const ftSessionId = session.metadata?.ft_session_id;
      const customerEmail = session.customer_email || session.customer_details?.email;

      if (!userId || !tierId) {
        logStep("Missing metadata", { userId, tierId });
        return new Response(JSON.stringify({ error: "Missing metadata" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update order status to paid
      const { error: updateError } = await supabaseAdmin
        .from("ft_orders")
        .update({
          status: "paid",
          stripe_payment_intent_id: session.payment_intent as string,
        })
        .eq("stripe_checkout_session_id", session.id);

      if (updateError) {
        logStep("Error updating order", { error: updateError.message });
      } else {
        logStep("Order updated to paid");
      }

      // Update session status if we have a session ID
      if (ftSessionId) {
        const { error: sessionError } = await supabaseAdmin
          .from("ft_sessions")
          .update({ status: "paid" })
          .eq("id", ftSessionId);

        if (sessionError) {
          logStep("Error updating session", { error: sessionError.message });
        } else {
          logStep("Session updated to paid");
        }
      }

      // Send receipt email
      if (customerEmail) {
        const tierName = TIER_NAMES[tierId] || tierId;
        await sendReceiptEmail(customerEmail, tierName, session.amount_total || 0);
      }

      logStep("Checkout completed successfully", { userId, tierId });
    }

    // Handle checkout.session.expired - clean up pending orders
    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout.session.expired", { sessionId: session.id });

      const { error } = await supabaseAdmin
        .from("ft_orders")
        .update({ status: "failed" })
        .eq("stripe_checkout_session_id", session.id)
        .eq("status", "pending");

      if (error) {
        logStep("Error updating expired order", { error: error.message });
      } else {
        logStep("Expired order marked as failed");
      }
    }

    // Handle payment_intent.payment_failed
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      logStep("Processing payment_intent.payment_failed", { 
        paymentIntentId: paymentIntent.id,
        error: paymentIntent.last_payment_error?.message 
      });

      const { error } = await supabaseAdmin
        .from("ft_orders")
        .update({ status: "failed" })
        .eq("stripe_payment_intent_id", paymentIntent.id);

      if (error) {
        logStep("Error updating failed payment order", { error: error.message });
      } else {
        logStep("Order marked as failed");
      }
    }

    // Handle charge.refunded
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      logStep("Processing charge.refunded", { 
        chargeId: charge.id,
        paymentIntentId: charge.payment_intent 
      });

      if (charge.payment_intent) {
        const { error } = await supabaseAdmin
          .from("ft_orders")
          .update({ status: "failed" }) // Using 'failed' as refunded equivalent
          .eq("stripe_payment_intent_id", charge.payment_intent as string);

        if (error) {
          logStep("Error updating refunded order", { error: error.message });
        } else {
          logStep("Order marked as refunded");
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
