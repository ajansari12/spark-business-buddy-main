import jsPDF from "jspdf";
import QRCode from "qrcode";
import { BusinessIdeaDisplay, Competitor, CanadianResource, StartupCostBreakdown, SWOTAnalysis, PricingStrategy, RiskMitigationItem } from "@/types/ideas-enhanced";
import { FTExtractedData } from "@/types/chat";
import { OrderTier } from "@/hooks/useOrderTier";

// ============= COLOR SYSTEM =============
const COLORS = {
  PRIMARY: [30, 58, 95] as [number, number, number],       // #1E3A5F - Deep Navy
  PRIMARY_LIGHT: [240, 244, 248] as [number, number, number], // Light primary bg
  SUCCESS: [46, 125, 50] as [number, number, number],     // #2E7D32 - Green
  SUCCESS_LIGHT: [232, 245, 233] as [number, number, number], // Light green bg
  WARNING: [234, 179, 8] as [number, number, number],     // Yellow
  WARNING_LIGHT: [255, 247, 237] as [number, number, number], // Light orange/yellow
  ACCENT: [213, 43, 30] as [number, number, number],      // #D52B1E - Maple Red
  ACCENT_LIGHT: [255, 243, 242] as [number, number, number], // Light red bg
  MUTED: [100, 116, 139] as [number, number, number],     // Slate gray
  MUTED_LIGHT: [248, 248, 248] as [number, number, number], // Light gray bg
  TEXT: [30, 58, 95] as [number, number, number],         // Same as PRIMARY
  BLUE: [59, 130, 246] as [number, number, number],       // Blue for mid-range
  WHITE: [255, 255, 255] as [number, number, number],
  GOLD: [255, 215, 0] as [number, number, number],        // Gold for stars
};

// ============= HELPER FUNCTIONS =============

const getRiskColor = (risk: string): [number, number, number] => {
  switch (risk) {
    case "Low": return COLORS.SUCCESS;
    case "Medium": return COLORS.WARNING;
    case "High": return COLORS.ACCENT;
    default: return COLORS.MUTED;
  }
};

const getViabilityColor = (score: number): [number, number, number] => {
  if (score >= 8.5) return COLORS.SUCCESS;
  if (score >= 7) return COLORS.BLUE;
  return COLORS.WARNING;
};

const riskOrder: Record<string, number> = { 'Low': 0, 'Medium': 1, 'High': 2 };

const formatShortMoney = (value: string): string => {
  if (!value || value === "TBD" || value === "N/A") return value;
  const numbers = value.match(/[\d,]+/g);
  if (!numbers || numbers.length === 0) return value;
  
  const format = (n: number) => n >= 1000 ? `$${Math.round(n/1000)}K` : `$${n}`;
  const low = parseInt(numbers[0].replace(/,/g, ""));
  
  if (numbers.length >= 2) {
    const high = parseInt(numbers[1].replace(/,/g, ""));
    return `${format(low)}-${format(high)}`;
  }
  return format(low);
};

// Draw a section divider with icon and title
const addSectionDivider = (
  doc: jsPDF,
  yPosition: number,
  margin: number,
  contentWidth: number,
  title: string,
  iconType: "chart" | "money" | "building" | "calendar" | "maple"
): number => {
  // Draw icon
  const iconSize = 6;
  const iconX = margin;
  const iconY = yPosition;
  
  doc.setFillColor(...COLORS.PRIMARY);
  
  switch (iconType) {
    case "money":
      doc.roundedRect(iconX, iconY - 4, iconSize, iconSize, 1, 1, "F");
      doc.setTextColor(...COLORS.WHITE);
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      doc.text("$", iconX + 1.5, iconY);
      break;
    case "chart":
      doc.rect(iconX, iconY - 4, iconSize, iconSize, "F");
      doc.setDrawColor(...COLORS.WHITE);
      doc.setLineWidth(0.5);
      doc.line(iconX + 1.5, iconY - 1, iconX + 1.5, iconY + 1);
      doc.line(iconX + 3, iconY - 2, iconX + 3, iconY + 1);
      doc.line(iconX + 4.5, iconY - 1.5, iconX + 4.5, iconY + 1);
      break;
    case "building":
      doc.rect(iconX, iconY - 4, iconSize, iconSize, "F");
      doc.setFillColor(...COLORS.WHITE);
      doc.rect(iconX + 1, iconY - 3, 4, 4, "F");
      break;
    case "calendar":
      doc.roundedRect(iconX, iconY - 4, iconSize, iconSize, 1, 1, "F");
      doc.setDrawColor(...COLORS.WHITE);
      doc.line(iconX + 1.5, iconY - 3, iconX + iconSize - 1.5, iconY - 3);
      break;
    case "maple":
      doc.setFillColor(...COLORS.ACCENT);
      doc.circle(iconX + 3, iconY - 1, 3, "F");
      doc.setTextColor(...COLORS.WHITE);
      doc.setFontSize(5);
      doc.setFont("helvetica", "bold");
      doc.text("CA", iconX + 1, iconY);
      break;
  }
  
  // Title
  doc.setTextColor(...COLORS.TEXT);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, iconX + iconSize + 4, yPosition);
  
  // Divider line
  const titleWidth = doc.getTextWidth(title);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(iconX + iconSize + 8 + titleWidth, yPosition - 2, margin + contentWidth, yPosition - 2);
  
  return yPosition + 10;
};

// Draw a stat card with shadow effect
const drawStatCard = (
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  accentColor: [number, number, number] = COLORS.PRIMARY
): void => {
  // Shadow effect
  doc.setFillColor(230, 230, 230);
  doc.roundedRect(x + 1, y + 1, w, h, 2, 2, "F");
  
  // Main card
  doc.setFillColor(...COLORS.MUTED_LIGHT);
  doc.roundedRect(x, y, w, h, 2, 2, "F");
  
  // Left accent bar
  doc.setFillColor(...accentColor);
  doc.rect(x, y, 3, h, "F");
  
  // Label
  doc.setTextColor(...COLORS.MUTED);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(label.toUpperCase(), x + 6, y + 10);
  
  // Value
  doc.setTextColor(...COLORS.TEXT);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  const valueLines = doc.splitTextToSize(value || "N/A", w - 10);
  doc.text(valueLines[0], x + 6, y + 22);
};

// Draw a gauge/progress bar
const drawGaugeBar = (
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  fillPercent: number,
  color: [number, number, number]
): void => {
  const h = 6;
  // Background
  doc.setFillColor(220, 220, 220);
  doc.roundedRect(x, y, w, h, 2, 2, "F");
  
  // Fill
  const fillWidth = Math.max(0, Math.min(w, (fillPercent / 100) * w));
  if (fillWidth > 0) {
    doc.setFillColor(...color);
    doc.roundedRect(x, y, fillWidth, h, 2, 2, "F");
  }
};

// Add professional footer to all pages
const addProfessionalFooter = (doc: jsPDF, margin: number): void => {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 10;
    
    // Divider line
    doc.setDrawColor(235, 235, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
    
    // Left: Brand
    doc.setTextColor(...COLORS.PRIMARY);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("FastTrack.Business", margin, footerY);
    
    // Center: Page number
    doc.setTextColor(...COLORS.MUTED);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const pageText = `— ${i} of ${totalPages} —`;
    const pageTextWidth = doc.getTextWidth(pageText);
    doc.text(pageText, (pageWidth - pageTextWidth) / 2, footerY);
    
    // Right: Confidential
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.MUTED);
    const confText = "Confidential";
    doc.text(confText, pageWidth - margin - doc.getTextWidth(confText), footerY);
  }
};

// ============= MAIN PDF GENERATOR =============

