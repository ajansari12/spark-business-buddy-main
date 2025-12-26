/**
 * Generate a human-readable session name from collected data
 * Format: "City • Skills & More • $XK-$YK" or fallback "Business Ideas Session"
 */
export const generateSessionName = (collectedData: Record<string, any> | null | undefined): string => {
  if (!collectedData) return "Business Ideas Session";

  const parts: string[] = [];

  // City
  if (collectedData.city && typeof collectedData.city === "string") {
    parts.push(collectedData.city.trim());
  }

  // Skills (first 2 keywords)
  const skills = collectedData.skills_background || collectedData.skills;
  if (skills && typeof skills === "string") {
    const skillList = skills
      .split(/[,&]+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0 && s.length < 30)
      .slice(0, 2);
    if (skillList.length > 0) {
      parts.push(skillList.join(" & "));
    }
  }

  // Budget range
  const budgetMin = collectedData.budget_min;
  const budgetMax = collectedData.budget_max;
  if (budgetMin != null && budgetMax != null) {
    const formatBudget = (n: number) => {
      if (n >= 1000) return `$${Math.round(n / 1000)}K`;
      return `$${n}`;
    };
    parts.push(`${formatBudget(Number(budgetMin))}-${formatBudget(Number(budgetMax))}`);
  }

  return parts.length > 0 ? parts.join(" • ") : "Business Ideas Session";
};
