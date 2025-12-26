import { Button } from "@/components/ui/button";
import { Rocket, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface HeaderProps {
  onStartJourney: () => void;
}

export const Header = ({ onStartJourney }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border safe-top">
      <div className="container max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Rocket className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">
              FastTrack
            </span>
          </div>
          
          {/* CTA or User Actions */}
          {user ? (
            <div className="flex items-center gap-2">
              <Button
                onClick={onStartJourney}
                size="sm"
                className="touch-target bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Continue
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
              onClick={onStartJourney}
              size="sm"
              className="touch-target bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Start
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
