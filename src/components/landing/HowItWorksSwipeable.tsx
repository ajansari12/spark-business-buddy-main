import { MessageSquare, Lightbulb, FileDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useState, useEffect } from "react";
import type { CarouselApi } from "@/components/ui/carousel";

const steps = [
  {
    icon: MessageSquare,
    title: "Tell Your Story",
    description: "Share your skills, interests, and budget through a quick AI chat.",
  },
  {
    icon: Lightbulb,
    title: "Get Matched Ideas",
    description: "Receive personalized business ideas tailored to your Canadian city.",
  },
  {
    icon: FileDown,
    title: "Download Your Plan",
    description: "Get a detailed PDF report with action steps to get started.",
  },
];

export const HowItWorksSwipeable = () => {
  const isMobile = useIsMobile();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <section className="py-16 px-4 bg-card">
      <div className="container max-w-lg lg:max-w-4xl mx-auto">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center text-foreground mb-12">
          How It Works
        </h2>

        {isMobile ? (
          <div className="space-y-6">
            <Carousel
              setApi={setApi}
              opts={{
                align: "center",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2">
                {steps.map((step, index) => (
                  <CarouselItem key={step.title} className="pl-2 basis-[85%]">
                    <div className="bg-background rounded-2xl p-6 shadow-sm border border-border h-full">
                      <div className="relative inline-flex mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <step.icon className="w-6 h-6 text-primary" />
                        </div>
                        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg text-foreground mb-2">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {step.description}
                      </p>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {/* Pagination dots */}
            <div className="flex justify-center gap-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    current === index
                      ? "bg-primary w-6"
                      : "bg-muted-foreground/30"
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="bg-background rounded-2xl p-6 shadow-sm border border-border animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative inline-flex mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
