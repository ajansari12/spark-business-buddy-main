import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// PDF generation using PDFKit approach - manual PDF construction
// Note: We'll build a simple text-based PDF since PDFKit is complex in Deno

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(
        JSON.stringify({ error: "session_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[ft_generate_pdf] User ${user.id} requesting PDF for session ${session_id}`);

    // Verify session ownership and status
    const { data: session, error: sessionError } = await supabaseUser
      .from("ft_sessions")
      .select("*")
      .eq("id", session_id)
      .maybeSingle();

    if (sessionError || !session) {
      console.error("Session not found:", sessionError);
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (session.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized access to session" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if ideas have been generated
    if (!["ideas_generated", "completed"].includes(session.status)) {
      return new Response(
        JSON.stringify({ error: "Ideas not yet generated for this session" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if PDF already exists for this session
    const { data: existingDoc } = await supabaseUser
      .from("ft_documents")
      .select("*")
      .eq("session_id", session_id)
      .eq("doc_type", "tier1_report")
      .maybeSingle();

    if (existingDoc && existingDoc.file_url) {
      // Check if signed URL is still valid (rough check by trying to refresh)
      const filePath = `${user.id}/${session_id}/report.pdf`;
      const { data: signedUrlData } = await supabaseAdmin.storage
        .from("ft-documents")
        .createSignedUrl(filePath, 7 * 24 * 60 * 60); // 7 days

      if (signedUrlData?.signedUrl) {
        console.log(`[ft_generate_pdf] Returning existing PDF for session ${session_id}`);
        
        // Update the stored URL
        await supabaseAdmin
          .from("ft_documents")
          .update({ file_url: signedUrlData.signedUrl })
          .eq("id", existingDoc.id);

        return new Response(
          JSON.stringify({
            url: signedUrlData.signedUrl,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            document_id: existingDoc.id,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch ideas for session
    const { data: ideas, error: ideasError } = await supabaseUser
      .from("ft_ideas")
      .select("*")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true });

    if (ideasError || !ideas || ideas.length === 0) {
      console.error("No ideas found:", ideasError);
      return new Response(
        JSON.stringify({ error: "No ideas found for this session" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user profile
    const { data: profile } = await supabaseUser
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    // Get session collected data
    const collectedData = session.collected_data || {};

    console.log(`[ft_generate_pdf] Generating PDF with ${ideas.length} ideas`);

    // Generate PDF content using simple text-based PDF
    const pdfContent = generateSimplePDF(ideas, collectedData, profile, user.email || "");

    // Upload to storage
    const filePath = `${user.id}/${session_id}/report.pdf`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("ft-documents")
      .upload(filePath, pdfContent, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload PDF" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from("ft-documents")
      .createSignedUrl(filePath, 7 * 24 * 60 * 60); // 7 days

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Signed URL error:", signedUrlError);
      return new Response(
        JSON.stringify({ error: "Failed to create download URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert or update ft_documents record
    let documentId: string;
    
    if (existingDoc) {
      await supabaseAdmin
        .from("ft_documents")
        .update({
          file_path: filePath,
          file_url: signedUrlData.signedUrl,
        })
        .eq("id", existingDoc.id);
      documentId = existingDoc.id;
    } else {
      const { data: newDoc, error: insertError } = await supabaseAdmin
        .from("ft_documents")
        .insert({
          user_id: user.id,
          session_id: session_id,
          doc_type: "tier1_report",
          file_path: filePath,
          file_url: signedUrlData.signedUrl,
        })
        .select()
        .single();

      if (insertError || !newDoc) {
        console.error("Document insert error:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to save document record" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      documentId = newDoc.id;
    }

    // Log event
    await supabaseAdmin.from("ft_events").insert({
      user_id: user.id,
      session_id: session_id,
      event_name: "pdf_exported",
      event_data: { document_id: documentId },
    });

    console.log(`[ft_generate_pdf] PDF generated successfully for session ${session_id}`);

    return new Response(
      JSON.stringify({
        url: signedUrlData.signedUrl,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        document_id: documentId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[ft_generate_pdf] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Simple PDF generator using raw PDF syntax
function generateSimplePDF(
  ideas: any[],
  collectedData: any,
  profile: any,
  userEmail: string
): Uint8Array {
  const lines: string[] = [];
  const date = new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Build text content for PDF
  lines.push("FASTTRACK.BUSINESS");
  lines.push("Your Personalized Business Ideas Report");
  lines.push(`Generated on ${date}`);
  lines.push("");
  lines.push("━".repeat(50));
  lines.push("");
  
  // Profile section
  lines.push("YOUR PROFILE");
  lines.push("-".repeat(30));
  if (profile?.full_name) lines.push(`Name: ${profile.full_name}`);
  if (profile?.city || profile?.province) {
    lines.push(`Location: ${profile.city || ""}, ${profile.province || ""}`);
  }
  if (collectedData.skills) {
    const skills = Array.isArray(collectedData.skills) 
      ? collectedData.skills.join(", ") 
      : collectedData.skills;
    lines.push(`Skills: ${skills}`);
  }
  if (collectedData.budget) lines.push(`Budget: ${collectedData.budget}`);
  if (collectedData.time_commitment) lines.push(`Time Commitment: ${collectedData.time_commitment}`);
  if (collectedData.goals) {
    const goals = Array.isArray(collectedData.goals) 
      ? collectedData.goals.join(", ") 
      : collectedData.goals;
    lines.push(`Goals: ${goals}`);
  }
  lines.push("");
  lines.push(`${ideas.length} Business Ideas Generated`);
  lines.push("");
  lines.push("━".repeat(50));

  // Ideas section
  ideas.forEach((idea, index) => {
    lines.push("");
    lines.push(`IDEA ${index + 1}: ${idea.title}`);
    lines.push("=".repeat(40));
    
    if (idea.category) lines.push(`Category: ${idea.category}`);
    if (idea.viability_score) lines.push(`Viability Score: ${idea.viability_score}/10`);
    if (idea.investment_min && idea.investment_max) {
      lines.push(`Investment: $${idea.investment_min.toLocaleString()} - $${idea.investment_max.toLocaleString()}`);
    }
    if (idea.time_to_revenue) lines.push(`Time to Revenue: ${idea.time_to_revenue}`);
    lines.push("");
    
    if (idea.description) {
      lines.push("Description:");
      lines.push(idea.description);
      lines.push("");
    }
    
    const marketAnalysis = idea.market_analysis || {};
    
    if (marketAnalysis.why_fit) {
      lines.push("Why This Fits You:");
      lines.push(marketAnalysis.why_fit);
      lines.push("");
    }
    
    if (marketAnalysis.local_notes) {
      lines.push("Local Market Opportunity:");
      lines.push(marketAnalysis.local_notes);
      lines.push("");
    }
    
    if (marketAnalysis.challenges && marketAnalysis.challenges.length > 0) {
      lines.push("Challenges:");
      marketAnalysis.challenges.forEach((c: string, i: number) => {
        lines.push(`  ${i + 1}. ${c}`);
      });
      lines.push("");
    }
    
    if (marketAnalysis.first_steps && marketAnalysis.first_steps.length > 0) {
      lines.push("First Steps:");
      marketAnalysis.first_steps.forEach((s: string, i: number) => {
        lines.push(`  ${i + 1}. ${s}`);
      });
      lines.push("");
    }
    
    lines.push("-".repeat(40));
  });

  // Final page
  lines.push("");
  lines.push("━".repeat(50));
  lines.push("WHAT'S NEXT?");
  lines.push("-".repeat(30));
  lines.push("");
  lines.push("1. Review each idea carefully and pick the one that excites you most");
  lines.push("2. Research your local market and competitors");
  lines.push("3. Create a simple business plan outlining your first 90 days");
  lines.push("4. Register your business name with your provincial registry");
  lines.push("5. Set up a business bank account");
  lines.push("6. Connect with local small business resources and mentors");
  lines.push("");
  lines.push("Need More Help?");
  lines.push("Visit FastTrack.Business for more resources and support.");
  lines.push("");
  lines.push("━".repeat(50));
  lines.push("");
  lines.push("DISCLAIMER");
  lines.push("FastTrack provides information and assistance, not legal or");
  lines.push("accounting advice. Always consult with qualified professionals");
  lines.push("before making business decisions.");
  lines.push("");
  lines.push(`© ${new Date().getFullYear()} FastTrack.Business`);

  // Convert to PDF format
  return createPDFFromText(lines.join("\n"));
}

// Create a minimal valid PDF from text content
function createPDFFromText(text: string): Uint8Array {
  const content = text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  
  // Split into lines and create PDF text stream with proper line breaks
  const textLines = content.split("\n");
  let streamContent = "BT\n/F1 10 Tf\n50 750 Td\n12 TL\n";
  
  for (const line of textLines) {
    // Escape special characters and limit line length
    const safeLine = line.substring(0, 80);
    streamContent += `(${safeLine}) '\n`;
  }
  streamContent += "ET";

  const stream = new TextEncoder().encode(streamContent);
  const streamLength = stream.length;

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${350 + streamLength}
%%EOF`;

  return new TextEncoder().encode(pdf);
}
