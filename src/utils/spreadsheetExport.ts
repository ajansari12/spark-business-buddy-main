import * as XLSX from 'xlsx';
import { BusinessIdeaDisplay, StartupCostBreakdown } from "@/types/ideas-enhanced";

interface SpreadsheetData {
  ideaName: string;
  startupCosts: StartupCostBreakdown;
  monthlyRevenueLow: number;
  monthlyRevenueHigh: number;
  monthlyExpenses: number;
  breakEvenMonths: number;
  yearOneProfitLow: number;
  yearOneProfitHigh: number;
}

// Extract numeric value from financial strings like "$5,000 - $10,000"
function extractNumbers(value: string): { low: number; high: number } {
  const numbers = value.match(/[\d,]+/g);
  if (!numbers || numbers.length === 0) return { low: 0, high: 0 };
  
  const low = parseInt(numbers[0].replace(/,/g, "")) || 0;
  const high = numbers.length > 1 ? parseInt(numbers[1].replace(/,/g, "")) || low : low;
  
  return { low, high };
}

// Parse idea data into spreadsheet format
function ideaToSpreadsheetData(idea: BusinessIdeaDisplay): SpreadsheetData {
  const revenue = extractNumbers(idea.monthlyRevenuePotential || "");
  const profit = extractNumbers(idea.yearOneProfit || "");
  const breakEven = parseInt(idea.breakEvenTimeline?.match(/\d+/)?.[0] || "6");
  
  return {
    ideaName: idea.name,
    startupCosts: idea.startupCostBreakdown || { total: extractNumbers(idea.startupCost).low },
    monthlyRevenueLow: revenue.low,
    monthlyRevenueHigh: revenue.high,
    monthlyExpenses: Math.round((revenue.low + revenue.high) / 2 * 0.4), // Estimate 40% expenses
    breakEvenMonths: breakEven,
    yearOneProfitLow: profit.low,
    yearOneProfitHigh: profit.high,
  };
}

type SheetRow = (string | number)[];

