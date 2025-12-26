import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, Search, Loader2, Link2Off, Clock } from "lucide-react";
import type { Grant } from "@/hooks/useAdminGrants";

interface BulkEditUrlsModalProps {
  grants: Grant[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: { id: string; application_url: string }[]) => Promise<void>;
  isSaving: boolean;
}

export function BulkEditUrlsModal({
  grants,
  isOpen,
  onClose,
  onSave,
  isSaving,
}: BulkEditUrlsModalProps) {
  const [editedUrls, setEditedUrls] = useState<Record<string, string>>({});

  const handleUrlChange = (grantId: string, url: string) => {
    setEditedUrls((prev) => ({ ...prev, [grantId]: url }));
  };

  const getEditedUrl = (grant: Grant) => {
    return editedUrls[grant.id] ?? grant.application_url;
  };

  const handleSave = async () => {
    const updates = grants
      .map((grant) => ({
        id: grant.id,
        application_url: getEditedUrl(grant),
      }))
      .filter((update) => {
        const original = grants.find((g) => g.id === update.id);
        return original && update.application_url !== original.application_url && update.application_url.trim();
      });

    if (updates.length === 0) {
      onClose();
      return;
    }

    await onSave(updates);
    setEditedUrls({});
    onClose();
  };

  const handleClose = () => {
    setEditedUrls({});
    onClose();
  };

  const openGoogleSearch = (grantName: string) => {
    const query = encodeURIComponent(`${grantName} Canada official application`);
    window.open(`https://www.google.com/search?q=${query}`, "_blank");
  };

  const openUrl = (url: string) => {
    window.open(url, "_blank");
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const changedCount = grants.filter((grant) => {
    const edited = getEditedUrl(grant);
    return edited !== grant.application_url && edited.trim() && isValidUrl(edited);
  }).length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Fix Broken URLs</DialogTitle>
          <DialogDescription>
            Update application URLs for {grants.length} selected grant(s). Use the search button to find the correct URL.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-4">
            {grants.map((grant) => {
              const currentUrl = getEditedUrl(grant);
              const isValid = isValidUrl(currentUrl);
              const hasChanged = currentUrl !== grant.application_url;

              return (
                <div key={grant.id} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="font-medium">{grant.name}</div>
                      <div className="text-sm text-muted-foreground">{grant.organization}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {grant.url_status === "broken" && (
                        <Badge variant="destructive">
                          <Link2Off className="h-3 w-3 mr-1" />
                          Broken
                        </Badge>
                      )}
                      {grant.url_status === "timeout" && (
                        <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-400">
                          <Clock className="h-3 w-3 mr-1" />
                          Timeout
                        </Badge>
                      )}
                      {hasChanged && isValid && (
                        <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-400">
                          Modified
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`url-${grant.id}`} className="text-xs text-muted-foreground">
                      Application URL
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`url-${grant.id}`}
                        type="url"
                        value={currentUrl}
                        onChange={(e) => handleUrlChange(grant.id, e.target.value)}
                        placeholder="https://..."
                        className={!isValid && currentUrl ? "border-destructive" : ""}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openGoogleSearch(grant.name)}
                        title="Search Google for official URL"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openUrl(currentUrl)}
                        disabled={!isValid}
                        title="Open URL in new tab"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                    {!isValid && currentUrl && (
                      <p className="text-xs text-destructive">Invalid URL format</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="text-sm text-muted-foreground mr-auto">
            {changedCount > 0 ? `${changedCount} URL(s) will be updated` : "No changes to save"}
          </div>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || changedCount === 0}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              `Save ${changedCount} URL(s)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}