import { cn } from "@/lib/utils";
import { CheckCircle, Radio, Target } from "lucide-react";

export type BadgeType = "verified" | "live" | "smart";

interface FeatureBadgeProps {
  type: BadgeType;
  className?: string;
}

const badgeConfig: Record<BadgeType, { label: string; icon: typeof CheckCircle; className: string }> = {
  verified: {
    label: "VERIFIED",
    icon: CheckCircle,
    className: "bg-success/10 text-success border-success/20",
  },
  live: {
    label: "LIVE",
    icon: Radio,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  smart: {
    label: "SMART",
    icon: Target,
    className: "bg-warning/10 text-warning border-warning/20",
  },
};

export const FeatureBadge = ({ type, className }: FeatureBadgeProps) => {
  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};
