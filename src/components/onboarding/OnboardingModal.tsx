import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OnboardingProgress } from "./OnboardingProgress";
import { useOnboarding } from "@/hooks/useOnboarding";
import { canadianProvinces } from "@/data/provinces";
import { Loader2, User, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingModalProps {
  userId: string;
  initialName?: string;
  onComplete: () => void;
}

export const OnboardingModal = ({ userId, initialName, onComplete }: OnboardingModalProps) => {
  const { step, data, isLoading, updateData, nextStep, completeOnboarding } = useOnboarding(
    userId,
    onComplete
  );
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");

  useEffect(() => {
    if (initialName) {
      updateData("fullName", initialName);
    }
  }, [initialName]);

  const handleNext = () => {
    setSlideDirection("left");
    setTimeout(nextStep, 50);
  };

  const canProceedStep1 = data.fullName.trim().length > 0;
  const canProceedStep2 = data.province.length > 0 && data.city.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="pt-safe px-4 py-6">
        <OnboardingProgress currentStep={step} totalSteps={3} />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pb-safe overflow-hidden">
        <div
          className={cn(
            "flex-1 flex flex-col transition-all duration-300",
            slideDirection === "left" ? "animate-fade-in" : "animate-fade-in"
          )}
        >
          {step === 1 && (
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
              <div className="mb-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  What should we call you?
                </h1>
                <p className="text-muted-foreground">
                  This helps us personalize your experience.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={data.fullName}
                    onChange={(e) => updateData("fullName", e.target.value)}
                    className="h-14 text-base"
                    autoComplete="name"
                  />
                </div>

                <Button
                  onClick={handleNext}
                  disabled={!canProceedStep1}
                  className="w-full h-14 text-base rounded-xl"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
              <div className="mb-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Where are you located?
                </h1>
                <p className="text-muted-foreground">
                  We'll tailor business ideas to your region.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="province">Province/Territory</Label>
                  <Select
                    value={data.province}
                    onValueChange={(value) => updateData("province", value)}
                  >
                    <SelectTrigger className="h-14 text-base">
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border">
                      {canadianProvinces.map((province) => (
                        <SelectItem key={province.value} value={province.value}>
                          {province.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Enter your city"
                    value={data.city}
                    onChange={(e) => updateData("city", e.target.value)}
                    className="h-14 text-base"
                    autoComplete="address-level2"
                  />
                </div>

                <Button
                  onClick={handleNext}
                  disabled={!canProceedStep2}
                  className="w-full h-14 text-base rounded-xl"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
              <div className="mb-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Want SMS updates?
                </h1>
                <p className="text-muted-foreground">
                  Get notified about new features and tips. (Optional)
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={data.phone}
                    onChange={(e) => updateData("phone", e.target.value)}
                    className="h-14 text-base"
                    autoComplete="tel"
                  />
                </div>

                <Button
                  onClick={() => completeOnboarding(false)}
                  disabled={isLoading}
                  className="w-full h-14 text-base rounded-xl"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Finish"
                  )}
                </Button>

                <button
                  onClick={() => completeOnboarding(true)}
                  disabled={isLoading}
                  className="w-full text-muted-foreground hover:text-foreground transition-colors py-3"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
