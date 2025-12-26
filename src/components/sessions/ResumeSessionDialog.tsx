import { formatDistanceToNow } from "date-fns";
import { Session } from "@/types/sessions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ResumeSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onContinue: (session: Session) => void;
  onStartFresh: () => void;
}

export function ResumeSessionDialog({
  open,
  onOpenChange,
  session,
  onContinue,
  onStartFresh,
}: ResumeSessionDialogProps) {
  if (!session) return null;

  const relativeTime = formatDistanceToNow(session.updatedAt, { addSuffix: true });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Continue Your Session?</AlertDialogTitle>
          <AlertDialogDescription>
            You have an in-progress session from {relativeTime}. Would you like
            to continue where you left off?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onStartFresh}>Start Fresh</AlertDialogCancel>
          <AlertDialogAction onClick={() => onContinue(session)}>
            Continue Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
