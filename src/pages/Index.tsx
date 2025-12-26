import { useEffect, useState } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { SocialProof } from "@/components/landing/SocialProof";
import { HowItWorksSwipeable } from "@/components/landing/HowItWorksSwipeable";
import { TierPreview } from "@/components/landing/TierPreview";
import { TrustSection } from "@/components/landing/TrustSection";
import { FAQPreview } from "@/components/landing/FAQPreview";
import { StickyCTA } from "@/components/landing/StickyCTA";
import { OnboardingChoiceModal } from "@/components/landing/OnboardingChoiceModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTrackEvent } from "@/hooks/useTrackEvent";
import { SEO, OrganizationSchema, ServiceSchema, SoftwareApplicationSchema } from "@/components/SEO";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { track } = useTrackEvent();
  const [showChoiceModal, setShowChoiceModal] = useState(false);

  // Track landing page visit
  useEffect(() => {
    track("landing_visit", { page: "home" });
  }, [track]);

  const handleStartJourney = () => {
    track("cta_clicked", { cta: "start_journey", location: "landing" });
    if (user) {
      // User is logged in - show choice modal
      setShowChoiceModal(true);
    } else {
      // User needs to sign in first
      navigate("/auth");
    }
  };

  const handleSelectWizard = () => {
    track("onboarding_choice", { choice: "wizard", location: "landing" });
    setShowChoiceModal(false);
    navigate("/wizard");
  };

  const handleSelectChat = () => {
    track("onboarding_choice", { choice: "chat", location: "landing" });
    setShowChoiceModal(false);
    navigate("/chat");
  };

  return (
    <>
      <SEO />
      <OrganizationSchema />
      <ServiceSchema />
      <SoftwareApplicationSchema />

      <HeroSection onStartJourney={handleStartJourney} />
      <SocialProof />
      <HowItWorksSwipeable />
      <TierPreview />
      <TrustSection />
      <FAQPreview />
      <StickyCTA onStartJourney={handleStartJourney} />

      {/* Onboarding choice modal */}
      <OnboardingChoiceModal
        open={showChoiceModal}
        onClose={() => setShowChoiceModal(false)}
        onSelectWizard={handleSelectWizard}
        onSelectChat={handleSelectChat}
      />
    </>
  );
};

export default Index;
