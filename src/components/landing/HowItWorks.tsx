import { MessageSquare, CreditCard, Lightbulb } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Chat with AI",
    description: "Answer a few questions about your skills, interests, and goals.",
  },
  {
    icon: CreditCard,
    title: "Unlock Ideas",
    description: "Get instant access with a one-time $9.99 CAD payment.",
  },
  {
    icon: Lightbulb,
    title: "Get Your Ideas",
    description: "Receive 3-5 personalized business ideas tailored just for you.",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-16 px-4 bg-card">
      <div className="container max-w-lg mx-auto">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center text-foreground mb-12">
          How It Works
        </h2>
        
        <div className="space-y-8">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="flex items-start gap-4 animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Step number with icon */}
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
              </div>
              
              {/* Content */}
              <div className="pt-1">
                <h3 className="font-semibold text-lg text-foreground mb-1">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
