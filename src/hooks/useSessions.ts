import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, SessionStatus } from "@/types/sessions";
import { toast } from "sonner";

export const useSessions = (userId?: string) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("ft_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error loading sessions:", error);
        toast.error("Failed to load sessions");
        return;
      }

      const mappedSessions: Session[] = (data || []).map((s) => ({
        id: s.id,
        status: s.status as SessionStatus,
        progress: s.progress,
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at),
        collectedData: s.collected_data as Record<string, any> | null,
      }));

      setSessions(mappedSessions);
    } catch (err) {
      console.error("Error loading sessions:", err);
      toast.error("Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const refreshSessions = useCallback(async () => {
    setIsRefreshing(true);
    await loadSessions();
    setIsRefreshing(false);
  }, [loadSessions]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("ft_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) {
        console.error("Error deleting session:", error);
        toast.error("Failed to delete session");
        return false;
      }

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Session deleted");
      return true;
    } catch (err) {
      console.error("Error deleting session:", err);
      toast.error("Failed to delete session");
      return false;
    }
  }, []);

  const getActiveSession = useCallback(async (): Promise<Session | null> => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from("ft_sessions")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["intake", "ready_to_pay"])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        status: data.status as SessionStatus,
        progress: data.progress,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch {
      return null;
    }
  }, [userId]);

  return {
    sessions,
    isLoading,
    isRefreshing,
    loadSessions,
    refreshSessions,
    deleteSession,
    getActiveSession,
  };
};
