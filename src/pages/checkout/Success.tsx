import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [tierName, setTierName] = useState<string | null>(null);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        toast({
          title: "Missing session",
          description: "No payment session found. Please try again.",
          variant: "destructive",
        });
        setIsVerifying(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/auth");
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ft_verify_payment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ session_id: sessionId }),
          }
        );

        const data = await response.json();

        if (data.success) {
          setVerified(true);
          setTierName(data.tier_id);
          
          // Celebrate!
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } else {
          toast({
            title: "Verification issue",
            description: data.error || "Could not verify payment. Please contact support.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Verification error:", error);
        toast({
          title: "Error",
          description: "Failed to verify payment. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, navigate, toast]);

  const getTierDisplayName = (tier: string | null) => {
    switch (tier) {
      case "starter":
        return "Starter";
      case "complete":
        return "Complete";
      case "vip":
        return "VIP Launch";
      default:
        return "Your Plan";
    }
  };

  const nextSteps = [
    {
      title: "Start Your Discovery Chat",
      description: "Answer a few questions about your skills, interests, and goals.",
      action: () => navigate("/chat"),
      primary: true,
    },
    {
      title: "View Your Dashboard",
      description: "See your sessions, ideas, and progress all in one place.",
      action: () => navigate("/app/dashboard"),
      primary: false,
    },
  ];

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container max-w-2xl mx-auto">
        <Card className="border-success/20 bg-success/5">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-display">
              {verified ? "Payment Successful!" : "Thank You!"}
            </CardTitle>
            {verified && tierName && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <span className="text-lg text-muted-foreground">
                  {getTierDisplayName(tierName)} Plan Activated
                </span>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              {verified
                ? "Your purchase is complete. You now have access to personalized business ideas tailored to your unique skills and goals."
                : "We're processing your order. You should receive a confirmation email shortly."}
            </p>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground text-center">
                What's Next?
              </h3>
              <div className="space-y-3">
                {nextSteps.map((step, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">
                          {step.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                      <Button
                        onClick={step.action}
                        variant={step.primary ? "default" : "outline"}
                        size="sm"
                      >
                        {step.primary ? "Start" : "View"}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Need help?{" "}
                <a
                  href="mailto:support@fasttrack.business"
                  className="text-primary hover:underline"
                >
                  Contact Support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
