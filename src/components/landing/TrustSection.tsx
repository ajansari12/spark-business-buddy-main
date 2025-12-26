import { Leaf, Shield, Sparkles } from "lucide-react";

const trustItems = [
  {
    icon: Leaf,
    label: "Made for Canada",
  },
  {
    icon: Shield,
    label: "Privacy-first",
  },
  {
    icon: Sparkles,
    label: "AI-powered",
  },
];

export const TrustSection = () => {
  return (
    <section className="py-12 px-4 bg-muted/30">
      <div className="container max-w-lg mx-auto text-center">
        <p className="font-display font-semibold text-lg text-foreground mb-2">
          Designed for Canadian entrepreneurs
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Privacy-first. No spam. Your data stays yours.
        </p>
        
        <div className="flex justify-center gap-8">
          {trustItems.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