export function generateYear1CashFlow(idea: BusinessIdeaDisplay): Blob {
  const data = ideaToSpreadsheetData(idea);
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Summary
  const summaryData: SheetRow[] = [
    ['FastTrack Business Financial Model - Year 1'],
    [''],
    ['Business Idea:', data.ideaName],
    ['Generated:', new Date().toLocaleDateString('en-CA')],
    [''],
    ['STARTUP COSTS'],
    ['Category', 'Amount (CAD)'],
  ];
  
  // Add startup cost breakdown
  const breakdown = data.startupCosts;
  const costItems = [
    { label: 'Equipment', value: breakdown.equipment || 0 },
    { label: 'Licensing', value: breakdown.licensing || 0 },
    { label: 'Marketing', value: breakdown.marketing || 0 },
    { label: 'Inventory', value: breakdown.inventory || 0 },
    { label: 'Software', value: breakdown.software || 0 },
    { label: 'Insurance', value: breakdown.insurance || 0 },
    { label: 'Workspace', value: breakdown.workspace || 0 },
    { label: 'Other', value: breakdown.other || 0 },
  ].filter(item => item.value > 0);
  
  costItems.forEach(item => {
    summaryData.push([item.label, item.value]);
  });
  
  const totalStartup = breakdown.total || costItems.reduce((sum, item) => sum + item.value, 0);
  summaryData.push(['Total Startup Cost', totalStartup]);
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
  
  // Sheet 2: Monthly Cash Flow
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const avgRevenue = (data.monthlyRevenueLow + data.monthlyRevenueHigh) / 2;
  
  // Revenue ramp-up model: 25%, 50%, 75%, then 100%
  const revenueRamp = [0.25, 0.5, 0.75, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  
  let cumulative = -totalStartup;
  
  const cashFlowData: SheetRow[] = [
    ['YEAR 1 MONTHLY CASH FLOW'],
    [''],
    ['Month', 'Revenue', 'Expenses', 'Net Cash', 'Cumulative'],
  ];
  
  months.forEach((month, i) => {
    const revenue = Math.round(avgRevenue * revenueRamp[i]);
    const expenses = data.monthlyExpenses;
    const net = revenue - expenses;
    cumulative += net;
    cashFlowData.push([month, revenue, expenses, net, cumulative]);
  });
  
  // Add totals row
  const totalRevenue = months.reduce((sum, _, i) => sum + Math.round(avgRevenue * revenueRamp[i]), 0);
  const totalExpenses = data.monthlyExpenses * 12;
  cashFlowData.push(['']);
  cashFlowData.push(['TOTAL', totalRevenue, totalExpenses, totalRevenue - totalExpenses, cumulative]);
  
  const cashFlowSheet = XLSX.utils.aoa_to_sheet(cashFlowData);
  cashFlowSheet['!cols'] = [
    { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, cashFlowSheet, 'Monthly Cash Flow');
  
  // Sheet 3: Break-Even Scenarios
  const scenarioData: SheetRow[] = [
    ['BREAK-EVEN SCENARIO ANALYSIS'],
    [''],
    ['Scenario', 'Monthly Revenue', 'Break-Even (Months)', 'Year 1 Profit'],
    ['Worst Case', data.monthlyRevenueLow, Math.ceil(data.breakEvenMonths * 1.5), data.yearOneProfitLow],
    ['Expected', Math.round(avgRevenue), data.breakEvenMonths, Math.round((data.yearOneProfitLow + data.yearOneProfitHigh) / 2)],
    ['Best Case', data.monthlyRevenueHigh, Math.ceil(data.breakEvenMonths * 0.7), data.yearOneProfitHigh],
  ];
  
  const scenarioSheet = XLSX.utils.aoa_to_sheet(scenarioData);
  scenarioSheet['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, scenarioSheet, 'Scenarios');
  
  // Generate blob
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function generate3YearModel(idea: BusinessIdeaDisplay): Blob {
  const data = ideaToSpreadsheetData(idea);
  const wb = XLSX.utils.book_new();
  
  // Summary sheet
  const summaryData: SheetRow[] = [
    ['FastTrack Business Financial Model - 3 Year Projection'],
    [''],
    ['Business Idea:', data.ideaName],
    ['Generated:', new Date().toLocaleDateString('en-CA')],
    [''],
    ['STARTUP INVESTMENT:', data.startupCosts.total || 0],
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
  
  // Growth scenarios
  const growthRates: Record<string, number> = {
    conservative: 0.10,
    moderate: 0.25,
    aggressive: 0.50,
  };
  
  const avgRevenue = (data.monthlyRevenueLow + data.monthlyRevenueHigh) / 2;
  const totalStartup = data.startupCosts.total || 0;
  
  // 3-Year projections for each scenario
  Object.entries(growthRates).forEach(([scenario, rate]) => {
    const scenarioData: SheetRow[] = [
      [`${scenario.toUpperCase()} SCENARIO (${rate * 100}% annual growth)`],
      [''],
      ['Year', 'Annual Revenue', 'Annual Expenses', 'Net Profit', 'Cumulative'],
    ];
    
    const year1Revenue = avgRevenue * 9; // Accounting for ramp-up
    let cumulative = -totalStartup;
    
    for (let year = 1; year <= 3; year++) {
      const growthMultiplier = year === 1 ? 1 : Math.pow(1 + rate, year - 1);
      const revenue = Math.round(year === 1 ? year1Revenue : avgRevenue * 12 * growthMultiplier);
      const expenses = Math.round(data.monthlyExpenses * 12 * (1 + (year - 1) * 0.05)); // 5% expense increase/year
      const net = revenue - expenses;
      cumulative += net;
      
      scenarioData.push([`Year ${year}`, revenue, expenses, net, cumulative]);
    }
    
    const sheet = XLSX.utils.aoa_to_sheet(scenarioData);
    sheet['!cols'] = [{ wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, sheet, scenario.charAt(0).toUpperCase() + scenario.slice(1));
  });
  
  // Comparison sheet
  const comparisonData: SheetRow[] = [
    ['3-YEAR SCENARIO COMPARISON'],
    [''],
    ['Metric', 'Conservative', 'Moderate', 'Aggressive'],
    ['Year 3 Annual Revenue', 
      Math.round(avgRevenue * 12 * Math.pow(1.10, 2)),
      Math.round(avgRevenue * 12 * Math.pow(1.25, 2)),
      Math.round(avgRevenue * 12 * Math.pow(1.50, 2))
    ],
    ['Year 3 Net Profit',
      Math.round((avgRevenue * 12 * Math.pow(1.10, 2)) * 0.5),
      Math.round((avgRevenue * 12 * Math.pow(1.25, 2)) * 0.55),
      Math.round((avgRevenue * 12 * Math.pow(1.50, 2)) * 0.6)
    ],
    ['3-Year Total Profit',
      Math.round(avgRevenue * 12 * (1 + 1.1 + 1.21) * 0.5 - totalStartup),
      Math.round(avgRevenue * 12 * (1 + 1.25 + 1.5625) * 0.55 - totalStartup),
      Math.round(avgRevenue * 12 * (1 + 1.5 + 2.25) * 0.6 - totalStartup)
    ],
  ];
  
  const compSheet = XLSX.utils.aoa_to_sheet(comparisonData);
  compSheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, compSheet, 'Comparison');
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function downloadSpreadsheet(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
