import jsPDF from "jspdf";

interface PitchContent {
  business_name: string;
  elevator_pitch: string;
  problem: string;
  solution: string;
  target_customer: string;
  market_opportunity: string;
  revenue_model: string;
  why_now: string;
  action_plan: string[];
  prompt_used?: string;
  market_data_sources?: string[];
  market_research_date?: string;
}

const COLORS = {
  PRIMARY: [30, 58, 95] as [number, number, number],
  ACCENT: [213, 43, 30] as [number, number, number],
  TEXT: [30, 58, 95] as [number, number, number],
  MUTED: [100, 116, 139] as [number, number, number],
  WHITE: [255, 255, 255] as [number, number, number],
  LIGHT_BG: [248, 250, 252] as [number, number, number],
};

export const generatePitchPDF = async (pitch: PitchContent, ideaName: string): Promise<void> => {
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  const addNewPageIfNeeded = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin - 15) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Header
  doc.setFillColor(...COLORS.PRIMARY);
  doc.rect(0, 0, pageWidth, 50, "F");
  
  doc.setFillColor(...COLORS.ACCENT);
  doc.rect(0, 50, pageWidth, 3, "F");

  doc.setTextColor(...COLORS.WHITE);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(pitch.business_name, margin, 30);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const hasMarketData = pitch.market_data_sources && pitch.market_data_sources.length > 0;
  doc.text(hasMarketData ? "ONE-PAGE BUSINESS PITCH • REAL-TIME MARKET DATA" : "ONE-PAGE BUSINESS PITCH", margin, 42);

  yPosition = 70;

  // Elevator Pitch (highlighted box)
  doc.setFillColor(...COLORS.LIGHT_BG);
  const elevatorLines = doc.splitTextToSize(pitch.elevator_pitch, contentWidth - 16);
  const elevatorHeight = elevatorLines.length * 7 + 20;
  doc.roundedRect(margin, yPosition, contentWidth, elevatorHeight, 3, 3, "F");
  
  doc.setFillColor(...COLORS.PRIMARY);
  doc.rect(margin, yPosition, 4, elevatorHeight, "F");
  
  doc.setTextColor(...COLORS.PRIMARY);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("ELEVATOR PITCH", margin + 10, yPosition + 12);
  
  doc.setTextColor(...COLORS.TEXT);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(elevatorLines, margin + 10, yPosition + 24);
  
  yPosition += elevatorHeight + 15;

  // Helper function for sections
  const addSection = (title: string, content: string, highlight = false) => {
    const lines = doc.splitTextToSize(content, contentWidth - 8);
    const sectionHeight = lines.length * 5 + 18;
    
    addNewPageIfNeeded(sectionHeight);
    
    if (highlight) {
      doc.setFillColor(...COLORS.LIGHT_BG);
      doc.roundedRect(margin, yPosition, contentWidth, sectionHeight, 2, 2, "F");
    }
    
    doc.setTextColor(...COLORS.PRIMARY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), margin + 4, yPosition + 10);
    
    doc.setTextColor(...COLORS.TEXT);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(lines, margin + 4, yPosition + 18);
    
    yPosition += sectionHeight + 8;
  };

  // Sections in 2-column layout where possible
  const leftColWidth = (contentWidth - 10) / 2;
  
  // Problem & Solution side by side
  const problemLines = doc.splitTextToSize(pitch.problem, leftColWidth - 8);
  const solutionLines = doc.splitTextToSize(pitch.solution, leftColWidth - 8);
  const maxLines = Math.max(problemLines.length, solutionLines.length);
  const twoColHeight = maxLines * 5 + 20;
  
  addNewPageIfNeeded(twoColHeight);
  
  // Problem column
  doc.setFillColor(...COLORS.LIGHT_BG);
  doc.roundedRect(margin, yPosition, leftColWidth, twoColHeight, 2, 2, "F");
  doc.setTextColor(...COLORS.PRIMARY);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("THE PROBLEM", margin + 4, yPosition + 10);
  doc.setTextColor(...COLORS.TEXT);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(problemLines, margin + 4, yPosition + 18);
  
  // Solution column
  doc.setFillColor(...COLORS.LIGHT_BG);
  doc.roundedRect(margin + leftColWidth + 10, yPosition, leftColWidth, twoColHeight, 2, 2, "F");
  doc.setTextColor(...COLORS.PRIMARY);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("THE SOLUTION", margin + leftColWidth + 14, yPosition + 10);
  doc.setTextColor(...COLORS.TEXT);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(solutionLines, margin + leftColWidth + 14, yPosition + 18);
  
  yPosition += twoColHeight + 10;

  // Rest of sections
  addSection("Target Customer", pitch.target_customer);
  addSection("Market Opportunity (Canadian Context)", pitch.market_opportunity, true);
  addSection("Revenue Model", pitch.revenue_model);
  addSection("Why Now", pitch.why_now, true);

  // 30-Day Action Plan
  addNewPageIfNeeded(80);
  
  doc.setFillColor(...COLORS.PRIMARY);
  doc.roundedRect(margin, yPosition, contentWidth, 12, 2, 2, "F");
  doc.setTextColor(...COLORS.WHITE);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("30-DAY ACTION PLAN", margin + 4, yPosition + 8);
  
  yPosition += 16;
  
  pitch.action_plan.forEach((step, index) => {
    addNewPageIfNeeded(12);
    
    // Number circle
    doc.setFillColor(...COLORS.PRIMARY);
    doc.circle(margin + 6, yPosition + 4, 4, "F");
    doc.setTextColor(...COLORS.WHITE);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(String(index + 1), margin + 4.5, yPosition + 6);
    
    // Step text
    doc.setTextColor(...COLORS.TEXT);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const stepLines = doc.splitTextToSize(step, contentWidth - 20);
    doc.text(stepLines, margin + 14, yPosition + 5);
    
    yPosition += stepLines.length * 5 + 6;
  });

  // Data Sources Section (if available)
  if (pitch.market_data_sources && pitch.market_data_sources.length > 0) {
    addNewPageIfNeeded(40);
    
    yPosition += 8;
    
    doc.setFillColor(...COLORS.LIGHT_BG);
    const sourcesHeight = Math.min(pitch.market_data_sources.length * 6 + 20, 50);
    doc.roundedRect(margin, yPosition, contentWidth, sourcesHeight, 2, 2, "F");
    
    doc.setTextColor(...COLORS.PRIMARY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("DATA SOURCES (Perplexity Real-Time Search)", margin + 4, yPosition + 10);
    
    doc.setTextColor(...COLORS.MUTED);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    
    let sourceY = yPosition + 18;
    pitch.market_data_sources.slice(0, 4).forEach((source, index) => {
      // Extract domain for display
      let displayUrl = source;
      try {
        const url = new URL(source);
        displayUrl = url.hostname.replace('www.', '');
      } catch {
        // Use as-is if not a valid URL
      }
      
      const sourceText = `[${index + 1}] ${displayUrl}`;
      doc.textWithLink(sourceText, margin + 4, sourceY, { url: source });
      sourceY += 6;
    });
    
    if (pitch.market_research_date) {
      doc.setTextColor(...COLORS.MUTED);
      doc.setFontSize(6);
      const dateStr = `Research date: ${new Date(pitch.market_research_date).toLocaleDateString()}`;
      doc.text(dateStr, pageWidth - margin - doc.getTextWidth(dateStr), yPosition + 10);
    }
    
    yPosition += sourcesHeight + 8;
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 10;
    
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
    
    doc.setTextColor(...COLORS.PRIMARY);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("FastTrack.Business", margin, footerY);
    
    doc.setTextColor(...COLORS.MUTED);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const pageText = `Page ${i} of ${totalPages}`;
    const pageTextWidth = doc.getTextWidth(pageText);
    doc.text(pageText, (pageWidth - pageTextWidth) / 2, footerY);
    
    const date = new Date().toLocaleDateString("en-CA");
    doc.text(date, pageWidth - margin - doc.getTextWidth(date), footerY);
  }

  // Download
  const fileName = `${pitch.business_name.replace(/[^a-zA-Z0-9]/g, '-')}-pitch.pdf`;
  doc.save(fileName);
};
