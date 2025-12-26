import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create user client to get user ID
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log(`Deleting account for user: ${userId}`);

    // Create admin client for deletion operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Delete user data in order (respecting foreign key constraints)
    // 1. Delete messages (via sessions)
    const { error: msgError } = await adminClient
      .from("ft_messages")
      .delete()
      .eq("user_id", userId);
    if (msgError) console.error("Error deleting messages:", msgError);

    // 2. Delete ideas
    const { error: ideasError } = await adminClient
      .from("ft_ideas")
      .delete()
      .eq("user_id", userId);
    if (ideasError) console.error("Error deleting ideas:", ideasError);

    // 3. Delete documents
    const { error: docsError } = await adminClient
      .from("ft_documents")
      .delete()
      .eq("user_id", userId);
    if (docsError) console.error("Error deleting documents:", docsError);

    // 4. Delete orders
    const { error: ordersError } = await adminClient
      .from("ft_orders")
      .delete()
      .eq("user_id", userId);
    if (ordersError) console.error("Error deleting orders:", ordersError);

    // 5. Delete events
    const { error: eventsError } = await adminClient
      .from("ft_events")
      .delete()
      .eq("user_id", userId);
    if (eventsError) console.error("Error deleting events:", eventsError);

    // 6. Delete sessions
    const { error: sessionsError } = await adminClient
      .from("ft_sessions")
      .delete()
      .eq("user_id", userId);
    if (sessionsError) console.error("Error deleting sessions:", sessionsError);

    // 7. Delete profile
    const { error: profileError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (profileError) console.error("Error deleting profile:", profileError);

    // 8. Delete auth user
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      console.error("Error deleting auth user:", authDeleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete auth user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully deleted account for user: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
