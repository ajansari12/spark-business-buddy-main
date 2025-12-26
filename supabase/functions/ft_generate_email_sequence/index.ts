import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Settings {
  tone: 'professional' | 'friendly' | 'urgent';
  emojisInSubject: boolean;
  businessName: string;
  offerDetails: string;
}

interface Email {
  type: string;
  subject: string;
  previewText: string;
  body: string;
  ctaText: string;
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

    const { idea_id, settings, regenerate, email_type } = await req.json();

    if (!idea_id) {
      return new Response(JSON.stringify({ error: "idea_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailSettings: Settings = settings || { 
      tone: 'professional', 
      emojisInSubject: false, 
      businessName: '',
      offerDetails: '' 
    };

    const isPartialRegenerate = regenerate && email_type;
    let existingEmails: Email[] = [];

    // Check for existing content
    const { data: existingContent } = await supabaseClient
      .from("ft_generated_content")
      .select("*")
      .eq("idea_id", idea_id)
      .eq("user_id", user.id)
      .eq("content_type", "emails")
      .single();

    // If partial regenerate, store existing emails for merging
    if (isPartialRegenerate && existingContent?.content?.emails) {
      existingEmails = existingContent.content.emails;
    }

    // Return cached if not regenerating
    if (!regenerate && existingContent) {
      return new Response(JSON.stringify({ content: existingContent, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    // Get session data for context
    const { data: session } = await supabaseClient
      .from("ft_sessions")
      .select("collected_data")
      .eq("id", idea.session_id)
      .single();

    const collectedData = session?.collected_data || {};

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const businessName = emailSettings.businessName || idea.title;

    const toneDescriptions = {
      professional: "professional and authoritative, suitable for B2B audiences",
      friendly: "warm and conversational, building personal connection",
      urgent: "creating urgency and excitement, driving immediate action"
    };

    // Build prompt based on whether we're generating one or all emails
    const emailTypeDescriptions: Record<string, string> = {
      launch: "LAUNCH ANNOUNCEMENT - Introduce the business, build excitement",
      early_bird: "EARLY BIRD OFFER - Highlight special offer/discount for early adopters",
      last_chance: "LAST CHANCE - Create urgency, final reminder before offer ends"
    };

    const emailsToGenerate = isPartialRegenerate
      ? `Generate ONLY this email:\n- ${emailTypeDescriptions[email_type]}`
      : `Generate 3 emails:\n1. ${emailTypeDescriptions.launch}\n2. ${emailTypeDescriptions.early_bird}\n3. ${emailTypeDescriptions.last_chance}`;

    const systemPrompt = `You are an expert email marketing copywriter specializing in business launch campaigns.
Generate email content that converts subscribers into customers.

Tone: ${toneDescriptions[emailSettings.tone]}
Emojis in subject lines: ${emailSettings.emojisInSubject ? 'Yes, use 1-2 relevant emojis' : 'No, avoid emojis'}

IMPORTANT: Use these placeholders in the email body:
- {{first_name}} - for personalization
- {{cta_link}} - for call-to-action buttons

Keep emails concise but compelling. Focus on benefits over features.`;

    const userPrompt = `Generate email content for this Canadian business:

BUSINESS:
- Name: ${businessName}
- Description: ${idea.description || 'N/A'}
- Category: ${idea.category || 'N/A'}
- Tagline: ${idea.tagline || 'N/A'}
- Location: ${collectedData.city || 'Canada'}, ${collectedData.province || 'ON'}
${emailSettings.offerDetails ? `- Special Offer: ${emailSettings.offerDetails}` : ''}

${emailsToGenerate}

Return as JSON:
{
  "emails": [
    {
      "type": "${isPartialRegenerate ? email_type : 'launch'}",
      "subject": "Subject line here",
      "previewText": "Preview text shown in inbox (50 chars max)",
      "body": "Email body with {{first_name}} and {{cta_link}} placeholders. Use line breaks for paragraphs.",
      "ctaText": "Button text like 'Get Started' or 'Learn More'"
    }${isPartialRegenerate ? '' : `,
    {
      "type": "early_bird",
      "subject": "Subject line",
      "previewText": "Preview text",
      "body": "Email body...",
      "ctaText": "Claim Your Discount"
    },
    {
      "type": "last_chance",
      "subject": "Subject line",
      "previewText": "Preview text",
      "body": "Email body...",
      "ctaText": "Don't Miss Out"
    }`}
  ]
}`;

    console.log(`Generating email${isPartialRegenerate ? ` (${email_type})` : ' sequence'} for idea ${idea_id}, user ${user.id}`);

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
      
      return new Response(JSON.stringify({ error: "Failed to generate emails" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let emailsData: { emails: Email[] };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        emailsData = JSON.parse(jsonMatch[0]);
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

    // For partial regeneration, merge with existing emails
    let finalEmails: Email[];
    if (isPartialRegenerate && existingEmails.length) {
      const newEmail = emailsData.emails[0];
      finalEmails = existingEmails.map(existing =>
        existing.type === email_type ? newEmail : existing
      );
    } else {
      finalEmails = emailsData.emails;
    }

    // Add metadata
    const emailContent = {
      emails: finalEmails,
      settings: emailSettings,
      businessName,
      generated_at: new Date().toISOString(),
    };

    // Check if we need to update or insert
    let savedContent;
    if (existingContent) {
      const { data, error: updateError } = await supabaseClient
        .from("ft_generated_content")
        .update({
          content: emailContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingContent.id)
        .select()
        .single();

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(JSON.stringify({ error: "Failed to save emails" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      savedContent = data;
    } else {
      const { data, error: insertError } = await supabaseClient
        .from("ft_generated_content")
        .insert({
          user_id: user.id,
          idea_id,
          content_type: "emails",
          content: emailContent,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(JSON.stringify({ error: "Failed to save emails" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      savedContent = data;
    }

    console.log(`Email${isPartialRegenerate ? ` (${email_type})` : ' sequence'} generated for user ${user.id}, idea ${idea_id}`);

    return new Response(JSON.stringify({ content: savedContent, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Email sequence generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
