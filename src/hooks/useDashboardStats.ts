import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStats {
  totalSessions: number;
  ideasGenerated: number;
  uniquePdfs: number;
  totalDownloads: number;
  daysSinceJoined: number;
}

interface RecentActivity {
  id: string;
  event_name: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
}

interface LastSession {
  id: string;
  status: string;
  progress: number;
  created_at: string;
  updated_at: string;
}

export const useDashboardStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    ideasGenerated: 0,
    uniquePdfs: 0,
    totalDownloads: 0,
    daysSinceJoined: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [lastSession, setLastSession] = useState<LastSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);

    try {
      // Fetch all data in parallel
      const [sessionsRes, ideasRes, eventsRes, profileRes, lastSessionRes, documentsRes] = await Promise.all([
        // Total sessions
        supabase
          .from("ft_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),

        // Total ideas
        supabase
          .from("ft_ideas")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),

        // Recent events (for activity feed and PDF download count)
        supabase
          .from("ft_events")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),

        // Profile for name and join date
        supabase
          .from("profiles")
          .select("full_name, created_at")
          .eq("id", user.id)
          .maybeSingle(),

        // Last active session
        supabase
          .from("ft_sessions")
          .select("*")
          .eq("user_id", user.id)
          .in("status", ["intake", "ready_to_pay"])
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),

        // Unique PDF documents count
        supabase
          .from("ft_documents")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      // Calculate stats
      const totalSessions = sessionsRes.count || 0;
      const ideasGenerated = ideasRes.count || 0;
      const uniquePdfs = documentsRes.count || 0;

      // Count PDF downloads from events
      const pdfEvents = (eventsRes.data || []).filter(
        (e) => e.event_name === "pdf_downloaded" || e.event_name === "pdf_exported"
      );
      const totalDownloads = pdfEvents.length;

      // Calculate days since joined
      let daysSinceJoined = 0;
      if (profileRes.data?.created_at) {
        const joinDate = new Date(profileRes.data.created_at);
        const now = new Date();
        daysSinceJoined = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      setStats({
        totalSessions,
        ideasGenerated,
        uniquePdfs,
        totalDownloads,
        daysSinceJoined,
      });

      // Set user name
      if (profileRes.data?.full_name) {
        const firstName = profileRes.data.full_name.split(" ")[0];
        setUserName(firstName);
      }

      // Set recent activity (last 5)
      const recentEvents = (eventsRes.data || []).slice(0, 5) as RecentActivity[];
      setRecentActivity(recentEvents);

      // Set last session
      if (lastSessionRes.data) {
        setLastSession(lastSessionRes.data as LastSession);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    recentActivity,
    lastSession,
    isLoading,
    userName,
    refetch: fetchStats,
  };
};
