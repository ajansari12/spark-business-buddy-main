import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSessions } from "@/hooks/useSessions";
import { Session, getStatusConfig } from "@/types/sessions";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SwipeableSessionCard } from "@/components/sessions/SwipeableSessionCard";
import { SessionsTable } from "@/components/sessions/SessionsTable";
import { DeleteSessionDialog } from "@/components/sessions/DeleteSessionDialog";
import { MessageSquare, Plus, LayoutGrid, List, RefreshCw } from "lucide-react";

const Sessions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const {
    sessions,
    isLoading,
    isRefreshing,
    loadSessions,
    refreshSessions,
    deleteSession,
  } = useSessions(user?.id);

  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleAction = (session: Session) => {
    const config = getStatusConfig(session.status);
    if (config.action === "View Ideas") {
      navigate("/results", { state: { sessionId: session.id } });
    } else {
      navigate("/chat", { state: { sessionId: session.id } });
    }
  };

  const handleDelete = (session: Session) => {
    setDeleteTarget(session);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteSession(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleNewSession = () => {
    navigate("/chat", { state: { forceNew: true } });
  };

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;
      if (diff > 0 && diff < 100) {
        setPullDistance(diff);
      }
    },
    [isPulling]
  );

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > 60) {
      refreshSessions();
    }
    setPullDistance(0);
    setIsPulling(false);
  }, [pullDistance, refreshSessions]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="container max-w-4xl mx-auto px-4 py-6 overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {isMobile && pullDistance > 0 && (
        <div
          className="flex items-center justify-center transition-all"
          style={{ height: pullDistance }}
        >
          <RefreshCw
            className={`w-5 h-5 text-muted-foreground ${
              pullDistance > 60 ? "animate-spin" : ""
            }`}
            style={{ transform: `rotate(${pullDistance * 3}deg)` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
            Sessions
          </h1>
          <p className="text-muted-foreground text-sm">
            Your AI coaching conversations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isMobile && sessions.length > 0 && (
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("cards")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("table")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          )}
          <Button
            onClick={handleNewSession}
            className="touch-target bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>
      </div>

      {isRefreshing && (
        <div className="flex items-center justify-center py-2 mb-4">
          <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">Refreshing...</span>
        </div>
      )}

      {sessions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              No sessions yet
            </h2>
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
              Start a conversation with our AI coach to discover business ideas
              tailored to you.
            </p>
            <Button
              onClick={handleNewSession}
              variant="outline"
              className="touch-target"
            >
              Start Your First Session
            </Button>
          </CardContent>
        </Card>
      ) : isMobile || viewMode === "cards" ? (
        <div className="space-y-4">
          {sessions.map((session) => (
            <SwipeableSessionCard
              key={session.id}
              session={session}
              onAction={handleAction}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <SessionsTable
          sessions={sessions}
          onAction={handleAction}
          onDelete={handleDelete}
        />
      )}

      <DeleteSessionDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Sessions;
