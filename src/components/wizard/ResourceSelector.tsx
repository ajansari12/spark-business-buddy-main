import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, DollarSign, Clock, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ResourceSelectorProps {
  onComplete: (data: {
    budget: number;
    timeCommitment: string;
    incomeGoal: number;
  }) => void;
  initialBudget?: number;
  initialTimeCommitment?: string;
  initialIncomeGoal?: number;
}

const timeCommitmentOptions = [
  { label: "Side Hustle", hours: "5-10", value: "5-10", icon: "🌙", description: "Work evenings & weekends" },
  { label: "Part-Time", hours: "10-20", value: "10-20", icon: "⏰", description: "20-30 hours per week" },
  { label: "Full-Time", hours: "40", value: "40+", icon: "💼", description: "Your main focus" },
  { label: "All In", hours: "60+", value: "60+", icon: "🚀", description: "Building an empire" },
];

const getBusinessExamplesAtBudget = (budget: number): Array<{ emoji: string; name: string }> => {
  if (budget < 1000) {
    return [
      { emoji: "💻", name: "Freelancing" },
      { emoji: "📱", name: "Social Media" },
      { emoji: "✍️", name: "Consulting" },
    ];
  } else if (budget < 5000) {
    return [
      { emoji: "🎨", name: "Design Studio" },
      { emoji: "📸", name: "Photography" },
      { emoji: "🏋️", name: "Fitness Coaching" },
    ];
  } else if (budget < 15000) {
    return [
      { emoji: "🧹", name: "Cleaning Service" },
      { emoji: "🐕", name: "Pet Services" },
      { emoji: "🚗", name: "Mobile Detailing" },
    ];
  } else if (budget < 50000) {
    return [
      { emoji: "🍕", name: "Food Truck" },
      { emoji: "🏠", name: "Property Services" },
      { emoji: "🔧", name: "Contracting" },
    ];
  } else {
    return [
      { emoji: "🏪", name: "Retail Store" },
      { emoji: "☕", name: "Café/Restaurant" },
      { emoji: "🏭", name: "Manufacturing" },
    ];
  }
};

const getLifestyleDescription = (income: number): string => {
  if (income < 3000) {
    return "💰 Extra income for savings and fun money";
  } else if (income < 6000) {
    return "🏡 Cover most living expenses comfortably";
  } else if (income < 10000) {
    return "✨ Live well and build wealth";
  } else {
    return "🚀 Premium lifestyle with rapid wealth building";
  }
};

export const ResourceSelector = ({
  onComplete,
  initialBudget = 5000,
  initialTimeCommitment = "10-20",
  initialIncomeGoal = 5000
}: ResourceSelectorProps) => {
  const [budget, setBudget] = useState([initialBudget]);
  const [timeCommitment, setTimeCommitment] = useState(initialTimeCommitment);
  const [incomeGoal, setIncomeGoal] = useState([initialIncomeGoal]);

  const handleContinue = () => {
    onComplete({
      budget: budget[0],
      timeCommitment,
      incomeGoal: incomeGoal[0],
    });
  };

  const businessExamples = getBusinessExamplesAtBudget(budget[0]);
  const lifestyleDescription = getLifestyleDescription(incomeGoal[0]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Let's customize your perfect match
          </h1>
          <p className="text-muted-foreground text-lg">
            Tell us about your resources and goals
          </p>
        </div>

        <div className="space-y-12">
          {/* Budget Slider */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Investment Budget</h2>
                  <p className="text-sm text-muted-foreground">How much can you invest to start?</p>
                </div>
              </div>

              <div className="mb-6">
                <Slider
                  value={budget}
                  onValueChange={setBudget}
                  min={0}
                  max={100000}
                  step={500}
                  className="mb-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>$0</span>
                  <span>$100K+</span>
                </div>
              </div>

              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-primary mb-2">
                  ${budget[0].toLocaleString()}
                </div>
                <Badge variant="outline" className="text-sm">
                  {budget[0] < 5000 ? "Bootstrapped" : budget[0] < 25000 ? "Moderate Investment" : "Well-Funded"}
                </Badge>
              </div>

              {/* Business Examples */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3 text-center">
                  You could start:
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {businessExamples.map((example, index) => (
                    <motion.div
                      key={example.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <Card className="p-3 text-center hover:shadow-md transition-shadow">
                        <div className="text-3xl mb-2">{example.emoji}</div>
                        <p className="text-xs font-medium leading-tight">{example.name}</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Time Commitment */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Time Commitment</h2>
                  <p className="text-sm text-muted-foreground">Hours per week you can dedicate</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {timeCommitmentOptions.map((option) => (
                  <Card
                    key={option.value}
                    className={cn(
                      "cursor-pointer p-4 text-center transition-all hover:shadow-lg",
                      "border-2",
                      timeCommitment === option.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2 scale-105"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setTimeCommitment(option.value)}
                  >
                    <div className="text-4xl mb-2">{option.icon}</div>
                    <p className="font-semibold text-sm mb-1">{option.label}</p>
                    <p className="text-xs text-muted-foreground mb-2">{option.hours} hrs/week</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </Card>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Income Goal */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Income Goal</h2>
                  <p className="text-sm text-muted-foreground">Monthly revenue target</p>
                </div>
              </div>

              <div className="mb-6">
                <Slider
                  value={incomeGoal}
                  onValueChange={setIncomeGoal}
                  min={1000}
                  max={25000}
                  step={500}
                  className="mb-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>$1K/mo</span>
                  <span>$25K+/mo</span>
                </div>
              </div>

              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-primary mb-2">
                  ${incomeGoal[0].toLocaleString()}
                </div>
                <p className="text-muted-foreground text-sm">per month</p>
              </div>

              {/* Lifestyle Visualization */}
              <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <p className="text-center font-medium">{lifestyleDescription}</p>
              </Card>

              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  💡 Your annual target: ${(incomeGoal[0] * 12).toLocaleString()} CAD
                </p>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center mt-12"
        >
          <Button
            size="lg"
            onClick={handleContinue}
            className="w-full md:w-auto px-12 py-6 text-lg group bg-gradient-to-r from-primary to-primary/80"
          >
            Generate My Business Ideas ✨
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        {/* Helper Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-sm text-muted-foreground mt-4"
        >
          🚀 This will only take 10 seconds
        </motion.p>
      </motion.div>
    </div>
  );
};
