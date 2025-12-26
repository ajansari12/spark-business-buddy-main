export type SessionStatus = 
  | "intake" 
  | "ready_to_pay" 
  | "paid" 
  | "generating" 
  | "ideas_generated" 
  | "completed";

export interface Session {
  id: string;
  status: SessionStatus;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  collectedData?: Record<string, any> | null;
}

export interface StatusConfig {
  label: string;
  color: "gray" | "yellow" | "blue" | "green";
  action: string;
}

export const getStatusConfig = (status: SessionStatus): StatusConfig => {
  const configs: Record<SessionStatus, StatusConfig> = {
    intake: { label: "In Progress", color: "gray", action: "Continue" },
    ready_to_pay: { label: "Ready to Pay", color: "yellow", action: "Continue" },
    paid: { label: "Generating...", color: "blue", action: "View Progress" },
    generating: { label: "Generating...", color: "blue", action: "View Progress" },
    ideas_generated: { label: "Complete", color: "green", action: "View Ideas" },
    completed: { label: "Complete", color: "green", action: "View Ideas" },
  };
  return configs[status];
};

export const getStatusBadgeClasses = (color: StatusConfig["color"]): string => {
  const colorMap: Record<StatusConfig["color"], string> = {
    gray: "bg-muted text-muted-foreground",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  };
  return colorMap[color];
};
