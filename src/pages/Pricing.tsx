import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock, Lightbulb, Search, DollarSign, MapPin, FileText, CheckCircle, Radio, Target, Leaf, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { tiers, FeatureCategory } from "@/data/tiers";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { FeatureBadge, BadgeType } from "@/components/ui/feature-badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const iconMap: Record<string, typeof Lightbulb> = {
  Lightbulb,
  Search,
  DollarSign,
  MapPin,
  FileText,
};

const differentiators = [
  {
    icon: CheckCircle,
    title: "VERIFIED Data",
    description: "Real competitors with actual Google ratings, not AI guesses",
    color: "text-success",
  },
  {
    icon: Radio,
    title: "LIVE Intelligence",
    description: "Job postings, news, and market activity updated in real-time",
    color: "text-destructive",
  },
  {
    icon: Target,
    title: "SMART Filtering",
    description: "Only see grants you actually qualify for — saves hours of research",
    color: "text-warning",
  },
  {
    icon: Leaf,
    title: "Canadian Focus",
    description: "Province-specific context, not generic North American advice",
    color: "text-accent",
  },
];

const FeatureCategorySection = ({ category }: { category: FeatureCategory }) => {
  const [isOpen, setIsOpen] = useState(true);
  const Icon = iconMap[category.icon] || Lightbulb;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="w-4 h-4 text-foreground" />
          </div>
          <span className="font-medium text-foreground">{category.name}</span>
          {category.badge && (
            <FeatureBadge type={category.badge as BadgeType} />
          )}
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="space-y-2 pb-4 pl-11">
          {category.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
};

const Pricing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  // Show canceled message if redirected from Stripe
  useEffect(() => {
    if (searchParams.get("canceled") === "true") {
      toast({
        title: "Payment Canceled",
        description: "No worries! You can try again whenever you're ready.",
      });
    }
  }, [searchParams, toast]);

  const handleStartTier = async (tierId: string, comingSoon?: boolean) => {
    // If coming soon, just navigate to chat for now
    if (comingSoon) {
      toast({
        title: "Coming Soon",
        description: "This tier will be available soon. Try Starter to get started!",
      });
      return;
    }

    if (!user) {
      navigate("/auth", { state: { returnTo: "/pricing", tier: tierId } });
      return;
    }

    setLoadingTier(tierId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ft_create_checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ tier_id: tierId }),
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : "Failed to start checkout",
        variant: "destructive",
      });
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Get personalized business ideas tailored to your unique skills and goals. All prices in CAD.
        </p>
      </div>

      {/* What Makes Us Different */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-foreground text-center mb-6">
          What Makes Us Different
        </h2>
        <div className={cn(
          "grid gap-4",
          isMobile ? "grid-cols-2" : "grid-cols-4"
        )}>
          {differentiators.map((item) => (
            <div
              key={item.title}
              className="p-4 rounded-xl bg-muted/30 border border-border text-center"
            >
              <item.icon className={cn("w-6 h-6 mx-auto mb-2", item.color)} />
              <h3 className="font-medium text-foreground text-sm mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className={cn(
        "grid gap-6 max-w-4xl mx-auto",
        isMobile ? "grid-cols-1" : "grid-cols-3"
      )}>
        {tiers.map((tier) => (
          <Card
            key={tier.id}
            className={cn(
              "relative overflow-hidden transition-all",
              tier.highlight
                ? "border-2 border-accent shadow-lg"
                : "border-border",
              !isMobile && tier.highlight && "scale-105"
            )}
          >
            {tier.badge && (
              <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-xs px-3 py-1 rounded-bl-lg font-medium">
                {tier.badge}
              </div>
            )}

            <CardHeader className="pb-4">
              <h3 className="text-xl font-semibold text-foreground">
                {tier.name}
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">
                  ${tier.price}
                </span>
                <span className="text-muted-foreground text-sm">CAD</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {tier.description}
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Full categorized features for Starter */}
              {tier.featureCategories ? (
                <div className="divide-y divide-border">
                  {tier.featureCategories.map((category) => (
                    <FeatureCategorySection
                      key={category.name}
                      category={category}
                    />
                  ))}
                </div>
              ) : (
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}

              {tier.comingSoon ? (
                <Button
                  variant="outline"
                  className="w-full touch-target"
                  disabled
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Coming Soon
                </Button>
              ) : (
                <Button
                  onClick={() => handleStartTier(tier.id, tier.comingSoon)}
                  disabled={loadingTier === tier.id}
                  className={cn(
                    "w-full touch-target",
                    tier.highlight
                      ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                      : ""
                  )}
                >
                  {loadingTier === tier.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    `Start for $${tier.price}`
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Money-back guarantee */}
      <div className="text-center mt-12 p-6 bg-muted/30 rounded-2xl max-w-md mx-auto">
        <p className="font-semibold text-foreground mb-2">
          100% Satisfaction Guarantee
        </p>
        <p className="text-sm text-muted-foreground">
          If you haven't viewed your ideas yet, we'll give you a full refund. No questions asked.
        </p>
      </div>
    </div>
  );
};

export default Pricing;
