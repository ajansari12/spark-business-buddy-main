import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { clearAllCachedData } from "@/lib/offlineStorage";
import ThemeSelector from "./ThemeSelector";

const AppSection = () => {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await clearAllCachedData();
      toast.success("Cached data cleared successfully");
    } catch (error) {
      console.error("Failed to clear cache:", error);
      toast.error("Failed to clear cached data");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-base">Theme</Label>
        <ThemeSelector />
      </div>

      <div className="space-y-3">
        <Label className="text-base">Cached Data</Label>
        <p className="text-sm text-muted-foreground">
          Clear locally stored data for offline use
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full h-12 gap-2">
              <Trash2 className="h-4 w-4" />
              Clear Cached Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Cached Data?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all locally stored ideas and pending messages. 
                Your data on the server will not be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearCache}
                disabled={isClearing}
              >
                {isClearing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  "Clear Data"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AppSection;
