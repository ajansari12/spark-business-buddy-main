import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Users,
  MessageSquare,
  Lightbulb,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Beaker,
  Target,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, subDays, format } from "date-fns";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalUsers: number;
  totalSessions: number;
  totalIdeas: number;
  completedSessions: number;
  activeToday: number;
}

interface EventCount {
  event_name: string;
  count: number;
}

interface ExperimentStats {
  experiment_id: string;
  variant: string;
  total: number;
  converted: number;
  conversion_rate: number;
}

interface DailyMetric {
  date: string;
  sessions: number;
  ideas: number;
  users: number;
}

export default function AdminAnalytics() {
  const { profile, loading: authLoading, profileLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [eventCounts, setEventCounts] = useState<EventCount[]>([]);
  const [experimentStats, setExperimentStats] = useState<ExperimentStats[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [dateRange, setDateRange] = useState<"7" | "30" | "90">("30");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    setIsRefreshing(true);
    const daysAgo = parseInt(dateRange);
    const startDate = subDays(new Date(), daysAgo).toISOString();

    try {
      // Fetch core stats in parallel
      const [
        { count: totalUsers },
        { count: totalSessions },
        { count: totalIdeas },
        { count: completedSessions },
        { data: todayActivity },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("ft_sessions").select("*", { count: "exact", head: true }),
        supabase.from("ft_ideas").select("*", { count: "exact", head: true }),
        supabase.from("ft_sessions").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase
          .from("ft_events")
          .select("user_id")
          .gte("created_at", subDays(new Date(), 1).toISOString()),
      ]);

      const uniqueActiveToday = new Set(todayActivity?.map((e) => e.user_id).filter(Boolean)).size;

      setStats({
        totalUsers: totalUsers || 0,
        totalSessions: totalSessions || 0,
        totalIdeas: totalIdeas || 0,
        completedSessions: completedSessions || 0,
        activeToday: uniqueActiveToday,
      });

      // Fetch event counts grouped by event_name
      const { data: eventsData } = await supabase
        .from("ft_events")
        .select("event_name")
        .gte("created_at", startDate);

      if (eventsData) {
        const counts: Record<string, number> = {};
        eventsData.forEach((e) => {
          counts[e.event_name] = (counts[e.event_name] || 0) + 1;
        });
        const sorted = Object.entries(counts)
          .map(([event_name, count]) => ({ event_name, count }))
          .sort((a, b) => b.count - a.count);
        setEventCounts(sorted);
      }

      // Fetch experiment assignments and calculate conversion rates
      const { data: experimentsData } = await supabase
        .from("ft_experiment_assignments")
        .select("experiment_id, variant, converted");

      if (experimentsData) {
        const grouped: Record<string, { total: number; converted: number }> = {};
        experimentsData.forEach((e) => {
          const key = `${e.experiment_id}:${e.variant}`;
          if (!grouped[key]) {
            grouped[key] = { total: 0, converted: 0 };
          }
          grouped[key].total++;
          if (e.converted) grouped[key].converted++;
        });

        const expStats = Object.entries(grouped).map(([key, val]) => {
          const [experiment_id, variant] = key.split(":");
          return {
            experiment_id,
            variant,
            total: val.total,
            converted: val.converted,
            conversion_rate: val.total > 0 ? (val.converted / val.total) * 100 : 0,
          };
        });
        setExperimentStats(expStats);
      }

      // Fetch daily metrics for the chart
      const { data: sessionsDaily } = await supabase
        .from("ft_sessions")
        .select("created_at")
        .gte("created_at", startDate);

      const { data: ideasDaily } = await supabase
        .from("ft_ideas")
        .select("created_at")
        .gte("created_at", startDate);

      // Group by date
      const dailyMap: Record<string, { sessions: number; ideas: number; users: Set<string> }> = {};
      
      sessionsDaily?.forEach((s) => {
        const date = format(new Date(s.created_at), "yyyy-MM-dd");
        if (!dailyMap[date]) dailyMap[date] = { sessions: 0, ideas: 0, users: new Set() };
        dailyMap[date].sessions++;
      });

      ideasDaily?.forEach((i) => {
        const date = format(new Date(i.created_at), "yyyy-MM-dd");
        if (!dailyMap[date]) dailyMap[date] = { sessions: 0, ideas: 0, users: new Set() };
        dailyMap[date].ideas++;
      });

      const metrics = Object.entries(dailyMap)
        .map(([date, data]) => ({
          date,
          sessions: data.sessions,
          ideas: data.ideas,
          users: data.users.size,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setDailyMetrics(metrics);
    } catch (err) {
      console.error("[AdminAnalytics] Error fetching data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (profile?.roles?.includes("admin")) {
      fetchAnalytics();
    }
  }, [profile, dateRange]);

  // Wait for auth
  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect non-admins
  const isAdmin = profile?.roles?.includes("admin");
  if (!profile || !isAdmin) {
    return <Navigate to="/app/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group experiments by experiment_id for display
  const groupedExperiments = useMemo(() => {
    const groups: Record<string, ExperimentStats[]> = {};
    experimentStats.forEach((exp) => {
      if (!groups[exp.experiment_id]) groups[exp.experiment_id] = [];
      groups[exp.experiment_id].push(exp);
    });
    return groups;
  }, [experimentStats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Monitor usage metrics, events, and A/B test results
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as "7" | "30" | "90")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchAnalytics} disabled={isRefreshing}>
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalSessions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalIdeas.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Ideas Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Target className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.completedSessions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.activeToday.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Active Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="experiments" className="flex items-center gap-2">
            <Beaker className="h-4 w-4" />
            Experiments
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Daily Trends
          </TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Event Tracking</CardTitle>
              <CardDescription>
                Top events in the last {dateRange} days ({eventCounts.reduce((sum, e) => sum + e.count, 0).toLocaleString()} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="w-[200px]">Distribution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventCounts.slice(0, 20).map((event) => {
                    const maxCount = eventCounts[0]?.count || 1;
                    const percent = (event.count / maxCount) * 100;
                    return (
                      <TableRow key={event.event_name}>
                        <TableCell className="font-mono text-sm">{event.event_name}</TableCell>
                        <TableCell className="text-right font-medium">
                          {event.count.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Progress value={percent} className="h-2" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {eventCounts.length > 20 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Showing top 20 of {eventCounts.length} events
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experiments Tab */}
        <TabsContent value="experiments">
          <Card>
            <CardHeader>
              <CardTitle>A/B Test Results</CardTitle>
              <CardDescription>
                Experiment performance and conversion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(groupedExperiments).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Beaker className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No experiments running yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedExperiments).map(([experimentId, variants]) => {
                    // Find the best performing variant
                    const sorted = [...variants].sort((a, b) => b.conversion_rate - a.conversion_rate);
                    const bestRate = sorted[0]?.conversion_rate || 0;

                    return (
                      <div key={experimentId} className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Beaker className="h-4 w-4" />
                          {experimentId}
                        </h3>
                        <div className="grid gap-3">
                          {variants.map((variant) => {
                            const isBest = variant.conversion_rate === bestRate && bestRate > 0;
                            const diff = variant.conversion_rate - (variants.find(v => v.variant === 'control')?.conversion_rate || 0);
                            
                            return (
                              <div
                                key={variant.variant}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg",
                                  isBest ? "bg-green-500/10 border border-green-500/30" : "bg-muted/50"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <Badge variant={variant.variant === "control" ? "secondary" : "default"}>
                                    {variant.variant}
                                  </Badge>
                                  {isBest && <Badge className="bg-green-500">Winner</Badge>}
                                </div>
                                <div className="flex items-center gap-6 text-sm">
                                  <div className="text-right">
                                    <p className="font-medium">{variant.total}</p>
                                    <p className="text-xs text-muted-foreground">participants</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">{variant.converted}</p>
                                    <p className="text-xs text-muted-foreground">converted</p>
                                  </div>
                                  <div className="text-right min-w-[80px]">
                                    <p className="font-bold text-lg">{variant.conversion_rate.toFixed(1)}%</p>
                                    {variant.variant !== "control" && diff !== 0 && (
                                      <p className={cn(
                                        "text-xs flex items-center justify-end gap-1",
                                        diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-muted-foreground"
                                      )}>
                                        {diff > 0 ? <ArrowUp className="h-3 w-3" /> : diff < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                                        {Math.abs(diff).toFixed(1)}%
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity</CardTitle>
              <CardDescription>
                Sessions and ideas created per day
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailyMetrics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No activity data available</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Ideas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyMetrics.slice(-14).reverse().map((day) => (
                      <TableRow key={day.date}>
                        <TableCell>{format(new Date(day.date), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-right">{day.sessions}</TableCell>
                        <TableCell className="text-right">{day.ideas}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
