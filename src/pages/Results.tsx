import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIdeas } from "@/hooks/useIdeas";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useAnalytics } from "@/hooks/useEnhancedAnalytics";
import { useOrderTier } from "@/hooks/useOrderTier";
import { BusinessIdeaDisplay } from "@/types/ideas-enhanced";
import { FTExtractedData } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generatePDF } from "@/utils/pdfExport";

// Components
import {
  ResultsHeader,
  ResultsLoading,
  ResultsGrid,
  ResultsMobileNav,
  ResultsEmptyState,
  ResultsFooter,
  SelectedBusinessCard,
} from "@/components/results";
import { IdeaDetails } from "@/components/ideas/IdeaDetails";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { MarketIntelligenceSummary } from "@/components/ideas/MarketIntelligenceSummary";
import { TrendingInYourArea } from "@/components/ideas/TrendingInYourArea";
import { IdeaChatPanel } from "@/components/ideas/IdeaChatPanel";
import { IdeaComparisonTool } from "@/components/ideas/IdeaComparisonTool";
import { QuickWinCard } from "@/components/ideas/QuickWinCard";

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { ideas, isGenerating, error, generateIdeas, loadExistingIdeas, toggleFavorite } = useIdeas();
  const isMobile = useIsMobile();
  const { canInstall } = usePWAInstall();
  const { track } = useAnalytics();
  const { tier } = useOrderTier(location.state?.sessionId);

  const [selectedIdea, setSelectedIdea] = useState<BusinessIdeaDisplay | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const hasTrackedIdeasRef = useRef(false);
  const [fetchedExtractedData, setFetchedExtractedData] = useState<FTExtractedData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRefreshingMarketData, setIsRefreshingMarketData] = useState(false);

  // Get data from navigation state
  const sessionId = location.state?.sessionId as string | undefined;
  const extractedData = location.state?.extractedData as FTExtractedData | undefined;

  // Use navigation state or fetched data as fallback
  const hasExtractedData = extractedData && Object.keys(extractedData).some(k => extractedData[k as keyof FTExtractedData] != null);
  const effectiveExtractedData = hasExtractedData ? extractedData : fetchedExtractedData;
  const city = effectiveExtractedData?.city || undefined;

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch extracted data from session if navigation state is missing
  useEffect(() => {
    const fetchSessionData = async () => {
      const isEmptyExtractedData = !extractedData || !Object.keys(extractedData).some(k => extractedData[k as keyof FTExtractedData] != null);
      if (isEmptyExtractedData && sessionId && user) {
        const { data } = await supabase
          .from("ft_sessions")
          .select("collected_data")
          .eq("id", sessionId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (data?.collected_data) {
          setFetchedExtractedData(data.collected_data as unknown as FTExtractedData);
        }
      }
    };
    fetchSessionData();
  }, [extractedData, sessionId, user]);

  // Generate or load ideas on mount
  useEffect(() => {
    if (user && sessionId && !hasGenerated && !isGenerating && ideas.length === 0) {
      setHasGenerated(true);
      loadExistingIdeas(sessionId, city).then((existing) => {
        if (!existing || existing.length === 0) {
          generateIdeas(sessionId, city);
        }
      });
    }
  }, [user, sessionId, hasGenerated, isGenerating, ideas.length, generateIdeas, loadExistingIdeas, city]);

  // Show install prompt after ideas are loaded
  useEffect(() => {
    if (ideas.length > 0) {
      if (!hasTrackedIdeasRef.current) {
        hasTrackedIdeasRef.current = true;
        track("ideas_generated", { count: ideas.length }, sessionId);
      }

      if (canInstall && !showInstallPrompt) {
        const timer = setTimeout(() => setShowInstallPrompt(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [ideas.length, canInstall, showInstallPrompt, sessionId, track]);

  // Handlers
  const handleViewDetails = (idea: BusinessIdeaDisplay) => {
    track("idea_viewed", { idea_id: idea.id }, sessionId);
    setSelectedIdea(idea);
  };

  const handleCloseDetails = () => setSelectedIdea(null);

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
    if (selectedIdea?.id === id) {
      setSelectedIdea((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  };

  const handleRegenerate = () => {
    if (sessionId) generateIdeas(sessionId, city);
  };

  const handleExportPDF = async () => {
    if (!sessionId || ideas.length === 0 || !effectiveExtractedData || !user) return;

    track("pdf_exported", null, sessionId);
    await generatePDF(ideas, effectiveExtractedData, user?.user_metadata?.full_name, sessionId, tier);

    try {
      const { data: existing } = await supabase
        .from("ft_documents")
        .select("id")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .eq("doc_type", "tier1_report")
        .maybeSingle();

      if (!existing) {
        await supabase.from("ft_documents").insert({
          user_id: user.id,
          session_id: sessionId,
          doc_type: "tier1_report",
          file_path: `${user.id}/${sessionId}/report.pdf`,
        });
      }
    } catch (err) {
      console.error("Error tracking document:", err);
    }

    track("pdf_downloaded", null, sessionId);
    toast.success("Report downloaded!");
  };

  const handleRefreshMarketData = async () => {
    if (!user || ideas.length === 0) return;

    setIsRefreshingMarketData(true);
    try {
      const ideaIds = ideas.map((i) => i.id);
      const { error } = await supabase.functions.invoke("ft_backfill_market_signals", {
        body: { idea_ids: ideaIds },
      });

      if (error) {
        toast.error("Failed to refresh market data");
        return;
      }

      toast.success("Market data updated!");
      if (sessionId) await loadExistingIdeas(sessionId, city);
    } catch (err) {
      toast.error("Failed to refresh market data");
    } finally {
      setIsRefreshingMarketData(false);
    }
  };

  // Render states
  if (authLoading) return <ResultsLoading type="auth" />;
  if (!sessionId) return <ResultsEmptyState />;

  const showIdeas = ideas.length > 0 && !isGenerating;

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top">
      <ResultsHeader
        ideasCount={ideas.length}
        isGenerating={isGenerating}
        onRegenerate={handleRegenerate}
      />

      <main className="flex-1 py-6">
        {/* Market Intelligence Summary */}
        {showIdeas && (
          <div className="px-4 mb-2">
            <MarketIntelligenceSummary ideas={ideas} />
          </div>
        )}

        {/* Selected Business Card */}
        {effectiveExtractedData && showIdeas && (
          <SelectedBusinessCard extractedData={effectiveExtractedData} />
        )}

        {/* Trending Businesses */}
        {showIdeas && effectiveExtractedData && (
          <div className="px-4 mb-4">
            <TrendingInYourArea
              budgetMin={effectiveExtractedData.budget_min || 5000}
              budgetMax={effectiveExtractedData.budget_max || 50000}
              province={effectiveExtractedData.province || "Ontario"}
              city={effectiveExtractedData.city}
              skillsBackground={effectiveExtractedData.skills_background}
              selectedBusiness={
                effectiveExtractedData.selected_trending_business?.business_type ||
                effectiveExtractedData.business_idea
              }
            />
          </div>
        )}

        {/* Loading/Error/Content States */}
        {isGenerating ? (
          <ResultsLoading type="generating" />
        ) : error ? (
          <ResultsLoading type="error" error={error} onRetry={handleRegenerate} />
        ) : ideas.length > 0 ? (
          isMobile ? (
            <ResultsMobileNav
              ideas={ideas}
              currentIndex={currentIndex}
              onIndexChange={setCurrentIndex}
              onToggleFavorite={handleToggleFavorite}
              onViewDetails={handleViewDetails}
            />
          ) : (
            <ResultsGrid
              ideas={ideas}
              onToggleFavorite={handleToggleFavorite}
              onViewDetails={handleViewDetails}
            />
          )
        ) : null}
      </main>

      {/* Footer */}
      {showIdeas && (
        <ResultsFooter
          onExportPDF={handleExportPDF}
          onRefreshMarketData={handleRefreshMarketData}
          isRefreshingMarketData={isRefreshingMarketData}
          canExport={!!effectiveExtractedData}
        />
      )}

      {/* Enhanced Features */}
      {ideas.length > 1 && !isGenerating && (
        <div className="px-4 pb-4 space-y-4">
          <IdeaComparisonTool
            ideas={ideas.map((idea) => ({
              id: idea.id,
              title: idea.name,
              tagline: idea.tagline,
              category: idea.category,
              viability_score: idea.viabilityScore,
              risk_level: idea.riskLevel,
              investment_min: idea.startupCostBreakdown?.total || 0,
              investment_max: idea.startupCostBreakdown?.total || 0,
              time_to_revenue: idea.timeToRevenue,
              time_to_launch: idea.timeToLaunch,
              financials: {
                startup_cost_breakdown: idea.startupCostBreakdown,
                monthly_revenue_low: 0,
                monthly_revenue_high: 0,
                break_even_months: 0,
                monthly_expenses: 0,
              },
              market_analysis: {
                why_fit: idea.whyItFits,
                competitors: idea.competitors,
                challenges: idea.challenges,
              },
              confidence_factors: idea.confidenceFactors,
            }))}
            sessionId={sessionId}
          />
        </div>
      )}

      {/* Quick Win Card */}
      {showIdeas && ideas[currentIndex]?.quickWin && (
        <div className="px-4 pb-4">
          <QuickWinCard
            ideaId={ideas[currentIndex].id}
            ideaTitle={ideas[currentIndex].name}
            quickWin={ideas[currentIndex].quickWin!}
            sessionId={sessionId}
          />
        </div>
      )}

      {/* Idea Chat Panel */}
      {ideas.length > 0 && sessionId && effectiveExtractedData && (
        <IdeaChatPanel sessionId={sessionId} ideas={ideas} userProfile={effectiveExtractedData} />
      )}

      {/* Details Modal */}
      <IdeaDetails
        idea={selectedIdea}
        open={!!selectedIdea}
        onClose={handleCloseDetails}
        onToggleFavorite={() => selectedIdea && handleToggleFavorite(selectedIdea.id)}
      />

      {/* PWA Install Prompt */}
      <InstallPrompt show={showInstallPrompt} onClose={() => setShowInstallPrompt(false)} />
    </div>
  );
};

export default Results;
