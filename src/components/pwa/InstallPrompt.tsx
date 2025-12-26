import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface InstallPromptProps {
  show: boolean;
  onClose: () => void;
}

export const InstallPrompt = ({ show, onClose }: InstallPromptProps) => {
  const { canInstall, promptInstall, dismissPrompt } = usePWAInstall();

  if (!show || !canInstall) return null;

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      onClose();
    }
  };

  const handleDismiss = () => {
    dismissPrompt();
    onClose();
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm animate-in slide-in-from-bottom-4">
      <Alert className="bg-card border-primary/20 shadow-lg">
        <Download className="h-4 w-4 text-primary" />
        <AlertTitle className="text-foreground">Install FastTrack</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          Add FastTrack to your home screen for quick access and offline viewing.
        </AlertDescription>
        <div className="flex gap-2 mt-4">
          <Button size="sm" onClick={handleInstall} className="flex-1">
            Install
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDismiss}
            className="flex-1"
          >
            Maybe Later
          </Button>
        </div>
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </Alert>
    </div>
  );
};
