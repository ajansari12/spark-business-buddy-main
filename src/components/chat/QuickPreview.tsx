import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  Laptop, 
  Wrench, 
  TrendingUp,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface BusinessCategory {
  name: string;
  icon: React.ReactNode;
  demand: "High" | "Medium" | "Growing";
  examples: string[];
}

interface QuickPreviewProps {
  province: string;
  city?: string;
  skillsBackground?: string;
  onContinue: () => void;
}

const getCategoriesForProfile = (
  province: string,
  skills?: string
): BusinessCategory[] => {
  // Default categories with local context
  const skillsLower = skills?.toLowerCase() || "";
  
  const categories: BusinessCategory[] = [];
  
  // Service-based (most common)
  if (skillsLower.includes("sale") || skillsLower.includes("market") || skillsLower.includes("customer")) {
    categories.push({
      name: "Professional Services",
      icon: <Briefcase className="h-5 w-5" />,
      demand: "High",
      examples: ["Consulting", "Coaching", "Marketing Agency"]
    });
  } else if (skillsLower.includes("tech") || skillsLower.includes("software") || skillsLower.includes("developer")) {
    categories.push({
      name: "Tech & Digital",
      icon: <Laptop className="h-5 w-5" />,
      demand: "Growing",
      examples: ["SaaS", "App Development", "IT Consulting"]
    });
  } else if (skillsLower.includes("trade") || skillsLower.includes("construction") || skillsLower.includes("electric") || skillsLower.includes("plumb")) {
    categories.push({
      name: "Skilled Trades",
      icon: <Wrench className="h-5 w-5" />,
      demand: "High",
      examples: ["Home Services", "Renovation", "Specialized Repairs"]
    });
  } else {
    categories.push({
      name: "Professional Services",
      icon: <Briefcase className="h-5 w-5" />,
      demand: "High",
      examples: ["Consulting", "Coaching", "Freelancing"]
    });
  }
  
  // Digital/Remote option
  categories.push({
    name: "E-commerce & Digital",
    icon: <Laptop className="h-5 w-5" />,
    demand: "Growing",
    examples: ["Online Store", "Digital Products", "Content Creation"]
  });
  
  // Local service option
  categories.push({
    name: "Local Services",
    icon: <TrendingUp className="h-5 w-5" />,
    demand: "High",
    examples: ["Home Services", "Mobile Services", "Local Delivery"]
  });
  
  return categories.slice(0, 3);
};

const demandColors = {
  High: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Medium: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  Growing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export const QuickPreview = ({ 
  province, 
  city, 
  skillsBackground,
  onContinue 
}: QuickPreviewProps) => {
  const categories = getCategoriesForProfile(province, skillsBackground);
  const locationText = city ? `${city}, ${province}` : province;

  return (
    <div className="p-4 bg-background border-t border-border safe-bottom">
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Quick Preview</h3>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Based on what you've shared, here are 3 business types that could work in <span className="font-medium text-foreground">{locationText}</span>:
        </p>
        
        <div className="space-y-3 mb-4">
          {categories.map((category, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-3 bg-background/80 rounded-lg border border-border/50"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {category.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-sm text-foreground">{category.name}</span>
                  <Badge className={`text-xs ${demandColors[category.demand]}`}>
                    {category.demand} Demand
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {category.examples.join(" • ")}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground text-center mb-3">
          Let me learn a bit more to narrow these down to your TOP options...
        </p>
        
        <Button 
          onClick={onContinue}
          className="w-full touch-target"
          variant="default"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </Card>
    </div>
  );
};
