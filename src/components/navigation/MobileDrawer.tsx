import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Rocket, LogOut, Monitor, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartJourney: () => void;
  onSignOut: () => void;
  isAuthenticated: boolean;
}

export const MobileDrawer = ({
  open,
  onOpenChange,
  onStartJourney,
  onSignOut,
  isAuthenticated,
}: MobileDrawerProps) => {
  const { theme, setTheme } = useTheme();

  const handleNavClick = () => {
    onOpenChange(false);
  };

  const handleStartJourney = () => {
    onOpenChange(false);
    onStartJourney();
  };

  const handleSignOut = () => {
    onOpenChange(false);
    onSignOut();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Rocket className="w-4 h-4 text-primary-foreground" />
            </div>
            FastTrack
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-2 mt-8">
          <Link
            to="/"
            onClick={handleNavClick}
            className="flex items-center px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors touch-target"
          >
            Home
          </Link>
          <Link
            to="/pricing"
            onClick={handleNavClick}
            className="flex items-center px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors touch-target"
          >
            Pricing
          </Link>
          <Link
            to="/faq"
            onClick={handleNavClick}
            className="flex items-center px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors touch-target"
          >
            FAQ
          </Link>

          <div className="border-t border-border my-4" />

          {/* Theme Selection */}
          <div className="px-4 py-2">
            <p className="text-sm text-muted-foreground mb-2">Theme</p>
            <div className="flex gap-2">
              <Button
                variant={theme === "system" ? "secondary" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setTheme("system")}
              >
                <Monitor className="h-4 w-4 mr-1" />
                System
              </Button>
              <Button
                variant={theme === "light" ? "secondary" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-4 w-4 mr-1" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "secondary" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-4 w-4 mr-1" />
                Dark
              </Button>
            </div>
          </div>

          <div className="border-t border-border my-4" />

          <Link
            to="/legal/privacy"
            onClick={handleNavClick}
            className="flex items-center px-4 py-3 text-muted-foreground hover:bg-muted rounded-lg transition-colors touch-target text-sm"
          >
            Privacy Policy
          </Link>
          <Link
            to="/legal/terms"
            onClick={handleNavClick}
            className="flex items-center px-4 py-3 text-muted-foreground hover:bg-muted rounded-lg transition-colors touch-target text-sm"
          >
            Terms of Service
          </Link>
          <Link
            to="/legal/disclaimer"
            onClick={handleNavClick}
            className="flex items-center px-4 py-3 text-muted-foreground hover:bg-muted rounded-lg transition-colors touch-target text-sm"
          >
            Disclaimer
          </Link>
        </nav>

        <div className="absolute bottom-8 left-6 right-6 flex flex-col gap-3">
          <Button
            onClick={handleStartJourney}
            className="w-full touch-target bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isAuthenticated ? "Go to Dashboard" : "Start Journey"}
          </Button>
          {isAuthenticated && (
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full touch-target"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
