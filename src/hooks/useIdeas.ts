import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { saveIdeasToCache, getIdeasFromCache, getAllCachedIdeas } from "@/lib/offlineStorage";
import { BusinessIdeaDisplay, CanadianResource, mapDbToDisplay, mapLegacyIdea, isEnhancedIdea, FtIdeaRow } from "@/types/ideas-enhanced";

const GENERATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ft_generate_ideas`;

// Enrich resources with live grant status and filter out closed grants
const enrichAndFilterResources = async (ideas: BusinessIdeaDisplay[]): Promise<BusinessIdeaDisplay[]> => {
  // Get all unique resource names
  const resourceNames = [...new Set(ideas.flatMap(i => i.canadianResources.map(r => r.name)))];
  
  if (resourceNames.length === 0) return ideas;
  
  // Fetch current status from canadian_grants table
  const { data: grants, error } = await supabase
    .from('canadian_grants')
    .select('name, status, deadline, last_verified')
    .in('name', resourceNames);
  
  if (error) {
    console.error('Error fetching grant status:', error);
    return ideas; // Return unfiltered if lookup fails
  }
  
  // Create lookup map
  const grantMap = new Map(grants?.map(g => [g.name, g]) || []);
  
  // Enrich and filter resources
  return ideas.map(idea => ({
    ...idea,
    canadianResources: idea.canadianResources
      .map(resource => {
        const grant = grantMap.get(resource.name);
        return {
          ...resource,
          status: grant?.status || null,
          deadline: grant?.deadline || null,
          lastVerified: grant?.last_verified || null,
        } as CanadianResource;
      })
      .filter(r => r.status?.toLowerCase() !== 'closed') // Remove closed grants
  }));
};

export const useIdeas = () => {
  const [ideas, setIdeas] = useState<BusinessIdeaDisplay[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const generateIdeas = useCallback(async (sessionId: string, city?: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in to generate ideas");
        setError("Authentication required");
        return null;
      }

      const response = await fetch(GENERATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 403) {
          toast.error("Payment required to generate ideas");
          setError("Payment required");
        } else if (response.status === 429) {
          toast.error(errorData.error || "Rate limit reached. Please try again later.");
          setError("Rate limit exceeded");
        } else if (response.status === 402) {
          toast.error("AI credits exhausted.");
          setError("Credits exhausted");
        } else if (response.status === 401) {
          toast.error("Please sign in again");
          setError("Authentication required");
        } else {
          toast.error(errorData.error || "Failed to generate ideas");
          setError(errorData.error || "Failed to generate ideas");
        }
        return null;
      }

      const data = await response.json();
      
      // Map database ideas to frontend format - detect version
      const generatedIdeas: BusinessIdeaDisplay[] = (data.ideas || []).map((dbIdea: FtIdeaRow) => 
        isEnhancedIdea(dbIdea) ? mapDbToDisplay(dbIdea, city) : mapLegacyIdea(dbIdea, city)
      );

      // Enrich with live grant status and filter out closed grants
      const enrichedIdeas = await enrichAndFilterResources(generatedIdeas);

      setIdeas(enrichedIdeas);
      return enrichedIdeas;
    } catch (err) {
      console.error("Error generating ideas:", err);
      const message = err instanceof Error ? err.message : "Failed to generate ideas";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const loadExistingIdeas = useCallback(async (sessionId: string, city?: string) => {
    try {
      const { data: dbIdeas, error: fetchError } = await supabase
        .from("ft_ideas")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (fetchError) {
        console.error("Error loading ideas from network:", fetchError);
        const cachedIdeas = await getIdeasFromCache(sessionId);
        if (cachedIdeas && cachedIdeas.length > 0) {
          // Cached ideas are already in BusinessIdeaDisplay format
          setIdeas(cachedIdeas as BusinessIdeaDisplay[]);
          toast.info("Showing cached ideas (offline mode)");
          return cachedIdeas as BusinessIdeaDisplay[];
        }
        return null;
      }

      if (dbIdeas && dbIdeas.length > 0) {
        const loadedIdeas: BusinessIdeaDisplay[] = dbIdeas.map((dbIdea) => 
          isEnhancedIdea(dbIdea) ? mapDbToDisplay(dbIdea, city) : mapLegacyIdea(dbIdea, city)
        );
        
        // Enrich with live grant status and filter out closed grants
        const enrichedIdeas = await enrichAndFilterResources(loadedIdeas);
        
        setIdeas(enrichedIdeas);
        
        // Cache ideas for offline access
        await saveIdeasToCache(sessionId, enrichedIdeas);
        
        return enrichedIdeas;
      }

      return null;
    } catch (err) {
      console.error("Error loading existing ideas:", err);
      const cachedIdeas = await getIdeasFromCache(sessionId);
      if (cachedIdeas && cachedIdeas.length > 0) {
        // Cached ideas are already in BusinessIdeaDisplay format
        setIdeas(cachedIdeas as BusinessIdeaDisplay[]);
        toast.info("Showing cached ideas (offline mode)");
        return cachedIdeas as BusinessIdeaDisplay[];
      }
      return null;
    }
  }, []);

  const loadAllUserIdeas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("Not authenticated");
        return null;
      }

      const { data: dbIdeas, error: fetchError } = await supabase
        .from("ft_ideas")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error loading all ideas:", fetchError);
        const cachedIdeas = await getAllCachedIdeas();
        if (cachedIdeas.length > 0) {
          // Cached ideas are already in BusinessIdeaDisplay format
          setIdeas(cachedIdeas as BusinessIdeaDisplay[]);
          toast.info("Showing cached ideas (offline mode)");
          return cachedIdeas as BusinessIdeaDisplay[];
        }
        setError("Failed to load ideas");
        return null;
      }

      if (dbIdeas && dbIdeas.length > 0) {
        const loadedIdeas: BusinessIdeaDisplay[] = dbIdeas.map((dbIdea) => 
          isEnhancedIdea(dbIdea) ? mapDbToDisplay(dbIdea) : mapLegacyIdea(dbIdea)
        );
        
        // Enrich with live grant status and filter out closed grants
        const enrichedIdeas = await enrichAndFilterResources(loadedIdeas);
        
        setIdeas(enrichedIdeas);
        return enrichedIdeas;
      }

      setIdeas([]);
      return [];
    } catch (err) {
      console.error("Error loading all user ideas:", err);
      const cachedIdeas = await getAllCachedIdeas();
      if (cachedIdeas.length > 0) {
        // Cached ideas are already in BusinessIdeaDisplay format
        setIdeas(cachedIdeas as BusinessIdeaDisplay[]);
        toast.info("Showing cached ideas (offline mode)");
        return cachedIdeas as BusinessIdeaDisplay[];
      }
      setError("Failed to load ideas");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleFavorite = useCallback((ideaId: string) => {
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === ideaId ? { ...idea, isFavorite: !idea.isFavorite } : idea
      )
    );
  }, []);

  const clearIdeas = useCallback(() => {
    setIdeas([]);
    setError(null);
  }, []);

  return {
    ideas,
    isGenerating,
    isLoading,
    error,
    generateIdeas,
    loadExistingIdeas,
    loadAllUserIdeas,
    toggleFavorite,
    clearIdeas,
  };
};