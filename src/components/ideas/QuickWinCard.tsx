// ============================================================================
// QUICK WIN TRACKING
// Interactive checklist for tracking quick win execution
// ============================================================================

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Zap,
  CheckCircle2,
  Clock,
  MessageCircle,
  ChevronRight,
  Sparkles,
  Trophy,
  HelpCircle,
  SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/useEnhancedAnalytics";
import confetti from "canvas-confetti";

// ============================================================================
// TYPES
// ============================================================================

export interface QuickWinTask {
  id: string;
  text: string;
  completed: boolean;
  completed_at?: string;
  notes?: string;
}

export interface QuickWinProgress {
  idea_id: string;
  tasks: QuickWinTask[];
  started_at: string;
  completed_at?: string;
  help_requested?: boolean;
  skipped?: boolean;
}

// ============================================================================
// STORAGE
// ============================================================================

const STORAGE_KEY = "ft_quickwin_progress";

function getStoredProgress(): Record<string, QuickWinProgress> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function storeProgress(ideaId: string, progress: QuickWinProgress): void {
  try {
    const all = getStoredProgress();
    all[ideaId] = progress;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Storage full, ignore
  }
}

// ============================================================================
// TASK PARSING
// ============================================================================

function parseQuickWinToTasks(quickWin: string): QuickWinTask[] {
  // Try to split by numbered items (1., 2., etc.) or bullet points
  const patterns = [
    /\d+\.\s*/g, // "1. Task"
    /•\s*/g, // "• Task"
    /-\s*/g, // "- Task"
    /\n/g, // Newlines
  ];

  let tasks: string[] = [];

  // Try each pattern
  for (const pattern of patterns) {
    const split = quickWin.split(pattern).filter((t) => t.trim().length > 5);
    if (split.length >= 2) {
      tasks = split;
      break;
    }
  }

  // If no pattern worked, treat as single task
  if (tasks.length < 2) {
    tasks = [quickWin];
  }

  return tasks.slice(0, 5).map((text, index) => ({
    id: `task_${index}`,
    text: text.trim(),
    completed: false,
  }));
}

// ============================================================================
// QUICK WIN CARD COMPONENT
// ============================================================================

interface QuickWinCardProps {
  ideaId: string;
  ideaTitle: string;
  quickWin: string;
  sessionId?: string;
  compact?: boolean;
  className?: string;
}

