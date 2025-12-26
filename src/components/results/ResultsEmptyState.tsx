import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const ResultsEmptyState = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 safe-top safe-bottom">
      <Rocket className="w-16 h-16 text-muted-foreground mb-4" />
      <h1 className="text-xl font-bold text-foreground mb-2">No Data Found</h1>
      <p className="text-muted-foreground text-center mb-6">
        Complete the intake chat first to get personalized business ideas.
      </p>
      <Button onClick={() => navigate("/chat")}>Start Chat</Button>
    </div>
  );
};
