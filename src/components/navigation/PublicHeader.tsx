import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Rocket, Menu, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileDrawer } from "./MobileDrawer";
import { ThemeToggle } from "./ThemeToggle";
import { toast } from "sonner";

export const PublicHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const handleStartJourney = () => {
    if (user) {
      navigate("/app/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border safe-top">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Rocket className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg text-foreground">
                FastTrack
              </span>
            </Link>

            {/* Desktop Navigation */}
            {!isMobile && (
              <nav className="flex items-center gap-6">
                <Link
                  to="/pricing"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  to="/faq"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  FAQ
                </Link>
                <ThemeToggle />
              </nav>
            )}

            {/* CTA or User Actions */}
            {isMobile ? (
              <Button
                variant="ghost"
                size="icon"
                className="touch-target"
                onClick={() => setDrawerOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            ) : user ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleStartJourney}
                  size="sm"
                  className="touch-target bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  Dashboard
                </Button>
                <Button
                  onClick={handleSignOut}
                  size="sm"
                  variant="ghost"
                  className="touch-target"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleStartJourney}
                size="sm"
                className="touch-target bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Start Journey
              </Button>
            )}
          </div>
        </div>
      </header>

      <MobileDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onStartJourney={handleStartJourney}
        onSignOut={handleSignOut}
        isAuthenticated={!!user}
      />
    </>
  );
};
