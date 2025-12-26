import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Rocket, 
  Lightbulb, 
  FileText, 
  MessageSquare, 
  Calendar,
  ArrowRight,
  Sparkles,
  ClipboardCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useTrackEvent } from "@/hooks/useTrackEvent";
import { useIsMobile } from "@/hooks/use-mobile";
import { useActiveRegistrations } from "@/hooks/useActiveRegistrations";
import { formatDistanceToNow } from "date-fns";
import { stripMarkdown } from "@/lib/utils";

const getEventLabel = (eventName: string): string => {
  const labels: Record<string, string> = {
    landing_visit: "Visited landing page",
    cta_clicked: "Clicked CTA",
    chat_opened: "Started chat",
    chat_message_sent: "Sent message",
    intake_completed: "Completed intake",
    checkout_started: "Started checkout",
    checkout_paid: "Completed payment",
    ideas_generated: "Generated ideas",
    idea_viewed: "Viewed idea",
    pdf_exported: "Exported PDF",
    pdf_downloaded: "Downloaded PDF",
    session_resumed: "Resumed session",
    app_installed: "Installed app",
  };
  return labels[eventName] || eventName;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, recentActivity, lastSession, isLoading, userName } = useDashboardStats();
  const { registrations: activeRegistrations, isLoading: isLoadingRegistrations } = useActiveRegistrations();
  const { track } = useTrackEvent();
  const isMobile = useIsMobile();

  // Track dashboard visit
  useEffect(() => {
    if (user) {
      track("landing_visit", { page: "dashboard" });
    }
  }, [user, track]);

  const statCards = [
    { 
      label: "Sessions", 
      value: stats.totalSessions, 
      icon: MessageSquare, 
      to: "/app/sessions",
      color: "text-primary"
    },
    { 
      label: "Ideas", 
      value: stats.ideasGenerated, 
      icon: Lightbulb, 
      to: "/app/ideas",
      color: "text-amber-500"
    },
    { 
      label: stats.totalDownloads > 0 ? `PDFs (${stats.totalDownloads} downloads)` : "PDFs", 
      value: stats.uniquePdfs, 
      icon: FileText, 
      to: "/app/documents",
      color: "text-green-600"
    },
    { 
      label: "Days", 
      value: stats.daysSinceJoined, 
      icon: Calendar, 
      to: null,
      color: "text-muted-foreground"
    },
  ];

  const handleStartSession = () => {
    track("cta_clicked", { cta: "start_session", location: "dashboard" });
    navigate("/chat");
  };

  const handleStartWizard = () => {
    track("cta_clicked", { cta: "start_wizard", location: "dashboard" });
    navigate("/wizard");
  };

  const handleContinueSession = () => {
    if (lastSession) {
      track("session_resumed", null, lastSession.id);
      navigate("/chat", { state: { sessionId: lastSession.id } });
    }
  };

  // Empty state for new users
  if (!isLoading && stats.totalSessions === 0) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
            Ready to discover your next business?
          </h1>
          <p className="text-muted-foreground max-w-md mb-8">
            Choose how you'd like to get started with personalized business ideas
            tailored to your skills, interests, and goals.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-6">
            {/* Visual Wizard Option */}
            <Card className="border-2 border-primary hover:shadow-lg transition-shadow cursor-pointer group" onClick={handleStartWizard}>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Visual Wizard</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Quick & interactive - just 90 seconds
                </p>
                <Button size="sm" className="w-full">
                  <Rocket className="w-4 h-4 mr-2" />
                  Start Wizard
                </Button>
                <div className="mt-2">
                  <span className="text-xs text-primary font-medium">⚡ Recommended</span>
                </div>
              </CardContent>
            </Card>

            {/* Chat Option */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={handleStartSession}>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Chat with AI</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Detailed conversation - 5-7 minutes
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  Start Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      {/* Welcome Message */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          {isLoading ? (
            <Skeleton className="h-8 w-48" />
          ) : userName ? (
            `Hi ${userName}! 👋`
          ) : (
            "Welcome back! 👋"
          )}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isLoading ? (
            <Skeleton className="h-4 w-64 mt-2" />
          ) : (
            "Here's your progress so far"
          )}
        </p>
      </div>

      {/* Quick Action Card */}
      {lastSession && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Continue your journey</p>
              <p className="text-xs text-muted-foreground truncate">
                {lastSession.progress}% complete • Updated{" "}
                {formatDistanceToNow(new Date(lastSession.updated_at), { addSuffix: true })}
              </p>
            </div>
            <Button size="sm" onClick={handleContinueSession} className="ml-3 shrink-0">
              Continue
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Registrations Card */}
      {!isLoadingRegistrations && activeRegistrations.length > 0 && (
        <Card className="mb-6 border-green-600/20 bg-green-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardCheck className="w-4 h-4 text-green-600" />
              <span className="font-medium text-foreground">Active Registrations</span>
            </div>
            <div className="space-y-3">
              {activeRegistrations.map((reg) => (
                <div key={reg.id} className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {stripMarkdown(reg.idea_title)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {reg.completed_steps.length}/{reg.total_steps} steps • {reg.province}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate(`/app/registration/${reg.idea_id}`)}
                    className="shrink-0"
                  >
                    Continue
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className={`${stat.to ? "cursor-pointer hover:border-primary/50 transition-colors" : ""}`}
            onClick={() => stat.to && navigate(stat.to)}
          >
            <CardContent className="p-4 text-center">
              {isLoading ? (
                <>
                  <Skeleton className="w-5 h-5 mx-auto mb-2 rounded" />
                  <Skeleton className="h-8 w-12 mx-auto mb-1" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </>
              ) : (
                <>
                  <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className={`${isMobile ? "" : "grid grid-cols-2 gap-6"}`}>
        {/* Start New Session CTA */}
        <Card className="mb-6 md:mb-0">
          <CardContent className="p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Rocket className="w-7 h-7 text-accent" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Start a New Session
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Discover more personalized business ideas
            </p>
            <Button
              onClick={handleStartSession}
              className="touch-target w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Rocket className="w-4 h-4 mr-2" />
              New Session
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Recent Activity</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No activity yet. Start a session to begin!
              </p>
            ) : (
              <ul className="space-y-3">
                {recentActivity.map((activity) => (
                  <li key={activity.id} className="flex items-start gap-3 text-sm">
                    <span className="w-2 h-2 rounded-full bg-primary/60 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">
                        {getEventLabel(activity.event_name)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
