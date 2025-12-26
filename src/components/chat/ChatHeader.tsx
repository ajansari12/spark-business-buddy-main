import { ArrowLeft, MoreVertical, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useState } from "react";

interface ChatHeaderProps {
  onBack: () => void;
  onSaveExit: () => void;
  onStartOver: () => void;
  isTyping?: boolean;
}

export const ChatHeader = ({
  onBack,
  onSaveExit,
  onStartOver,
  isTyping,
}: ChatHeaderProps) => {
  const [showResetDialog, setShowResetDialog] = useState(false);

  return (
    <>
      <header className="flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-10">
        <button
          onClick={onBack}
          className="touch-target flex items-center justify-center -ml-2"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Rocket className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground text-sm">FastTrack Coach</h1>
            <p className="text-xs text-muted-foreground">
              {isTyping ? "Typing..." : "Online"}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="touch-target -mr-2">
              <MoreVertical className="w-5 h-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onSaveExit}>
              Save & Exit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowResetDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              Start Over
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a Fresh Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will start a fresh session. Your current progress will be saved and you can access it from your Sessions list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowResetDialog(false);
                onStartOver();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Start Fresh
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