export const generatePDF = async (
  ideas: BusinessIdeaDisplay[],
  extractedData: FTExtractedData,
  userName?: string,
  sessionId?: string,
  tier: OrderTier = "starter"
): Promise<void> => {
  const doc = new jsPDF();
  
  // Set PDF metadata
  doc.setProperties({
    title: `FastTrack Business Ideas Report - ${userName || 'User'}`,
    author: 'FastTrack.Business',
    subject: 'Personalized Business Ideas Report',
    creator: 'FastTrack.Business AI Platform',
    keywords: 'business ideas, Canadian business, startup, entrepreneurship'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  const addNewPageIfNeeded = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin - 15) { // Extra space for footer
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Sort ideas by viability (desc), then risk (Low > Medium > High)
  const sortedIdeas = [...ideas].sort((a, b) => {
    if (b.viabilityScore !== a.viabilityScore) return b.viabilityScore - a.viabilityScore;
    return (riskOrder[a.riskLevel] || 2) - (riskOrder[b.riskLevel] || 2);
  });
  const topIdea = sortedIdeas[0];
  const topIdeaId = topIdea?.id;

  const date = new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ============= COVER PAGE =============
  
  // Gradient header effect (layered rectangles)
  doc.setFillColor(...COLORS.PRIMARY);
  doc.rect(0, 0, pageWidth, 78, "F");
  doc.setFillColor(35, 68, 108); // Slightly lighter
  doc.rect(0, 60, pageWidth, 18, "F");
  
  // Red accent line
  doc.setFillColor(...COLORS.ACCENT);
  doc.rect(0, 78, pageWidth, 3, "F");
  
  // Decorative circle
  doc.setFillColor(...COLORS.MUTED_LIGHT);
  doc.circle(pageWidth - 30, 40, 40, "F");

  // Logo/Brand
  doc.setTextColor(...COLORS.WHITE);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("FastTrack.Business", margin, 35);

  // Subtitle
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("YOUR BUSINESS BLUEPRINT", margin, 50);

  doc.setFontSize(10);
  doc.text(`Generated on ${date}`, margin, 65);

  yPosition = 95;

  // Card-based profile grid
  doc.setTextColor(...COLORS.TEXT);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Your Profile", margin, yPosition);
  yPosition += 12;

  const cityDisplay = extractedData.city || "Not specified";
  const provinceDisplay = extractedData.province || "N/A";
  const budgetDisplay = extractedData.budget_min && extractedData.budget_max
    ? `$${Number(extractedData.budget_min).toLocaleString()} - $${Number(extractedData.budget_max).toLocaleString()} CAD`
    : extractedData.budget || "N/A";
  const timeDisplay = extractedData.time_commitment_hours
    ? `${extractedData.time_commitment_hours} hours/week`
    : extractedData.time_commitment || "N/A";
  const skillsDisplay = extractedData.skills_background || 
    (Array.isArray(extractedData.skills) ? extractedData.skills.join(", ") : extractedData.skills) || 
    "N/A";
  const interestsDisplay = extractedData.interests ||
    (Array.isArray(extractedData.preferred_industries) ? extractedData.preferred_industries.join(", ") : extractedData.preferred_industries) ||
    (Array.isArray(extractedData.goals) ? extractedData.goals.join(", ") : extractedData.goals) ||
    "N/A";
  const incomeGoalDisplay = (() => {
    const val = extractedData.income_goal;
    if (!val) return "N/A";
    if (typeof val === "string" && (val.includes("$") || val.includes("/"))) return val;
    const num = Number(String(val).replace(/[^0-9.-]/g, ""));
    if (isNaN(num)) return String(val);
    return `$${num.toLocaleString()}/month`;
  })();

  // Profile cards in 2 columns
  const cardWidth = (contentWidth - 10) / 2;
  const cardHeight = 28;
  const profileData = [
    { label: "Location", value: `${cityDisplay}, ${provinceDisplay}` },
    { label: "Budget", value: budgetDisplay },
    { label: "Skills", value: skillsDisplay },
    { label: "Time Available", value: timeDisplay },
    { label: "Income Goal", value: incomeGoalDisplay },
    { label: "Interests", value: interestsDisplay },
  ];

  profileData.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + col * (cardWidth + 10);
    const y = yPosition + row * (cardHeight + 5);
    
    // Card background with accent bar
    doc.setFillColor(...COLORS.MUTED_LIGHT);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "F");
    doc.setFillColor(...COLORS.PRIMARY);
    doc.rect(x, y, 3, cardHeight, "F");
    
    // Label
    doc.setTextColor(...COLORS.MUTED);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(item.label.toUpperCase(), x + 6, y + 9);
    
    // Value
    doc.setTextColor(...COLORS.TEXT);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const val = item.value === "N/A" || !item.value ? "Not provided" : item.value;
    const valLines = doc.splitTextToSize(val, cardWidth - 12);
    doc.text(valLines[0], x + 6, y + 19);
    if (valLines.length > 1) {
      doc.setFontSize(7);
      doc.text(valLines[1].substring(0, 30) + (valLines[1].length > 30 ? "..." : ""), x + 6, y + 25);
    }
  });

  yPosition += Math.ceil(profileData.length / 2) * (cardHeight + 5) + 15;

  // Report summary box
  doc.setFillColor(...COLORS.PRIMARY_LIGHT);
  doc.roundedRect(margin, yPosition, contentWidth, 35, 3, 3, "F");
  doc.setFillColor(...COLORS.PRIMARY);
  doc.rect(margin, yPosition, 4, 35, "F");
  
  doc.setTextColor(...COLORS.PRIMARY);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${ideas.length} Business Ideas Generated`, margin + 12, yPosition + 14);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.MUTED);
  doc.text("Tailored specifically for your skills, budget, and goals", margin + 12, yPosition + 26);

  yPosition += 50;

  // Disclaimer
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.MUTED);
  const disclaimer = "FastTrack provides information and assistance, not legal or accounting advice. Always consult with qualified professionals before making business decisions.";
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth);
  doc.text(disclaimerLines, margin, yPosition);

  // ============= EXECUTIVE SUMMARY PAGE =============
  if (ideas.length > 0 && topIdea) {
    doc.addPage();
    yPosition = margin;

    // Header
    doc.setFillColor(...COLORS.PRIMARY);
    doc.rect(0, 0, pageWidth, 50, "F");
    doc.setTextColor(...COLORS.WHITE);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Executive Summary", margin, 30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Our Top Recommendation for You", margin, 42);

    yPosition = 65;

    // Top Pick hero card
    doc.setFillColor(...COLORS.SUCCESS_LIGHT);
    doc.roundedRect(margin, yPosition, contentWidth, 80, 5, 5, "F");
    
    // Gold star circle
    doc.setFillColor(...COLORS.GOLD);
    doc.circle(margin + 15, yPosition + 18, 10, "F");
    doc.setTextColor(...COLORS.TEXT);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("\u2605", margin + 11, yPosition + 22);
    
    // TOP PICK badge
    doc.setFillColor(...COLORS.SUCCESS);
    doc.roundedRect(margin + 30, yPosition + 10, 50, 14, 3, 3, "F");
    doc.setTextColor(...COLORS.WHITE);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("TOP PICK", margin + 38, yPosition + 19);
    
    // Viability score badge (top right)
    const viabilityColor = getViabilityColor(topIdea.viabilityScore);
    doc.setFillColor(...viabilityColor);
    doc.roundedRect(pageWidth - margin - 35, yPosition + 8, 30, 18, 3, 3, "F");
    doc.setTextColor(...COLORS.WHITE);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`${topIdea.viabilityScore}`, pageWidth - margin - 30, yPosition + 20);
    doc.setFontSize(8);
    doc.text("/10", pageWidth - margin - 18, yPosition + 20);
    
    // Idea name
    doc.setTextColor(...COLORS.TEXT);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    const topNameLines = doc.splitTextToSize(topIdea.name, contentWidth - 80);
    doc.text(topNameLines[0], margin + 10, yPosition + 42);
    
    // Tagline
    doc.setTextColor(...COLORS.ACCENT);
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    const topTaglineLines = doc.splitTextToSize(topIdea.tagline, contentWidth - 30);
    doc.text(topTaglineLines[0], margin + 10, yPosition + 55);

    // Risk badge
    const riskColor = getRiskColor(topIdea.riskLevel);
    doc.setFillColor(...riskColor);
    doc.roundedRect(margin + 10, yPosition + 62, 35, 10, 2, 2, "F");
    doc.setTextColor(...COLORS.WHITE);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`${topIdea.riskLevel} Risk`, margin + 13, yPosition + 69);

    yPosition += 95;

    // 4-Key Metrics Grid using stat cards
    const metricBoxWidth = (contentWidth - 15) / 4;
    const keyMetrics = [
      { label: "Startup Cost", value: topIdea.startupCost },
      { label: "Monthly Revenue", value: formatShortMoney(topIdea.monthlyRevenuePotential || "") || "TBD" },
      { label: "Break Even", value: topIdea.breakEvenTimeline || "3-6 mo" },
      { label: "Time to Launch", value: topIdea.timeToLaunch },
    ];

    keyMetrics.forEach((metric, i) => {
      drawStatCard(
        doc,
        margin + i * (metricBoxWidth + 5),
        yPosition,
        metricBoxWidth,
        32,
        metric.label,
        metric.value || "N/A",
        COLORS.PRIMARY
      );
    });

    yPosition += 45;

    // Why We Recommend This
    doc.setTextColor(...COLORS.TEXT);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Why We Recommend This", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    if (topIdea.confidenceFactors && topIdea.confidenceFactors.length > 0) {
      topIdea.confidenceFactors.slice(0, 4).forEach((factor) => {
        doc.setTextColor(...COLORS.SUCCESS);
        doc.text("\u25B8", margin + 5, yPosition);
        doc.setTextColor(...COLORS.TEXT);
        const factorLines = doc.splitTextToSize(factor, contentWidth - 20);
        doc.text(factorLines, margin + 15, yPosition);
        yPosition += factorLines.length * 5 + 4;
      });
    } else {
      const fallbackReasons = [
        `Matches your background in ${extractedData.skills_background || "your field"}`,
        `Fits within your ${budgetDisplay} budget`,
        `${topIdea.riskLevel} risk makes it a safer starting point`,
        `Strong viability score of ${topIdea.viabilityScore}/10`
      ];
      fallbackReasons.forEach((reason) => {
        doc.setTextColor(...COLORS.SUCCESS);
        doc.text("\u25B8", margin + 5, yPosition);
        doc.setTextColor(...COLORS.TEXT);
        doc.text(reason, margin + 15, yPosition);
        yPosition += 8;
      });
    }

    yPosition += 10;

    // Quick Win box
    if (topIdea.quickWin) {
      doc.setFillColor(...COLORS.WARNING_LIGHT);
      const quickWinLines = doc.splitTextToSize(topIdea.quickWin, contentWidth - 25);
      const quickWinHeight = quickWinLines.length * 5 + 18;
      doc.roundedRect(margin, yPosition, contentWidth, quickWinHeight, 3, 3, "F");
      
      doc.setTextColor(...COLORS.ACCENT);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("\u2192 Quick Win", margin + 10, yPosition + 10);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.TEXT);
      doc.setFontSize(9);
      doc.text(quickWinLines, margin + 10, yPosition + 20);
      yPosition += quickWinHeight + 10;
    }

    // Note about other ideas
    doc.setTextColor(...COLORS.MUTED);
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(`See all ${ideas.length} ideas starting on page 4`, margin, yPosition);
  }

  // ============= COMPARISON TABLE PAGE =============
  if (ideas.length >= 2) {
    doc.addPage();
    yPosition = margin;

    // Header
    doc.setFillColor(...COLORS.PRIMARY);
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setTextColor(...COLORS.WHITE);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Ideas at a Glance", margin, 28);

    yPosition = 55;

    // Table header
    const colWidths = [8, 47, 20, 25, 25, 22, 23];
    const colStarts = [margin];
    for (let i = 1; i < colWidths.length; i++) {
      colStarts.push(colStarts[i-1] + colWidths[i-1]);
    }

    doc.setFillColor(...COLORS.PRIMARY);
    doc.rect(margin, yPosition, contentWidth, 12, "F");
    doc.setTextColor(...COLORS.WHITE);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("#", colStarts[0] + 2, yPosition + 8);
    doc.text("IDEA", colStarts[1] + 2, yPosition + 8);
    doc.text("VIABILITY", colStarts[2] + 1, yPosition + 8);
    doc.text("INVESTMENT", colStarts[3] + 1, yPosition + 8);
    doc.text("RISK", colStarts[4] + 2, yPosition + 8);
    doc.text("REVENUE/MO", colStarts[5] + 1, yPosition + 8);
    yPosition += 15;

    // Table rows
    sortedIdeas.forEach((idea, i) => {
      const rowY = yPosition;
      const isTopPick = idea.id === topIdeaId;
      const isEven = i % 2 === 0;
      
      // Row background
      if (isTopPick) {
        doc.setFillColor(...COLORS.SUCCESS_LIGHT);
        // Left accent for top pick
        doc.setFillColor(...COLORS.SUCCESS);
        doc.rect(margin, rowY - 3, 3, 16, "F");
        doc.setFillColor(...COLORS.SUCCESS_LIGHT);
        doc.rect(margin + 3, rowY - 3, contentWidth - 3, 16, "F");
      } else if (isEven) {
        doc.setFillColor(252, 252, 252);
        doc.rect(margin, rowY - 3, contentWidth, 16, "F");
      }

      // Rank number with star for top pick
      doc.setTextColor(...COLORS.TEXT);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(isTopPick ? "\u2605" : String(i + 1), colStarts[0] + 2, rowY + 5);

      // Name (truncated)
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      const truncName = idea.name.length > 24 ? idea.name.substring(0, 21) + "..." : idea.name;
      doc.text(truncName, colStarts[1] + 2, rowY + 5);

      // Viability with colored dot
      const scoreColor = getViabilityColor(idea.viabilityScore);
      doc.setFillColor(...scoreColor);
      doc.circle(colStarts[2] + 4, rowY + 3, 2, "F");
      doc.setTextColor(...scoreColor);
      doc.setFont("helvetica", "bold");
      doc.text(`${idea.viabilityScore}`, colStarts[2] + 8, rowY + 5);

      // Startup cost
      doc.setTextColor(...COLORS.TEXT);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(formatShortMoney(idea.startupCost), colStarts[3] + 2, rowY + 5);

      // Risk with colored badge
      const riskColor = getRiskColor(idea.riskLevel);
      doc.setFillColor(...riskColor);
      doc.roundedRect(colStarts[4] + 1, rowY - 1, 20, 8, 2, 2, "F");
      doc.setTextColor(...COLORS.WHITE);
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      doc.text(idea.riskLevel, colStarts[4] + 4, rowY + 4);

      // Monthly Revenue
      doc.setTextColor(...COLORS.MUTED);
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      const revenue = idea.monthlyRevenuePotential || idea.potentialRevenue || "TBD";
      doc.text(formatShortMoney(revenue), colStarts[5] + 1, rowY + 5);

      yPosition += 16;
    });

    yPosition += 15;

    // Color legend
    doc.setFillColor(...COLORS.MUTED_LIGHT);
    doc.roundedRect(margin, yPosition, contentWidth, 50, 3, 3, "F");
    
    doc.setTextColor(...COLORS.TEXT);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Understanding the Scores", margin + 10, yPosition + 12);

    // Viability legend
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.MUTED);
    doc.text("Viability Score:", margin + 10, yPosition + 24);
    
    const viabilityLegend = [
      { label: "8.5+", color: COLORS.SUCCESS, text: "Excellent" },
      { label: "7-8.4", color: COLORS.BLUE, text: "Good" },
      { label: "<7", color: COLORS.WARNING, text: "Moderate" },
    ];
    
    let legendX = margin + 50;
    viabilityLegend.forEach((item) => {
      doc.setFillColor(...item.color);
      doc.roundedRect(legendX, yPosition + 20, 14, 6, 1, 1, "F");
      doc.setTextColor(...COLORS.WHITE);
      doc.setFontSize(5);
      doc.text(item.label, legendX + 2, yPosition + 24);
      doc.setTextColor(...COLORS.MUTED);
      doc.setFontSize(7);
      doc.text(item.text, legendX + 17, yPosition + 24);
      legendX += 40;
    });

    // Risk legend
    doc.setTextColor(...COLORS.MUTED);
    doc.setFontSize(7);
    doc.text("Risk Level:", margin + 10, yPosition + 38);
    
    legendX = margin + 50;
    const risks = [
      { level: "Low", color: COLORS.SUCCESS },
      { level: "Medium", color: COLORS.WARNING },
      { level: "High", color: COLORS.ACCENT }
    ];
    
    risks.forEach((risk) => {
      doc.setFillColor(...risk.color);
      doc.roundedRect(legendX, yPosition + 34, 18, 6, 1, 1, "F");
      doc.setTextColor(...COLORS.WHITE);
      doc.setFontSize(5);
      doc.text(risk.level, legendX + 2, yPosition + 38);
      legendX += 25;
    });

    yPosition += 60;

    // Pro tip
    doc.setFillColor(...COLORS.WARNING_LIGHT);
    doc.roundedRect(margin, yPosition, contentWidth, 25, 3, 3, "F");
    doc.setTextColor(...COLORS.ACCENT);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("\u2192 Pro Tip", margin + 10, yPosition + 10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.TEXT);
    doc.setFontSize(8);
    const proTip = "Don't just chase the highest score! The best business for you balances viability with your passion and lifestyle goals.";
    const proTipLines = doc.splitTextToSize(proTip, contentWidth - 20);
    doc.text(proTipLines, margin + 10, yPosition + 18);
  }

  // ============= IDEA PAGES =============
  for (const [index, idea] of sortedIdeas.entries()) {
    doc.addPage();
    yPosition = margin;

    const isTopPick = idea.id === topIdeaId;

    // Header bar
    doc.setFillColor(...COLORS.PRIMARY);
    doc.rect(0, 0, pageWidth, 15, "F");
    doc.setTextColor(...COLORS.WHITE);
    doc.setFontSize(9);
    doc.text(`FastTrack.Business | Idea ${index + 1} of ${ideas.length}`, margin, 10);

    // TOP PICK badge on header
    if (isTopPick) {
      doc.setFillColor(...COLORS.ACCENT);
      doc.roundedRect(pageWidth - margin - 48, 3, 46, 10, 3, 3, "F");
      doc.setTextColor(...COLORS.WHITE);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("\u2605 TOP PICK", pageWidth - margin - 45, 10);
    }

    yPosition = 30;

    // Idea number badge
    doc.setFillColor(...(isTopPick ? COLORS.ACCENT : COLORS.PRIMARY));
    doc.circle(margin + 8, yPosition, 8, "F");
    doc.setTextColor(...COLORS.WHITE);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(isTopPick ? "\u2605" : String(index + 1), isTopPick ? margin + 4.5 : margin + 5.5, yPosition + 4);

    // Idea title
    doc.setTextColor(...COLORS.TEXT);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    const titleLines = doc.splitTextToSize(idea.name, contentWidth - 30);
    doc.text(titleLines, margin + 22, yPosition + 5);
    yPosition += titleLines.length * 8 + 8;

    // Tagline
    if (idea.tagline) {
      doc.setTextColor(...COLORS.ACCENT);
      doc.setFontSize(11);
      doc.setFont("helvetica", "italic");
      doc.text(idea.tagline, margin, yPosition);
      yPosition += 10;
    }

    // Risk Level & Category badges + Viability progress bar
    const riskColor = getRiskColor(idea.riskLevel);
    doc.setFillColor(...riskColor);
    doc.roundedRect(margin, yPosition, 35, 8, 2, 2, "F");
    doc.setTextColor(...COLORS.WHITE);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`${idea.riskLevel} Risk`, margin + 3, yPosition + 5.5);

    doc.setFillColor(...COLORS.PRIMARY);
    doc.roundedRect(margin + 40, yPosition, 30, 8, 2, 2, "F");
    doc.text(idea.category, margin + 43, yPosition + 5.5);

    // Viability Score with progress bar
    const viabilityColor = getViabilityColor(idea.viabilityScore);
    doc.setTextColor(...viabilityColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Viability: ${idea.viabilityScore}/10`, margin + 80, yPosition + 5.5);
    
    // Progress bar
    drawGaugeBar(doc, margin + 130, yPosition + 1, 40, idea.viabilityScore * 10, viabilityColor);
    
    yPosition += 15;

    // ---- OVERVIEW SECTION ----
    yPosition = addSectionDivider(doc, yPosition, margin, contentWidth, "Overview", "chart");

    // Description
    if (idea.description) {
      doc.setTextColor(...COLORS.TEXT);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const descLines = doc.splitTextToSize(idea.description, contentWidth);
      doc.text(descLines, margin, yPosition);
      yPosition += descLines.length * 5 + 8;
    }

    // Confidence Factors (defensive check)
    if (idea.confidenceFactors && idea.confidenceFactors.length > 0) {
      doc.setTextColor(...COLORS.MUTED);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const factors = idea.confidenceFactors.slice(0, 3).map(f => f.length > 50 ? f.substring(0, 47) + "..." : f);
      doc.text("Confidence: " + factors.join(" • "), margin, yPosition);
      yPosition += 8;
    }

    // Quick Win (defensive check)
    if (idea.quickWin) {
      doc.setFillColor(...COLORS.WARNING_LIGHT);
      const quickWinLines = doc.splitTextToSize(idea.quickWin, contentWidth - 20);
      const quickWinHeight = quickWinLines.length * 5 + 14;
      doc.roundedRect(margin, yPosition, contentWidth, quickWinHeight, 3, 3, "F");
      
      doc.setTextColor(...COLORS.ACCENT);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("\u2192 Quick Win", margin + 8, yPosition + 8);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.TEXT);
      doc.text(quickWinLines, margin + 8, yPosition + 15);
      yPosition += quickWinHeight + 8;
    }

    // Why it fits box
    if (idea.whyItFits) {
      addNewPageIfNeeded(50);
      doc.setFillColor(...COLORS.SUCCESS_LIGHT);
      const whyFitsText = idea.whyItFits + (idea.targetCustomer ? `\n\nTarget Customer: ${idea.targetCustomer}` : "");
      const whyFitsLines = doc.splitTextToSize(whyFitsText, contentWidth - 16);
      const whyFitsHeight = whyFitsLines.length * 5 + 14;
      doc.roundedRect(margin, yPosition, contentWidth, whyFitsHeight, 3, 3, "F");
      
      doc.setTextColor(...COLORS.SUCCESS);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Why This Fits You", margin + 8, yPosition + 8);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.TEXT);
      doc.text(whyFitsLines, margin + 8, yPosition + 15);
      yPosition += whyFitsHeight + 8;
    }

    // ---- FINANCIAL OVERVIEW SECTION ----
    addNewPageIfNeeded(60);
    yPosition = addSectionDivider(doc, yPosition, margin, contentWidth, "Financial Overview", "money");

    // 4-stat grid
    const statBoxWidth = (contentWidth - 15) / 4;
    const stats = [
      { label: "Startup Cost", value: formatShortMoney(idea.startupCost) },
      { label: "Monthly Revenue", value: formatShortMoney(idea.monthlyRevenuePotential || idea.potentialRevenue || "TBD") },
      { label: "Break Even", value: idea.breakEvenTimeline || "3-6 months" },
      { label: "Time to Launch", value: idea.timeToLaunch },
    ];

    stats.forEach((stat, i) => {
      drawStatCard(
        doc,
        margin + i * (statBoxWidth + 5),
        yPosition,
        statBoxWidth,
        32,
        stat.label,
        stat.value || "N/A"
      );
    });

    yPosition += 40;

    // Year One Profit
    if (idea.yearOneProfit && idea.yearOneProfit !== "Depends on execution") {
      doc.setTextColor(...COLORS.SUCCESS);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`Year One Profit Potential: ${idea.yearOneProfit}`, margin, yPosition);
      yPosition += 10;
    }

    // Startup Cost Breakdown (defensive check)
    if (idea.startupCostBreakdown && Object.keys(idea.startupCostBreakdown).length > 1) {
      addNewPageIfNeeded(60);
      doc.setTextColor(...COLORS.TEXT);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Startup Cost Breakdown", margin, yPosition);
      yPosition += 8;

      const breakdown = idea.startupCostBreakdown;
      const breakdownItems = [
        { label: "Equipment", value: breakdown.equipment },
        { label: "Licensing", value: breakdown.licensing },
        { label: "Marketing", value: breakdown.marketing },
        { label: "Inventory", value: breakdown.inventory },
        { label: "Software", value: breakdown.software },
        { label: "Insurance", value: breakdown.insurance },
        { label: "Workspace", value: breakdown.workspace },
        { label: "Other", value: breakdown.other },
      ].filter(item => item.value && item.value > 0);

      breakdownItems.forEach((item) => {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLORS.MUTED);
        doc.text(item.label, margin + 5, yPosition);
        doc.setTextColor(...COLORS.TEXT);
        doc.text(`$${item.value!.toLocaleString()}`, margin + 60, yPosition);
        yPosition += 6;
      });

      // Total
      doc.setDrawColor(...COLORS.PRIMARY);
      doc.line(margin + 5, yPosition, margin + 90, yPosition);
      yPosition += 5;
      doc.setFont("helvetica", "bold");
      doc.text("Total", margin + 5, yPosition);
      doc.text(`$${breakdown.total.toLocaleString()}`, margin + 60, yPosition);
      yPosition += 12;
    }

    // ---- COMPETITION ANALYSIS SECTION (defensive check) ----
    if (idea.competitors && idea.competitors.length > 0) {
      addNewPageIfNeeded(60);
      yPosition = addSectionDivider(doc, yPosition, margin, contentWidth, "Competition Analysis", "building");

      idea.competitors.slice(0, 3).forEach((competitor: Competitor) => {
        addNewPageIfNeeded(40);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.PRIMARY);
        
        let nameText = `${competitor.name}`;
        doc.text(nameText, margin + 5, yPosition);
        
        // Verified badge
        if (competitor.is_verified) {
          const nameWidth = doc.getTextWidth(nameText);
          doc.setFillColor(...COLORS.SUCCESS);
          doc.roundedRect(margin + 8 + nameWidth, yPosition - 4, 28, 6, 1, 1, "F");
          doc.setTextColor(...COLORS.WHITE);
          doc.setFontSize(5);
          doc.text("VERIFIED", margin + 10 + nameWidth, yPosition - 0.5);
        }
        
        if (competitor.price_range) {
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...COLORS.MUTED);
          doc.setFontSize(8);
          doc.text(` (${competitor.price_range})`, margin + 5 + doc.getTextWidth(nameText) + (competitor.is_verified ? 32 : 0), yPosition);
        }
        yPosition += 6;

        // Google Rating with stars
        if (competitor.google_rating) {
          doc.setTextColor(...COLORS.GOLD);
          doc.setFontSize(8);
          const ratingNum = parseFloat(competitor.google_rating) || 0;
          const stars = "\u2605".repeat(Math.floor(ratingNum));
          doc.text(stars, margin + 10, yPosition);
          doc.setTextColor(...COLORS.MUTED);
          doc.setFontSize(7);
          doc.text(`${competitor.google_rating}`, margin + 10 + stars.length * 3.5 + 2, yPosition);
          if (competitor.review_count) {
            doc.text(`(${competitor.review_count} reviews)`, margin + 20 + stars.length * 3.5, yPosition);
          }
          yPosition += 5;
        }

        // Website link
        if (competitor.website) {
          doc.setTextColor(...COLORS.BLUE);
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          doc.textWithLink("Visit Website \u2192", margin + 10, yPosition, { url: competitor.website });
          yPosition += 5;
        }

        // Strengths
        if (competitor.strengths && competitor.strengths.length > 0) {
          doc.setTextColor(...COLORS.MUTED);
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          doc.text("Strengths: " + competitor.strengths.slice(0, 3).join(", "), margin + 10, yPosition);
          yPosition += 4;
        }

        // Weaknesses (your edge)
        const weaknesses = competitor.weaknesses || (competitor.weakness ? [competitor.weakness] : []);
        if (weaknesses.length > 0) {
          doc.setTextColor(...COLORS.SUCCESS);
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          const weaknessText = `Your edge: ${weaknesses.slice(0, 2).join(", ")}`;
          const weaknessLines = doc.splitTextToSize(weaknessText, contentWidth - 15);
          doc.text(weaknessLines, margin + 10, yPosition);
          yPosition += weaknessLines.length * 4 + 4;
        } else {
          yPosition += 4;
        }
      });

      // YOUR OPPORTUNITY box (defensive check for competitiveGap)
      if (idea.competitiveGap) {
        addNewPageIfNeeded(30);
        doc.setFillColor(...COLORS.SUCCESS_LIGHT);
        const gapLines = doc.splitTextToSize(idea.competitiveGap, contentWidth - 25);
        const gapHeight = gapLines.length * 4 + 16;
        doc.roundedRect(margin, yPosition, contentWidth, gapHeight, 3, 3, "F");
        
        doc.setTextColor(...COLORS.SUCCESS);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("\u2192 YOUR OPPORTUNITY", margin + 8, yPosition + 8);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLORS.TEXT);
        doc.setFontSize(8);
        doc.text(gapLines, margin + 8, yPosition + 16);
        yPosition += gapHeight + 5;
      }

      // Market Saturation gauge
      if (idea.marketSaturation) {
        addNewPageIfNeeded(20);
        const saturationPercent = idea.marketSaturation === "Low" ? 25 : idea.marketSaturation === "Medium" ? 50 : 75;
        const saturationColor = idea.marketSaturation === "Low" ? COLORS.SUCCESS 
          : idea.marketSaturation === "Medium" ? COLORS.WARNING : COLORS.ACCENT;
        
        doc.setTextColor(...COLORS.MUTED);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("Market Saturation:", margin + 5, yPosition);
        
        drawGaugeBar(doc, margin + 55, yPosition - 4, 50, saturationPercent, saturationColor);
        
        doc.setTextColor(...saturationColor);
        doc.setFont("helvetica", "bold");
        doc.text(idea.marketSaturation, margin + 110, yPosition);
        yPosition += 12;
      }
    }

    // ---- MARKET INTELLIGENCE SECTION (defensive check) ----
    if (idea.marketSignals?.demand_indicator) {
      addNewPageIfNeeded(80);
      yPosition = addSectionDivider(doc, yPosition, margin, contentWidth, "Market Intelligence", "chart");

      // 3-column dashboard
      doc.setFillColor(...COLORS.MUTED_LIGHT);
      doc.roundedRect(margin, yPosition, contentWidth, 45, 3, 3, "F");
      
      const colWidth = contentWidth / 3;
      
      // Column 1: Market Demand
      doc.setTextColor(...COLORS.MUTED);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("MARKET DEMAND", margin + 5, yPosition + 10);
      
      const demandPercent = idea.marketSignals.demand_indicator === "High" ? 85 : 
        idea.marketSignals.demand_indicator === "Medium" ? 55 : 25;
      const demandColor = idea.marketSignals.demand_indicator === "High" ? COLORS.SUCCESS :
        idea.marketSignals.demand_indicator === "Medium" ? COLORS.WARNING : COLORS.MUTED;
      
      drawGaugeBar(doc, margin + 5, yPosition + 15, colWidth - 20, demandPercent, demandColor);
      
      doc.setTextColor(...demandColor);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(idea.marketSignals.demand_indicator || "N/A", margin + 5, yPosition + 32);

      // Column 2: Job Postings
      doc.setTextColor(...COLORS.MUTED);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("JOB POSTINGS", margin + colWidth + 5, yPosition + 10);
      
      doc.setTextColor(...COLORS.TEXT);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(String(idea.marketSignals.job_posting_count || 0), margin + colWidth + 5, yPosition + 30);

      // Column 3: News Sentiment
      doc.setTextColor(...COLORS.MUTED);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("NEWS SENTIMENT", margin + colWidth * 2 + 5, yPosition + 10);
      
      const sentimentSymbol = idea.marketSignals.news_sentiment === "positive" ? "\u25B2" : 
        idea.marketSignals.news_sentiment === "negative" ? "\u25BC" : "\u2192";
      const sentimentColor = idea.marketSignals.news_sentiment === "positive" ? COLORS.SUCCESS :
        idea.marketSignals.news_sentiment === "negative" ? COLORS.ACCENT : COLORS.MUTED;
      const sentimentText = idea.marketSignals.news_sentiment || "neutral";
      
      doc.setTextColor(...sentimentColor);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(sentimentSymbol, margin + colWidth * 2 + 5, yPosition + 26);
      doc.setFontSize(9);
      doc.text(sentimentText.charAt(0).toUpperCase() + sentimentText.slice(1), margin + colWidth * 2 + 15, yPosition + 26);

      yPosition += 55;

      // Sample Job Postings with URLs
      if (idea.marketSignals.job_postings && idea.marketSignals.job_postings.length > 0) {
        doc.setTextColor(...COLORS.TEXT);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Sample Job Postings:", margin, yPosition);
        yPosition += 6;
        
        idea.marketSignals.job_postings.slice(0, 2).forEach((job) => {
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...COLORS.TEXT);
          const jobTitle = job.title || job;
          const jobCompany = job.company ? ` at ${job.company}` : "";
          doc.text(`\u25B8 ${jobTitle}${jobCompany}`, margin + 5, yPosition);
          
          if (job.url) {
            const titleWidth = doc.getTextWidth(`\u25B8 ${jobTitle}${jobCompany}`);
            doc.setTextColor(...COLORS.BLUE);
            doc.textWithLink(" [View]", margin + 5 + titleWidth, yPosition, { url: job.url });
          }
          yPosition += 5;
        });
        yPosition += 3;
      }

      // News highlights with citation links (defensive check)
      if (idea.marketSignals.news_highlights && idea.marketSignals.news_highlights.length > 0) {
        doc.setTextColor(...COLORS.MUTED);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        idea.marketSignals.news_highlights.slice(0, 2).forEach((highlight) => {
          // Parse citations [1], [2] etc and render as superscript links
          let cleanHighlight = highlight.replace(/\*\*/g, "").replace(/\*/g, "");
          const citations = cleanHighlight.match(/\[(\d+)\]/g) || [];
          const textWithoutCitations = cleanHighlight.replace(/\[\d+\]/g, "").trim();
          
          const highlightLines = doc.splitTextToSize(`"${textWithoutCitations}"`, contentWidth - 20);
          doc.text(highlightLines, margin, yPosition);
          
          // Add citation superscripts at end with links if citations available
          if (citations.length > 0 && idea.marketSignals?.citations) {
            const lastLineWidth = doc.getTextWidth(highlightLines[highlightLines.length - 1]);
            let citationX = margin + lastLineWidth + 2;
            const citationY = yPosition + (highlightLines.length - 1) * 4;
            
            citations.forEach((citation) => {
              const citNum = parseInt(citation.replace(/[\[\]]/g, ""));
              const sourceUrl = idea.marketSignals?.citations?.[citNum - 1];
              doc.setFontSize(6);
              doc.setTextColor(...COLORS.BLUE);
              if (sourceUrl) {
                doc.textWithLink(citation, citationX, citationY - 1, { url: sourceUrl });
              } else {
                doc.text(citation, citationX, citationY - 1);
              }
              citationX += doc.getTextWidth(citation) + 1;
            });
          }
          yPosition += highlightLines.length * 4 + 3;
        });
      }

      // Sources section
      if (idea.marketSignals.citations && idea.marketSignals.citations.length > 0) {
        addNewPageIfNeeded(20);
        doc.setTextColor(...COLORS.MUTED);
        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        doc.text("Data Sources:", margin, yPosition);
        yPosition += 4;
        
        idea.marketSignals.citations.slice(0, 4).forEach((source: string, idx: number) => {
          try {
            const domain = new URL(source).hostname.replace("www.", "");
            doc.setTextColor(...COLORS.BLUE);
            doc.textWithLink(`[${idx + 1}] ${domain}`, margin + 5, yPosition, { url: source });
          } catch {
            doc.setTextColor(...COLORS.MUTED);
            doc.text(`[${idx + 1}] ${source.substring(0, 40)}...`, margin + 5, yPosition);
          }
          yPosition += 4;
        });
        yPosition += 4;
      }

      // Regulatory notes warning box (defensive check)
      if (idea.marketSignals.regulatory_notes) {
        addNewPageIfNeeded(25);
        doc.setFillColor(...COLORS.WARNING_LIGHT);
        const regLines = doc.splitTextToSize(idea.marketSignals.regulatory_notes.replace(/\*\*/g, "").replace(/\*/g, ""), contentWidth - 25);
        const regHeight = regLines.length * 4 + 14;
        doc.roundedRect(margin, yPosition, contentWidth, regHeight, 3, 3, "F");
        doc.setFillColor(...COLORS.WARNING);
        doc.rect(margin, yPosition, 3, regHeight, "F");
        
        doc.setTextColor(...COLORS.WARNING);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Regulatory Note", margin + 8, yPosition + 8);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLORS.TEXT);
        doc.setFontSize(7);
        doc.text(regLines, margin + 8, yPosition + 16);
        yPosition += regHeight + 8;
      }

      // Data freshness
      if (idea.marketSignals.last_updated) {
        const lastUpdated = new Date(idea.marketSignals.last_updated);
        const daysSinceUpdate = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
        const freshnessLabel = daysSinceUpdate <= 7 ? "LIVE" : "STALE";
        const freshnessColor = daysSinceUpdate <= 7 ? COLORS.SUCCESS : COLORS.MUTED;
        
        doc.setFillColor(...freshnessColor);
        doc.roundedRect(margin, yPosition, 25, 6, 1, 1, "F");
        doc.setTextColor(...COLORS.WHITE);
        doc.setFontSize(5);
        doc.text(freshnessLabel, margin + 4, yPosition + 4);
        
        doc.setTextColor(...COLORS.MUTED);
        doc.setFontSize(6);
        doc.text(`Updated ${lastUpdated.toLocaleDateString()}`, margin + 28, yPosition + 4);
        yPosition += 12;
      }
    }

    // ---- 30-DAY ACTION PLAN SECTION (defensive check) ----
    if (idea.thirtyDayPlan && idea.thirtyDayPlan.length > 0) {
      addNewPageIfNeeded(70);
      yPosition = addSectionDivider(doc, yPosition, margin, contentWidth, "30-Day Action Plan", "calendar");

      // Timeline style with vertical line
      doc.setDrawColor(...COLORS.MUTED_LIGHT);
      doc.setLineWidth(2);
      doc.line(margin + 5, yPosition, margin + 5, yPosition + idea.thirtyDayPlan.slice(0, 5).length * 18);

      idea.thirtyDayPlan.slice(0, 5).forEach((action: string, i: number) => {
        addNewPageIfNeeded(20);
        
        // Timeline dot
        doc.setFillColor(...COLORS.PRIMARY);
        doc.circle(margin + 5, yPosition + 2, 4, "F");
        doc.setTextColor(...COLORS.WHITE);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text(String(i + 1), margin + 3.5, yPosition + 4);

        // Day/Week badge
        const dayBadge = i < 2 ? `Day ${(i + 1) * 3}` : `Week ${i}`;
        doc.setFillColor(...COLORS.PRIMARY_LIGHT);
        doc.roundedRect(margin + 12, yPosition - 2, 22, 8, 2, 2, "F");
        doc.setTextColor(...COLORS.PRIMARY);
        doc.setFontSize(6);
        doc.text(dayBadge, margin + 14, yPosition + 3);

        // Action text
        doc.setTextColor(...COLORS.TEXT);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const actionLines = doc.splitTextToSize(action, contentWidth - 45);
        doc.text(actionLines, margin + 38, yPosition + 4);
        yPosition += Math.max(actionLines.length * 5, 12) + 6;
      });
      yPosition += 5;
    }

    // ---- CANADIAN RESOURCES SECTION (defensive check) ----
    if (idea.canadianResources && idea.canadianResources.length > 0) {
      addNewPageIfNeeded(70);
      yPosition = addSectionDivider(doc, yPosition, margin, contentWidth, "Canadian Resources", "maple");

      const eligibleResources = idea.canadianResources.filter(r => r.is_eligible !== false);
      const ineligibleResources = idea.canadianResources.filter(r => r.is_eligible === false);

      // Eligible resources
      if (eligibleResources.length > 0) {
        doc.setTextColor(...COLORS.SUCCESS);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("You're Eligible For:", margin, yPosition);
        yPosition += 6;

        eligibleResources.slice(0, 4).forEach((resource: CanadianResource) => {
          addNewPageIfNeeded(30);
          
          // Green background card
          doc.setFillColor(...COLORS.SUCCESS_LIGHT);
          doc.roundedRect(margin, yPosition, contentWidth, 28, 3, 3, "F");
          doc.setFillColor(...COLORS.SUCCESS);
          doc.rect(margin, yPosition, 3, 28, "F");
          
          // ELIGIBLE badge
          doc.setFillColor(...COLORS.SUCCESS);
          doc.roundedRect(margin + 6, yPosition + 3, 30, 6, 1, 1, "F");
          doc.setTextColor(...COLORS.WHITE);
          doc.setFontSize(5);
          doc.text("ELIGIBLE", margin + 9, yPosition + 7);
          
          // Resource name
          doc.setTextColor(...COLORS.PRIMARY);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text(resource.name, margin + 40, yPosition + 8);

          // Type badge
          const typeColors: Record<string, [number, number, number]> = {
            grant: COLORS.SUCCESS,
            loan: COLORS.BLUE,
            program: COLORS.PRIMARY,
            guide: COLORS.MUTED,
          };
          const typeColor = typeColors[resource.type] || COLORS.MUTED;
          const nameWidth = doc.getTextWidth(resource.name);
          doc.setFillColor(...typeColor);
          doc.roundedRect(margin + 44 + nameWidth, yPosition + 3, 18, 6, 1, 1, "F");
          doc.setTextColor(...COLORS.WHITE);
          doc.setFontSize(5);
          doc.text(resource.type.toUpperCase(), margin + 46 + nameWidth, yPosition + 7);

          // Funding amount
          if (resource.funding_amount) {
            doc.setTextColor(...COLORS.SUCCESS);
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text(`Funding: ${resource.funding_amount}`, margin + 6, yPosition + 17);
          }

          // Deadline if available
          if (resource.deadline) {
            doc.setTextColor(...COLORS.ACCENT);
            doc.setFontSize(6);
            doc.setFont("helvetica", "normal");
            doc.text(`Deadline: ${resource.deadline}`, margin + 6, yPosition + 23);
          }

          // Last verified date
          if (resource.lastVerified) {
            const verifiedDate = new Date(resource.lastVerified).toLocaleDateString("en-CA", { month: "short", year: "numeric" });
            doc.setTextColor(...COLORS.MUTED);
            doc.setFontSize(5);
            doc.text(`Verified: ${verifiedDate}`, margin + 6, resource.deadline ? yPosition + 27 : yPosition + 23);
          }

          // Apply Now link
          if (resource.url) {
            doc.setTextColor(...COLORS.BLUE);
            doc.setFontSize(7);
            doc.setFont("helvetica", "bold");
            doc.textWithLink("Apply Now \u2192", pageWidth - margin - 30, yPosition + 17, { url: resource.url });
          }

          yPosition += 34;
        });
      }

      // Ineligible resources (collapsed style)
      if (ineligibleResources.length > 0) {
        addNewPageIfNeeded(30);
        yPosition += 5;
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.MUTED);
        doc.text("Other programs (not eligible based on profile):", margin, yPosition);
        yPosition += 6;

        ineligibleResources.slice(0, 3).forEach((resource: CanadianResource) => {
          addNewPageIfNeeded(15);
          
          // Muted background
          doc.setFillColor(...COLORS.MUTED_LIGHT);
          doc.roundedRect(margin, yPosition, contentWidth, 14, 2, 2, "F");
          
          // NOT ELIGIBLE badge
          doc.setFillColor(...COLORS.MUTED);
          doc.roundedRect(margin + 3, yPosition + 3, 40, 6, 1, 1, "F");
          doc.setTextColor(...COLORS.WHITE);
          doc.setFontSize(5);
          doc.text("NOT ELIGIBLE", margin + 6, yPosition + 7);
          
          doc.setTextColor(...COLORS.MUTED);
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          doc.text(resource.name, margin + 46, yPosition + 8);
          
          if (resource.eligibility_reason) {
            doc.setFontSize(6);
            doc.setFont("helvetica", "italic");
            doc.text(`(${resource.eligibility_reason})`, margin + 46 + doc.getTextWidth(resource.name) + 3, yPosition + 8);
          }
          
          yPosition += 17;
        });
      }
      yPosition += 5;
    }

    // ---- FIRST STEPS SECTION ----
    addNewPageIfNeeded(60);
    doc.setTextColor(...COLORS.TEXT);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Your First Steps", margin, yPosition);
    yPosition += 8;

    idea.firstSteps.slice(0, 5).forEach((step, stepIndex) => {
      addNewPageIfNeeded(15);
      
      doc.setFillColor(...COLORS.SUCCESS);
      doc.circle(margin + 5, yPosition + 2, 4, "F");
      doc.setTextColor(...COLORS.WHITE);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(String(stepIndex + 1), margin + 3.5, yPosition + 4);

      doc.setTextColor(...COLORS.TEXT);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const stepLines = doc.splitTextToSize(step, contentWidth - 18);
      doc.text(stepLines, margin + 14, yPosition + 4);
      yPosition += stepLines.length * 4 + 6;
    });

    // Challenges (defensive check)
    if (idea.challenges && idea.challenges.length > 0) {
      addNewPageIfNeeded(40);
      yPosition += 5;
      doc.setTextColor(...COLORS.TEXT);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Potential Challenges", margin, yPosition);
      yPosition += 7;

      idea.challenges.slice(0, 3).forEach((challenge: string) => {
        addNewPageIfNeeded(12);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLORS.MUTED);
        const challengeLines = doc.splitTextToSize(`- ${challenge}`, contentWidth - 10);
        doc.text(challengeLines, margin + 5, yPosition);
        yPosition += challengeLines.length * 4 + 3;
      });
    }

    // ============= TIER 2+ SECTIONS =============
    const isCompleteTier = tier === "complete" || tier === "vip";
    
    // SWOT Analysis (Tier 2+ only)
    if (isCompleteTier && idea.swotAnalysis) {
      addNewPageIfNeeded(100);
      doc.addPage();
      yPosition = margin;
      
      // Header
      doc.setFillColor(...COLORS.PRIMARY);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setTextColor(...COLORS.WHITE);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("SWOT Analysis", margin, 25);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(idea.name, margin, 35);
      
      yPosition = 55;
      
      // 2x2 Grid
      const quadrantWidth = (contentWidth - 10) / 2;
      const quadrantHeight = 55;
      
      // Strengths (top-left)
      doc.setFillColor(...COLORS.SUCCESS_LIGHT);
      doc.roundedRect(margin, yPosition, quadrantWidth, quadrantHeight, 3, 3, "F");
      doc.setFillColor(...COLORS.SUCCESS);
      doc.rect(margin, yPosition, 4, quadrantHeight, "F");
      doc.setTextColor(...COLORS.SUCCESS);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("STRENGTHS", margin + 8, yPosition + 12);
      doc.setTextColor(...COLORS.TEXT);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      idea.swotAnalysis.strengths.slice(0, 4).forEach((item, i) => {
        const itemLines = doc.splitTextToSize(`+ ${item}`, quadrantWidth - 15);
        doc.text(itemLines[0], margin + 8, yPosition + 22 + i * 8);
      });
      
      // Weaknesses (top-right)
      doc.setFillColor(...COLORS.ACCENT_LIGHT);
      doc.roundedRect(margin + quadrantWidth + 10, yPosition, quadrantWidth, quadrantHeight, 3, 3, "F");
      doc.setFillColor(...COLORS.ACCENT);
      doc.rect(margin + quadrantWidth + 10, yPosition, 4, quadrantHeight, "F");
      doc.setTextColor(...COLORS.ACCENT);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("WEAKNESSES", margin + quadrantWidth + 18, yPosition + 12);
      doc.setTextColor(...COLORS.TEXT);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      idea.swotAnalysis.weaknesses.slice(0, 4).forEach((item, i) => {
        const itemLines = doc.splitTextToSize(`- ${item}`, quadrantWidth - 15);
        doc.text(itemLines[0], margin + quadrantWidth + 18, yPosition + 22 + i * 8);
      });
      
      yPosition += quadrantHeight + 10;
      
      // Opportunities (bottom-left)
      doc.setFillColor(...COLORS.PRIMARY_LIGHT);
      doc.roundedRect(margin, yPosition, quadrantWidth, quadrantHeight, 3, 3, "F");
      doc.setFillColor(...COLORS.PRIMARY);
      doc.rect(margin, yPosition, 4, quadrantHeight, "F");
      doc.setTextColor(...COLORS.PRIMARY);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("OPPORTUNITIES", margin + 8, yPosition + 12);
      doc.setTextColor(...COLORS.TEXT);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      idea.swotAnalysis.opportunities.slice(0, 4).forEach((item, i) => {
        const itemLines = doc.splitTextToSize(`\u2192 ${item}`, quadrantWidth - 15);
        doc.text(itemLines[0], margin + 8, yPosition + 22 + i * 8);
      });
      
      // Threats (bottom-right)
      doc.setFillColor(...COLORS.WARNING_LIGHT);
      doc.roundedRect(margin + quadrantWidth + 10, yPosition, quadrantWidth, quadrantHeight, 3, 3, "F");
      doc.setFillColor(...COLORS.WARNING);
      doc.rect(margin + quadrantWidth + 10, yPosition, 4, quadrantHeight, "F");
      doc.setTextColor(...COLORS.WARNING);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("THREATS", margin + quadrantWidth + 18, yPosition + 12);
      doc.setTextColor(...COLORS.TEXT);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      idea.swotAnalysis.threats.slice(0, 4).forEach((item, i) => {
        const itemLines = doc.splitTextToSize(`! ${item}`, quadrantWidth - 15);
        doc.text(itemLines[0], margin + quadrantWidth + 18, yPosition + 22 + i * 8);
      });
      
      yPosition += quadrantHeight + 15;
    }
    
    // Pricing Strategy (Tier 2+ only)
    if (isCompleteTier && idea.pricingStrategy) {
      addNewPageIfNeeded(80);
      yPosition = addSectionDivider(doc, yPosition, margin, contentWidth, "Pricing Strategy", "money");
      
      // Recommended Model Badge
      doc.setFillColor(...COLORS.PRIMARY);
      doc.roundedRect(margin, yPosition, 50, 12, 2, 2, "F");
      doc.setTextColor(...COLORS.WHITE);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      const modelText = idea.pricingStrategy.recommended_model.toUpperCase();
      doc.text(modelText, margin + 5, yPosition + 8);
      
      // Rationale
      doc.setTextColor(...COLORS.TEXT);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const rationaleLines = doc.splitTextToSize(idea.pricingStrategy.rationale, contentWidth - 60);
      doc.text(rationaleLines, margin + 55, yPosition + 8);
      yPosition += Math.max(rationaleLines.length * 4 + 8, 18);
      
      // Price Tiers Table
      const tierWidth = (contentWidth - 20) / 3;
      const tierHeight = 25;
      
      // Entry tier
      doc.setFillColor(...COLORS.MUTED_LIGHT);
      doc.roundedRect(margin, yPosition, tierWidth, tierHeight, 2, 2, "F");
      doc.setTextColor(...COLORS.MUTED);
      doc.setFontSize(7);
      doc.text("ENTRY", margin + 5, yPosition + 8);
      doc.setTextColor(...COLORS.TEXT);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(idea.pricingStrategy.price_range.low, margin + 5, yPosition + 18);
      
      // Standard tier (highlighted)
      doc.setFillColor(...COLORS.PRIMARY_LIGHT);
      doc.roundedRect(margin + tierWidth + 10, yPosition, tierWidth, tierHeight, 2, 2, "F");
      doc.setFillColor(...COLORS.PRIMARY);
      doc.rect(margin + tierWidth + 10, yPosition, tierWidth, 3, "F");
      doc.setTextColor(...COLORS.PRIMARY);
      doc.setFontSize(7);
      doc.text("STANDARD", margin + tierWidth + 15, yPosition + 11);
      doc.setTextColor(...COLORS.TEXT);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(idea.pricingStrategy.price_range.mid, margin + tierWidth + 15, yPosition + 20);
      
      // Premium tier
      doc.setFillColor(...COLORS.ACCENT_LIGHT);
      doc.roundedRect(margin + (tierWidth + 10) * 2, yPosition, tierWidth, tierHeight, 2, 2, "F");
      doc.setTextColor(...COLORS.ACCENT);
      doc.setFontSize(7);
      doc.text("PREMIUM", margin + (tierWidth + 10) * 2 + 5, yPosition + 8);
      doc.setTextColor(...COLORS.TEXT);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(idea.pricingStrategy.price_range.premium, margin + (tierWidth + 10) * 2 + 5, yPosition + 18);
      
      yPosition += tierHeight + 10;
      
      // Competitor Comparison
      if (idea.pricingStrategy.competitor_comparison) {
        doc.setFillColor(...COLORS.MUTED_LIGHT);
        const compLines = doc.splitTextToSize(idea.pricingStrategy.competitor_comparison, contentWidth - 20);
        doc.roundedRect(margin, yPosition, contentWidth, compLines.length * 4 + 12, 2, 2, "F");
        doc.setTextColor(...COLORS.MUTED);
        doc.setFontSize(7);
        doc.text("VS. COMPETITORS", margin + 5, yPosition + 8);
        doc.setTextColor(...COLORS.TEXT);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(compLines, margin + 5, yPosition + 16);
        yPosition += compLines.length * 4 + 18;
      }
      
      // Discounting Strategy
      if (idea.pricingStrategy.discounting_strategy) {
        doc.setFillColor(...COLORS.WARNING_LIGHT);
        const discLines = doc.splitTextToSize(idea.pricingStrategy.discounting_strategy, contentWidth - 20);
        doc.roundedRect(margin, yPosition, contentWidth, discLines.length * 4 + 12, 2, 2, "F");
        doc.setTextColor(...COLORS.WARNING);
        doc.setFontSize(7);
        doc.text("DISCOUNTING STRATEGY", margin + 5, yPosition + 8);
        doc.setTextColor(...COLORS.TEXT);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(discLines, margin + 5, yPosition + 16);
        yPosition += discLines.length * 4 + 18;
      }
    }
    
    // Risk Mitigation (Tier 2+ only)
    if (isCompleteTier && idea.riskMitigation && idea.riskMitigation.length > 0) {
      addNewPageIfNeeded(100);
      yPosition = addSectionDivider(doc, yPosition, margin, contentWidth, "Risk Mitigation Plan", "chart");
      
      idea.riskMitigation.slice(0, 3).forEach((risk: RiskMitigationItem, riskIndex: number) => {
        addNewPageIfNeeded(60);
        
        // Risk card
        doc.setFillColor(...COLORS.MUTED_LIGHT);
        doc.roundedRect(margin, yPosition, contentWidth, 50, 3, 3, "F");
        
        // Severity badge
        const severityColor = risk.severity === 'high' ? COLORS.ACCENT : 
          risk.severity === 'medium' ? COLORS.WARNING : COLORS.SUCCESS;
        doc.setFillColor(...severityColor);
        doc.roundedRect(pageWidth - margin - 35, yPosition + 5, 30, 10, 2, 2, "F");
        doc.setTextColor(...COLORS.WHITE);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text(risk.severity.toUpperCase(), pageWidth - margin - 32, yPosition + 12);
        
        // Challenge title
        doc.setTextColor(...COLORS.TEXT);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        const challengeLines = doc.splitTextToSize(risk.challenge, contentWidth - 50);
        doc.text(challengeLines[0], margin + 8, yPosition + 12);
        
        // Mitigations
        doc.setTextColor(...COLORS.MUTED);
        doc.setFontSize(7);
        doc.text("HOW TO MITIGATE:", margin + 8, yPosition + 22);
        doc.setTextColor(...COLORS.TEXT);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        risk.mitigations.slice(0, 2).forEach((m, i) => {
          const mLines = doc.splitTextToSize(`\u2713 ${m}`, contentWidth - 20);
          doc.text(mLines[0], margin + 8, yPosition + 30 + i * 8);
        });
        
        // Early warning signs
        if (risk.early_warning_signs) {
          doc.setTextColor(...COLORS.ACCENT);
          doc.setFontSize(7);
          const warnLines = doc.splitTextToSize(`\u26A0 ${risk.early_warning_signs}`, contentWidth - 20);
          doc.text(warnLines[0], margin + 8, yPosition + 46);
        }
        
        yPosition += 58;
      });
    }
    
    // Customer Acquisition (Tier 2+ only)
    if (isCompleteTier && idea.customerAcquisition) {
      doc.addPage();
      yPosition = margin;
      
      // Header
      doc.setFillColor(...COLORS.PRIMARY);
      doc.rect(0, 0, pageWidth, 50, "F");
      doc.setTextColor(...COLORS.WHITE);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Your First 10 Customers", margin, 32);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Week-by-Week Customer Acquisition Plan", margin, 42);
      
      yPosition = 65;
      
      const acq = idea.customerAcquisition;
      const first10 = acq.first_10_strategy;
      
      // Week-by-Week Timeline
      const weeks = [
        { label: "Week 1", content: first10?.week_1?.join(", ") },
        { label: "Week 2", content: first10?.week_2?.join(", ") },
        { label: "Week 3", content: first10?.week_3?.join(", ") },
        { label: "Week 4", content: first10?.week_4?.join(", ") },
      ];
      
      weeks.forEach((week, i) => {
        if (!week.content) return;
        addNewPageIfNeeded(45);
        
        // Week card
        doc.setFillColor(...(i % 2 === 0 ? COLORS.PRIMARY_LIGHT : COLORS.MUTED_LIGHT));
        doc.roundedRect(margin, yPosition, contentWidth, 35, 3, 3, "F");
        
        // Week badge
        doc.setFillColor(...COLORS.PRIMARY);
        doc.roundedRect(margin + 5, yPosition + 5, 50, 12, 2, 2, "F");
        doc.setTextColor(...COLORS.WHITE);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(week.label.toUpperCase(), margin + 10, yPosition + 13);
        
        // Content
        doc.setTextColor(...COLORS.TEXT);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const weekLines = doc.splitTextToSize(week.content, contentWidth - 20);
        doc.text(weekLines.slice(0, 2), margin + 5, yPosition + 25);
        
        yPosition += 42;
      });
      
      // Marketing Channels
      if (acq.marketing_channels && acq.marketing_channels.length > 0) {
        addNewPageIfNeeded(80);
        yPosition = addSectionDivider(doc, yPosition, margin, contentWidth, "Marketing Channels", "chart");
        
        // Table header
        doc.setFillColor(...COLORS.PRIMARY);
        doc.rect(margin, yPosition, contentWidth, 15, "F");
        doc.setTextColor(...COLORS.WHITE);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("CHANNEL", margin + 5, yPosition + 10);
        doc.text("ROI", margin + 90, yPosition + 10);
        doc.text("COST", margin + 120, yPosition + 10);
        doc.text("TIME", margin + 150, yPosition + 10);
        yPosition += 15;
        
        acq.marketing_channels.slice(0, 5).forEach((channel: any, i: number) => {
          doc.setFillColor(...(i % 2 === 0 ? COLORS.WHITE : COLORS.MUTED_LIGHT));
          doc.rect(margin, yPosition, contentWidth, 12, "F");
          
          doc.setTextColor(...COLORS.TEXT);
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.text(channel.channel?.slice(0, 25) || "N/A", margin + 5, yPosition + 8);
          
          // ROI badge
          const roiColor = channel.roi === "High" ? COLORS.SUCCESS : 
            channel.roi === "Medium" ? COLORS.WARNING : COLORS.MUTED;
          doc.setTextColor(...roiColor);
          doc.text(channel.roi || "N/A", margin + 90, yPosition + 8);
          
          doc.setTextColor(...COLORS.TEXT);
          doc.text(channel.cost || "N/A", margin + 120, yPosition + 8);
          doc.text(channel.time_investment || "N/A", margin + 150, yPosition + 8);
          
          yPosition += 12;
        });
      }
      
      // Referral Strategy
      if (acq.referral_strategy) {
        addNewPageIfNeeded(40);
        yPosition += 10;
        doc.setFillColor(...COLORS.SUCCESS_LIGHT);
        const refLines = doc.splitTextToSize(acq.referral_strategy, contentWidth - 20);
        doc.roundedRect(margin, yPosition, contentWidth, refLines.length * 5 + 18, 3, 3, "F");
        doc.setFillColor(...COLORS.SUCCESS);
        doc.rect(margin, yPosition, 4, refLines.length * 5 + 18, "F");
        doc.setTextColor(...COLORS.SUCCESS);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("REFERRAL STRATEGY", margin + 10, yPosition + 12);
        doc.setTextColor(...COLORS.TEXT);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(refLines, margin + 10, yPosition + 22);
        yPosition += refLines.length * 5 + 25;
      }
    }
    
    // 90-Day Roadmap (Tier 2+ only)
    if (isCompleteTier && idea.ninetyDayRoadmap && idea.ninetyDayRoadmap.weeks && idea.ninetyDayRoadmap.weeks.length > 0) {
      doc.addPage();
      yPosition = margin;
      
      // Header
      doc.setFillColor(...COLORS.PRIMARY);
      doc.rect(0, 0, pageWidth, 50, "F");
      doc.setTextColor(...COLORS.WHITE);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("90-Day Launch Roadmap", margin, 32);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Your 12-Week Action Plan", margin, 42);
      
      yPosition = 65;
      
      // Monthly overview boxes
      const roadmapWeeks = idea.ninetyDayRoadmap.weeks;
      const months = [
        { label: "Month 1", weeks: roadmapWeeks.slice(0, 4), color: COLORS.PRIMARY },
        { label: "Month 2", weeks: roadmapWeeks.slice(4, 8), color: COLORS.SUCCESS },
        { label: "Month 3", weeks: roadmapWeeks.slice(8, 12), color: COLORS.WARNING },
      ];
      
      months.forEach((month, mi) => {
        addNewPageIfNeeded(90);
        
        // Month header
        doc.setFillColor(...month.color);
        doc.roundedRect(margin, yPosition, contentWidth, 18, 3, 3, "F");
        doc.setTextColor(...COLORS.WHITE);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(month.label.toUpperCase(), margin + 8, yPosition + 12);
        yPosition += 22;
        
        // Week cards (2x2 grid)
        month.weeks.forEach((week: any, wi: number) => {
          if (!week) return;
          
          const colWidth = (contentWidth - 10) / 2;
          const isLeft = wi % 2 === 0;
          const xPos = isLeft ? margin : margin + colWidth + 10;
          
          if (isLeft && wi > 0) yPosition += 2;
          
          doc.setFillColor(...COLORS.MUTED_LIGHT);
          doc.roundedRect(xPos, yPosition, colWidth, 32, 2, 2, "F");
          
          // Week badge
          doc.setFillColor(...month.color);
          doc.roundedRect(xPos + 3, yPosition + 3, 40, 8, 2, 2, "F");
          doc.setTextColor(...COLORS.WHITE);
          doc.setFontSize(6);
          doc.setFont("helvetica", "bold");
          doc.text(`WEEK ${week.week || mi * 4 + wi + 1}`, xPos + 6, yPosition + 8);
          
          // Theme
          doc.setTextColor(...COLORS.TEXT);
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          const themeText = week.theme?.slice(0, 30) || "Focus";
          doc.text(themeText, xPos + 3, yPosition + 18);
          
          // Milestone
          doc.setTextColor(...COLORS.MUTED);
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          const milestoneText = week.milestone?.slice(0, 35) || "";
          doc.text(milestoneText, xPos + 3, yPosition + 26);
          
          if (!isLeft || wi === month.weeks.length - 1) {
            yPosition += 36;
          }
        });
        
        yPosition += 8;
      });
      
      // Go/No-Go Checkpoints
      addNewPageIfNeeded(60);
      yPosition = addSectionDivider(doc, yPosition, margin, contentWidth, "Decision Checkpoints", "chart");
      
      const checkpoints = [
        { week: 4, label: "Month 1 Review" },
        { week: 8, label: "Month 2 Review" },
        { week: 12, label: "Final Assessment" },
      ];
      
      checkpoints.forEach((cp, i) => {
        const weekData = roadmapWeeks[cp.week - 1];
        if (!weekData) return;
        
        doc.setFillColor(...(i === 2 ? COLORS.SUCCESS_LIGHT : COLORS.WARNING_LIGHT));
        doc.roundedRect(margin + i * 60, yPosition, 55, 30, 2, 2, "F");
        
        doc.setTextColor(...(i === 2 ? COLORS.SUCCESS : COLORS.WARNING));
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text(`WEEK ${cp.week}`, margin + i * 60 + 5, yPosition + 10);
        
        doc.setTextColor(...COLORS.TEXT);
        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        const kpiText = weekData.kpi?.slice(0, 25) || "Review progress";
        doc.text(kpiText, margin + i * 60 + 5, yPosition + 20);
      });
    }
  }

  // ============= FINAL PAGE =============
  doc.addPage();
  yPosition = margin;

  // Header
  doc.setFillColor(...COLORS.PRIMARY);
  doc.rect(0, 0, pageWidth, 50, "F");
  doc.setTextColor(...COLORS.WHITE);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Ready to Launch?", margin, 30);

  yPosition = 70;

  doc.setTextColor(...COLORS.TEXT);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  const nextStepsIntro = "You now have personalized business ideas tailored to your unique profile. Here are your recommended next steps:";
  const introLines = doc.splitTextToSize(nextStepsIntro, contentWidth);
  doc.text(introLines, margin, yPosition);
  yPosition += 25;

  const generalSteps = [
    "Review each idea carefully and pick the one that excites you most",
    "Research your local market and competitors",
    "Create a simple business plan outlining your first 90 days",
    "Register your business name with your provincial registry",
    "Set up a business bank account",
    "Connect with local small business resources and mentors",
  ];

  generalSteps.forEach((step, i) => {
    doc.setFillColor(...COLORS.PRIMARY);
    doc.circle(margin + 5, yPosition + 3, 5, "F");
    doc.setTextColor(...COLORS.WHITE);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(String(i + 1), margin + 3, yPosition + 5.5);

    doc.setTextColor(...COLORS.TEXT);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(step, margin + 15, yPosition + 5);
    yPosition += 12;
  });

  yPosition += 15;

  // QR Code with fallback
  const qrUrl = sessionId 
    ? `https://fastrack.business/results?session_id=${sessionId}`
    : "https://fastrack.business";

  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 80, margin: 1 });
  } catch (e) {
    console.error("QR generation failed:", e);
  }

  // Center QR code
  const qrSize = 40;
  const qrX = (pageWidth - qrSize) / 2;

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", qrX, yPosition, qrSize, qrSize);
    doc.setTextColor(...COLORS.MUTED);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const qrCaption = "Scan to access your online dashboard";
    doc.text(qrCaption, (pageWidth - doc.getTextWidth(qrCaption)) / 2, yPosition + qrSize + 8);
    yPosition += qrSize + 20;
  } else {
    // Fallback: just show URL text
    doc.setTextColor(...COLORS.BLUE);
    doc.setFontSize(10);
    doc.textWithLink("Visit: fastrack.business", (pageWidth - doc.getTextWidth("Visit: fastrack.business")) / 2, yPosition, { url: "https://fastrack.business" });
    yPosition += 15;
  }

  yPosition += 10;

  // Upgrade teaser box
  doc.setFillColor(...COLORS.PRIMARY_LIGHT);
  doc.roundedRect(margin, yPosition, contentWidth, 45, 3, 3, "F");
  doc.setFillColor(...COLORS.PRIMARY);
  doc.rect(margin, yPosition, 4, 45, "F");
  
  doc.setTextColor(...COLORS.PRIMARY);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Upgrade for More", margin + 12, yPosition + 15);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.TEXT);
  const upgradeFeatures = "Complete tier includes: Step-by-step registration guide, Province-specific requirements, Document templates, 1-on-1 support call";
  const upgradeLines = doc.splitTextToSize(upgradeFeatures, contentWidth - 20);
  doc.text(upgradeLines, margin + 12, yPosition + 28);

  yPosition += 55;

  // Data sources
  doc.setTextColor(...COLORS.MUTED);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Data Sources:", margin, yPosition);
  doc.text("Business analysis: Gemini AI | Market signals: Perplexity AI | Grant data: Verified government sources", margin, yPosition + 8);

  // Add professional footer to all pages
  addProfessionalFooter(doc, margin);

  // Save with compression
  const fileName = `FastTrack-Business-Ideas-${date.replace(/\s/g, "-")}.pdf`;
  doc.save(fileName);
};

