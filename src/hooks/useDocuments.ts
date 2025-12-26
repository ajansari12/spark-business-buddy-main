import { useState, useCallback } from "react";
import { Document, DbDocument, mapDbDocumentToDocument } from "@/types/documents";
import { DbEnhancedBusinessIdea, mapDbToDisplay, mapLegacyIdea, isEnhancedIdea } from "@/types/ideas-enhanced";
import { FTExtractedData } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generatePDF } from "@/utils/pdfExport";
import { OrderTier } from "@/hooks/useOrderTier";

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("Not authenticated");
        return null;
      }

      const { data: dbDocs, error: fetchError } = await supabase
        .from("ft_documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error loading documents:", fetchError);
        setError("Failed to load documents");
        return null;
      }

      const docs = (dbDocs || []).map((d) => 
        mapDbDocumentToDocument(d as unknown as DbDocument)
      );
      setDocuments(docs);
      return docs;
    } catch (err) {
      console.error("Error loading documents:", err);
      setError("Failed to load documents");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generatePdfForSession = useCallback(async (sessionId: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to generate PDF");
        setError("Authentication required");
        return false;
      }

      // Fetch ideas for this session
      const { data: dbIdeas, error: ideasError } = await supabase
        .from("ft_ideas")
        .select("*")
        .eq("session_id", sessionId)
        .eq("user_id", user.id);

      if (ideasError || !dbIdeas?.length) {
        toast.error("No ideas found for this session");
        setError("No ideas found");
        return false;
      }

      // Fetch session collected_data
      const { data: sessionData, error: sessionError } = await supabase
        .from("ft_sessions")
        .select("collected_data")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (sessionError || !sessionData) {
        toast.error("Session not found");
        setError("Session not found");
        return false;
      }

      // Fetch order tier for this session
      let tier: OrderTier = "starter";
      const { data: orderData } = await supabase
        .from("ft_orders")
        .select("tier, tier_name")
        .eq("user_id", user.id)
        .eq("session_id", sessionId)
        .eq("status", "paid")
        .maybeSingle();
      
      if (orderData) {
        const tierValue = (orderData.tier_name || orderData.tier || "starter") as string;
        if (tierValue.includes("tier1") || tierValue === "starter") tier = "starter";
        else if (tierValue.includes("tier2") || tierValue === "complete") tier = "complete";
        else if (tierValue.includes("tier3") || tierValue === "vip") tier = "vip";
      }

      // Map database ideas to BusinessIdeaDisplay format (supports V2 enhanced data)
      const collectedData = (sessionData.collected_data || {}) as unknown as FTExtractedData;
      const ideas = dbIdeas.map((dbIdea) => {
        if (isEnhancedIdea(dbIdea)) {
          return mapDbToDisplay(dbIdea as unknown as DbEnhancedBusinessIdea, collectedData?.city || undefined);
        }
        return mapLegacyIdea(dbIdea, collectedData?.city || undefined);
      });

      // Generate PDF client-side with full V2 data and tier-based sections
      await generatePDF(ideas, collectedData, user.user_metadata?.full_name, sessionId, tier);
      
      return true;
    } catch (err) {
      console.error("Error generating PDF:", err);
      const message = err instanceof Error ? err.message : "Failed to generate PDF";
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    documents,
    isLoading,
    isGenerating,
    error,
    loadUserDocuments,
    generatePdfForSession,
  };
};
