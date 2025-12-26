import { MapPin, Clock, Target, Shield } from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Location-Aware",
    description: "Ideas tailored to your Canadian province and local market opportunities.",
  },
  {
    icon: Clock,
    title: "Quick Results",
    description: "Get actionable business ideas in under 10 minutes.",
  },
  {
    icon: Target,
    title: "Personalized Match",
    description: "AI matches ideas to your unique skills, budget, and time commitment.",
  },
  {
    icon: Shield,
    title: "Canadian Focus",
    description: "Built specifically for the Canadian business landscape.",
  },
];

export const Features = () => {
  return (
    <section className="py-16 px-4">
      <div className="container max-w-lg mx-auto">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center text-foreground mb-4">
          Built for Canadian Entrepreneurs
        </h2>
        <p className="text-center text-muted-foreground mb-10 max-w-sm mx-auto">
          Everything you need to discover your perfect business opportunity.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="p-5 rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