export const QuickWinCard = ({
  ideaId,
  ideaTitle,
  quickWin,
  sessionId,
  compact = false,
  className,
}: QuickWinCardProps) => {
  const { user } = useAuth();
  const { track, startTiming, trackTiming } = useAnalytics();
  
  const [progress, setProgress] = useState<QuickWinProgress | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [helpMessage, setHelpMessage] = useState("");
  const [isSubmittingHelp, setIsSubmittingHelp] = useState(false);
  const [startTime] = useState(startTiming());

  // Initialize progress
  useEffect(() => {
    const stored = getStoredProgress();
    if (stored[ideaId]) {
      setProgress(stored[ideaId]);
    } else {
      const tasks = parseQuickWinToTasks(quickWin);
      const newProgress: QuickWinProgress = {
        idea_id: ideaId,
        tasks,
        started_at: new Date().toISOString(),
      };
      setProgress(newProgress);
      storeProgress(ideaId, newProgress);
    }
  }, [ideaId, quickWin]);

  // Track when shown
  useEffect(() => {
    if (progress) {
      track("quickwin_shown", {
        idea_id: ideaId,
        idea_title: ideaTitle,
        task_count: progress.tasks.length,
      }, sessionId);
    }
  }, [progress?.idea_id]);

  const handleTaskToggle = useCallback(
    (taskId: string) => {
      if (!progress) return;

      const updatedTasks = progress.tasks.map((task) => {
        if (task.id === taskId) {
          const completed = !task.completed;
          return {
            ...task,
            completed,
            completed_at: completed ? new Date().toISOString() : undefined,
          };
        }
        return task;
      });

      const completedCount = updatedTasks.filter((t) => t.completed).length;
      const allCompleted = completedCount === updatedTasks.length;

      const updatedProgress: QuickWinProgress = {
        ...progress,
        tasks: updatedTasks,
        completed_at: allCompleted ? new Date().toISOString() : undefined,
      };

      setProgress(updatedProgress);
      storeProgress(ideaId, updatedProgress);

      // Track completion
      if (allCompleted) {
        trackTiming("quickwin_completed", startTime, {
          idea_id: ideaId,
          idea_title: ideaTitle,
          task_count: updatedTasks.length,
        }, sessionId || undefined);

        // Celebration!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        // Persist to database
        if (user?.id) {
          supabase.from("ft_quickwin_progress").upsert({
            user_id: user.id,
            idea_id: ideaId,
            quick_win: quickWin,
            status: "completed",
            completed_at: new Date().toISOString(),
          } as any);
        }
      } else if (completedCount === 1 && !progress.tasks.some((t) => t.completed)) {
        track("quickwin_started", {
          idea_id: ideaId,
          idea_title: ideaTitle,
        }, sessionId);
      }
    },
    [progress, ideaId, ideaTitle, sessionId, startTime, track, trackTiming, user?.id]
  );

  const handleHelpRequest = useCallback(async () => {
    if (!helpMessage.trim()) return;

    setIsSubmittingHelp(true);

    track("quickwin_help_requested", {
      idea_id: ideaId,
      idea_title: ideaTitle,
      message: helpMessage,
    }, sessionId);

    // Store help request - using ft_events instead of a separate table
    if (user?.id) {
      await supabase.from("ft_events").insert({
        user_id: user.id,
        event_name: "quickwin_help_requested",
        event_data: { idea_id: ideaId, message: helpMessage },
      } as any);
    }

    setIsSubmittingHelp(false);
    setShowHelp(false);
    setHelpMessage("");

    // Update progress
    if (progress) {
      const updatedProgress = { ...progress, help_requested: true };
      setProgress(updatedProgress);
      storeProgress(ideaId, updatedProgress);
    }
  }, [helpMessage, ideaId, ideaTitle, sessionId, track, user?.id, progress]);

  const handleSkip = useCallback(() => {
    track("quickwin_skipped", {
      idea_id: ideaId,
      idea_title: ideaTitle,
      completed_tasks: progress?.tasks.filter((t) => t.completed).length || 0,
    }, sessionId);

    if (progress) {
      const updatedProgress = { ...progress, skipped: true };
      setProgress(updatedProgress);
      storeProgress(ideaId, updatedProgress);
    }
  }, [ideaId, ideaTitle, sessionId, track, progress]);

  if (!progress) {
    return null;
  }

  const completedCount = progress.tasks.filter((t) => t.completed).length;
  const progressPercent = (completedCount / progress.tasks.length) * 100;
  const isCompleted = completedCount === progress.tasks.length;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="flex-shrink-0">
          {isCompleted ? (
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {isCompleted ? "Quick Win Complete!" : "Quick Win"}
          </p>
          <Progress value={progressPercent} className="h-1.5 mt-1" />
        </div>
        <Badge variant={isCompleted ? "default" : "secondary"}>
          {completedCount}/{progress.tasks.length}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none" />
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-base">
                {isCompleted ? "Quick Win Complete!" : "Your Quick Win"}
              </CardTitle>
              <CardDescription>
                {isCompleted
                  ? "Great job taking action!"
                  : "Start today to validate your idea"}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={isCompleted ? "default" : "secondary"}
            className={cn(isCompleted && "bg-green-500")}
          >
            {completedCount}/{progress.tasks.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Progress bar */}
        <div className="space-y-1">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {Math.round(progressPercent)}% complete
          </p>
        </div>

        {/* Tasks */}
        <div className="space-y-2">
          {progress.tasks.map((task, index) => (
            <div
              key={task.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-colors",
                task.completed
                  ? "bg-green-50 dark:bg-green-950/20"
                  : "bg-muted/50 hover:bg-muted"
              )}
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => handleTaskToggle(task.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm",
                    task.completed && "line-through text-muted-foreground"
                  )}
                >
                  {progress.tasks.length > 1 && (
                    <span className="text-muted-foreground">
                      Step {index + 1}:{" "}
                    </span>
                  )}
                  {task.text}
                </p>
                {task.completed && task.completed_at && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed{" "}
                    {new Date(task.completed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-0">
        {!isCompleted && (
          <>
            <Dialog open={showHelp} onOpenChange={setShowHelp}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Need Help?
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Get Help With Your Quick Win</DialogTitle>
                  <DialogDescription>
                    Tell us what you're stuck on and we'll help you move forward.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  placeholder="What's blocking you from completing this quick win?"
                  value={helpMessage}
                  onChange={(e) => setHelpMessage(e.target.value)}
                  className="min-h-[100px]"
                />
                <DialogFooter>
                  <Button
                    onClick={handleHelpRequest}
                    disabled={!helpMessage.trim() || isSubmittingHelp}
                  >
                    {isSubmittingHelp ? "Sending..." : "Send Request"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Skip
            </Button>
          </>
        )}

        {isCompleted && (
          <Button className="w-full" variant="default">
            <Sparkles className="w-4 h-4 mr-2" />
            Continue to Next Steps
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// ============================================================================
// QUICK WIN SUMMARY (for dashboard)
// ============================================================================

interface QuickWinSummaryProps {
  ideaIds: string[];
  className?: string;
}

export const QuickWinSummary = ({ ideaIds, className }: QuickWinSummaryProps) => {
  const [summary, setSummary] = useState({
    total: 0,
    started: 0,
    completed: 0,
    tasks_done: 0,
    tasks_total: 0,
  });

  useEffect(() => {
    const stored = getStoredProgress();
    let started = 0;
    let completed = 0;
    let tasksDone = 0;
    let tasksTotal = 0;

    for (const ideaId of ideaIds) {
      const progress = stored[ideaId];
      if (progress) {
        tasksTotal += progress.tasks.length;
        tasksDone += progress.tasks.filter((t) => t.completed).length;

        if (progress.tasks.some((t) => t.completed)) {
          started++;
        }
        if (progress.completed_at) {
          completed++;
        }
      }
    }

    setSummary({
      total: ideaIds.length,
      started,
      completed,
      tasks_done: tasksDone,
      tasks_total: tasksTotal,
    });
  }, [ideaIds]);

  if (summary.total === 0) {
    return null;
  }

  const progressPercent =
    summary.tasks_total > 0
      ? (summary.tasks_done / summary.tasks_total) * 100
      : 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Quick Win Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={progressPercent} className="h-2 mb-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {summary.tasks_done}/{summary.tasks_total} tasks
          </span>
          <span>
            {summary.completed}/{summary.total} ideas complete
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickWinCard;