// Backwards compatible sync wrapper
export const generatePDFSync = (
  ideas: BusinessIdeaDisplay[],
  extractedData: FTExtractedData,
  userName?: string,
  sessionId?: string,
  tier: OrderTier = "starter"
): void => {
  generatePDF(ideas, extractedData, userName, sessionId, tier).catch(console.error);
};

// ============= INVESTOR ONE-PAGER =============
export const generateInvestorOnePager = async (idea: BusinessIdeaDisplay): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // Header gradient effect
  doc.setFillColor(...COLORS.PRIMARY);
  doc.rect(0, 0, pageWidth, 45, "F");
  doc.setFillColor(...COLORS.ACCENT);
  doc.rect(0, 45, pageWidth, 2, "F");

  // Company/Business Name
  doc.setTextColor(...COLORS.WHITE);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  const nameLines = doc.splitTextToSize(idea.name, contentWidth - 60);
  doc.text(nameLines[0], margin, 22);

  // Tagline
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  const taglineLines = doc.splitTextToSize(idea.tagline, contentWidth - 60);
  doc.text(taglineLines[0], margin, 35);

  // Viability badge (top right)
  const viabilityColor = getViabilityColor(idea.viabilityScore);
  doc.setFillColor(...viabilityColor);
  doc.roundedRect(pageWidth - margin - 25, 12, 22, 20, 3, 3, "F");
  doc.setTextColor(...COLORS.WHITE);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${idea.viabilityScore}`, pageWidth - margin - 20, 24);
  doc.setFontSize(8);
  doc.text("/10", pageWidth - margin - 12, 24);

  yPosition = 58;

  // Two-column layout
  const colWidth = (contentWidth - 10) / 2;
  const leftCol = margin;
  const rightCol = margin + colWidth + 10;

  // === LEFT COLUMN ===

  // The Opportunity
  doc.setTextColor(...COLORS.PRIMARY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("THE OPPORTUNITY", leftCol, yPosition);
  yPosition += 6;
  
  doc.setTextColor(...COLORS.TEXT);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const descLines = doc.splitTextToSize(idea.description, colWidth);
  doc.text(descLines.slice(0, 6), leftCol, yPosition);
  yPosition += Math.min(descLines.length, 6) * 4 + 8;

  // Why This Works
  doc.setTextColor(...COLORS.SUCCESS);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("WHY THIS WORKS", leftCol, yPosition);
  yPosition += 6;
  
  doc.setTextColor(...COLORS.TEXT);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const whyLines = doc.splitTextToSize(idea.whyItFits, colWidth);
  doc.text(whyLines.slice(0, 4), leftCol, yPosition);
  yPosition += Math.min(whyLines.length, 4) * 4 + 8;

  // Competitive Edge
  if (idea.competitiveGap) {
    doc.setTextColor(...COLORS.ACCENT);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("COMPETITIVE EDGE", leftCol, yPosition);
    yPosition += 6;
    
    doc.setTextColor(...COLORS.TEXT);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const gapLines = doc.splitTextToSize(idea.competitiveGap, colWidth);
    doc.text(gapLines.slice(0, 3), leftCol, yPosition);
    yPosition += Math.min(gapLines.length, 3) * 4 + 8;
  }

  // === RIGHT COLUMN ===
  let rightY = 58;

  // Financial Snapshot box
  doc.setFillColor(...COLORS.MUTED_LIGHT);
  doc.roundedRect(rightCol, rightY, colWidth, 55, 3, 3, "F");
  doc.setFillColor(...COLORS.PRIMARY);
  doc.rect(rightCol, rightY, 3, 55, "F");
  
  rightY += 8;
  doc.setTextColor(...COLORS.PRIMARY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("FINANCIAL SNAPSHOT", rightCol + 8, rightY);
  rightY += 8;

  const financials = [
    { label: "Startup Cost", value: idea.startupCost },
    { label: "Monthly Revenue", value: idea.monthlyRevenuePotential },
    { label: "Break Even", value: idea.breakEvenTimeline },
    { label: "Year 1 Profit", value: idea.yearOneProfit || "TBD" },
  ];

  financials.forEach(({ label, value }) => {
    doc.setTextColor(...COLORS.MUTED);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(label, rightCol + 8, rightY);
    doc.setTextColor(...COLORS.TEXT);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(value || "TBD", rightCol + 8, rightY + 5);
    rightY += 12;
  });

  rightY += 8;

  // Risk & Timeline
  doc.setFillColor(...COLORS.PRIMARY_LIGHT);
  doc.roundedRect(rightCol, rightY, colWidth, 35, 3, 3, "F");
  
  rightY += 8;
  doc.setTextColor(...COLORS.PRIMARY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("LAUNCH TIMELINE", rightCol + 5, rightY);
  rightY += 8;
  
  doc.setTextColor(...COLORS.TEXT);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Time to Launch: ${idea.timeToLaunch}`, rightCol + 5, rightY);
  rightY += 6;
  
  const riskColor = getRiskColor(idea.riskLevel);
  doc.setFillColor(...riskColor);
  doc.roundedRect(rightCol + 5, rightY, 40, 10, 2, 2, "F");
  doc.setTextColor(...COLORS.WHITE);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`${idea.riskLevel} Risk`, rightCol + 10, rightY + 7);

  rightY += 20;

  // The Ask
  doc.setFillColor(...COLORS.SUCCESS_LIGHT);
  doc.roundedRect(rightCol, rightY, colWidth, 40, 3, 3, "F");
  doc.setFillColor(...COLORS.SUCCESS);
  doc.rect(rightCol, rightY, 3, 40, "F");
  
  rightY += 8;
  doc.setTextColor(...COLORS.SUCCESS);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("THE ASK", rightCol + 8, rightY);
  rightY += 8;
  
  doc.setTextColor(...COLORS.TEXT);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Investment Needed: ${idea.startupCost}`, rightCol + 8, rightY);
  rightY += 6;
  doc.text("Use of Funds:", rightCol + 8, rightY);
  rightY += 5;
  
  const uses = ["Equipment & Setup", "Marketing Launch", "Initial Inventory", "Working Capital"];
  uses.slice(0, 3).forEach((use, i) => {
    doc.text(`• ${use}`, rightCol + 10, rightY + (i * 4));
  });

  // Footer
  const footerY = pageHeight - 20;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  doc.setTextColor(...COLORS.MUTED);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Generated by FastTrack.Business", margin, footerY);
  
  const date = new Date().toLocaleDateString("en-CA");
  const dateWidth = doc.getTextWidth(date);
  doc.text(date, pageWidth - margin - dateWidth, footerY);

  // Confidential notice
  doc.setFontSize(7);
  doc.text("CONFIDENTIAL - For Investor Review Only", (pageWidth - doc.getTextWidth("CONFIDENTIAL - For Investor Review Only")) / 2, footerY + 8);

  // Save
  const fileName = `FastTrack-Investor-OnePager-${idea.name.replace(/\s+/g, '-')}.pdf`;
  doc.save(fileName);
};
