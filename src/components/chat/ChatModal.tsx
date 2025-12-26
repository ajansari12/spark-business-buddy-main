import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Rocket, ExternalLink } from "lucide-react";

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChatModal = ({ open, onOpenChange }: ChatModalProps) => {
  const navigate = useNavigate();

  const handleOpenFullChat = () => {
    onOpenChange(false);
    navigate("/chat");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[500px] sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Rocket className="w-4 h-4 text-primary-foreground" />
            </div>
            Start Your Journey
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col items-center justify-center h-[calc(100%-80px)] gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
            <Rocket className="w-10 h-10 text-accent" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Ready to discover your business ideas?
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Start a conversation with our AI coach to uncover personalized
              business opportunities tailored to your skills and goals.
            </p>
          </div>
          <Button
            onClick={handleOpenFullChat}
            className="touch-target bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Full Chat
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
