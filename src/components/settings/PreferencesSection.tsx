import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail } from "lucide-react";
import { toast } from "sonner";

const PREFS_KEY = "fasttrack-preferences";

interface Preferences {
  pushNotifications: boolean;
  emailUpdates: boolean;
}

const PreferencesSection = () => {
  const [prefs, setPrefs] = useState<Preferences>({
    pushNotifications: false,
    emailUpdates: true,
  });
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    setPushSupported("Notification" in window);

    // Load saved preferences
    const saved = localStorage.getItem(PREFS_KEY);
    if (saved) {
      try {
        setPrefs(JSON.parse(saved));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const updatePref = async (key: keyof Preferences, value: boolean) => {
    // Handle push notification permission
    if (key === "pushNotifications" && value) {
      if (Notification.permission === "denied") {
        toast.error("Notifications are blocked. Please enable them in your browser settings.");
        return;
      }
      
      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("Notification permission denied");
          return;
        }
      }
    }

    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    localStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
    toast.success("Preferences updated");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <div>
            <Label htmlFor="push-notifications" className="text-base cursor-pointer">
              Push Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              {pushSupported 
                ? "Get notified about order updates" 
                : "Not supported in this browser"}
            </p>
          </div>
        </div>
        <Switch
          id="push-notifications"
          checked={prefs.pushNotifications}
          onCheckedChange={(checked) => updatePref("pushNotifications", checked)}
          disabled={!pushSupported}
          className="touch-target"
        />
      </div>

      <div className="flex items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <div>
            <Label htmlFor="email-updates" className="text-base cursor-pointer">
              Email Updates
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive news and feature updates
            </p>
          </div>
        </div>
        <Switch
          id="email-updates"
          checked={prefs.emailUpdates}
          onCheckedChange={(checked) => updatePref("emailUpdates", checked)}
          className="touch-target"
        />
      </div>
    </div>
  );
};

export default PreferencesSection;
