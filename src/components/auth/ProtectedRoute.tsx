import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, profile, loading, isOnboardingRequired, refreshProfile } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show onboarding modal if required
  if (isOnboardingRequired && showOnboarding) {
    return (
      <OnboardingModal
        userId={user.id}
        initialName={profile?.full_name || user.user_metadata?.full_name || ""}
        onComplete={() => {
          setShowOnboarding(false);
          refreshProfile();
        }}
      />
    );
  }

  return <>{children}</>;
};
