import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MessageSquare, Zap, Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface OnboardingChoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSelectWizard: () => void;
  onSelectChat: () => void;
}

export const OnboardingChoiceModal = ({
  open,
  onClose,
  onSelectWizard,
  onSelectChat,
}: OnboardingChoiceModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl md:text-3xl font-bold text-center mb-2">
            How would you like to get started?
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Choose your preferred way to discover your perfect business idea
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {/* Visual Wizard Option */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card
              className="relative overflow-hidden cursor-pointer group hover:shadow-xl transition-all border-2 hover:border-primary"
              onClick={onSelectWizard}
            >
              {/* Recommended badge */}
              <div className="absolute top-3 right-3 z-10">
                <Badge className="bg-primary text-primary-foreground">
                  ⚡ Recommended
                </Badge>
              </div>

              <CardContent className="p-6">
                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-2">Quick Visual Setup</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Swipe through beautiful cards to tell us about yourself. Fast, fun, and mobile-friendly.
                </p>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>
                      <Clock className="inline w-3 h-3 mr-1" />
                      Just <strong>90 seconds</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Tap and swipe - no typing required</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>See industry examples as you go</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Perfect for mobile devices</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 group-hover:scale-105 transition-transform"
                  size="lg"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Start Fast Setup
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-3">
                  3 simple screens → Your ideas
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Chat Option */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              className="overflow-hidden cursor-pointer group hover:shadow-xl transition-all border-2 hover:border-primary/50"
              onClick={onSelectChat}
            >
              <CardContent className="p-6">
                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-2">Chat with AI</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Have a guided conversation with our AI assistant. Get personalized questions and advice.
                </p>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>
                      <Clock className="inline w-3 h-3 mr-1" />
                      About <strong>5-7 minutes</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Natural conversation flow</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Get guidance and suggestions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Ask questions along the way</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full group-hover:scale-105 transition-transform"
                  variant="outline"
                  size="lg"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Start Conversation
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-3">
                  Conversational & personalized
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom note */}
        <p className="text-xs text-center text-muted-foreground mt-4">
          💡 Don't worry - you can switch between modes anytime
        </p>
      </DialogContent>
    </Dialog>
  );
};
