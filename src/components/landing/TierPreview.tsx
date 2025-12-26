import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock, Lightbulb, Search, DollarSign, MapPin, FileText } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { tiers } from "@/data/tiers";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { FeatureBadge, BadgeType } from "@/components/ui/feature-badge";

const iconMap: Record<string, typeof Lightbulb> = {
  Lightbulb,
  Search,
  DollarSign,
  MapPin,
  FileText,
};

export const TierPreview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const handleStartTier = (tierId: string) => {
    if (user) {
      navigate(`/chat?tier=${tierId}`);
    } else {
      navigate("/auth");
    }
  };

  const starterTier = tiers.find((t) => t.id === "starter");

  return (
    <section className="py-16 px-4">
      <div className="container max-w-lg lg:max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Choose Your Path
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start with what works for you. Upgrade anytime.
          </p>
        </div>

        <div className={cn(
          "grid gap-6",
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
                {/* Categorized preview for Starter tier */}
                {tier.featureCategories ? (
                  <div className="space-y-3">
                    {tier.featureCategories.map((category) => {
                      const Icon = iconMap[category.icon] || Lightbulb;
                      return (
                        <div
                          key={category.name}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">{category.name}</span>
                            <span className="text-muted-foreground">
                              ({category.features.length})
                            </span>
                          </div>
                          {category.badge && (
                            <FeatureBadge type={category.badge as BadgeType} />
                          )}
                        </div>
                      );
                    })}
                    <Link
                      to="/pricing"
                      className="block text-sm text-accent hover:underline pt-2"
                    >
                      See all {tier.features.length} features →
                    </Link>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {tier.features.slice(0, 5).map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="text-success mt-0.5">✓</span>
                        {feature}
                      </li>
                    ))}
                    {tier.features.length > 5 && (
                      <li className="text-sm text-muted-foreground">
                        + {tier.features.length - 5} more features
                      </li>
                    )}
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
                    onClick={() => handleStartTier(tier.id)}
                    className={cn(
                      "w-full touch-target",
                      tier.highlight
                        ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                        : ""
                    )}
                  >
                    Start for ${tier.price}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
