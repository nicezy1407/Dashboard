import Papa from 'papaparse';
import { PrintRecord, RawPrintRecord, DashboardStats, ChartDataPoint, TrendDataPoint } from '../types';

const DATA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQNHi2Kt0fVGk3jfqhtt3iIOsKE7U8dSzWAQ7EqKocgLBGvRW72zrh5y6UjEAHbJexCZk6AbjRT5tP2/pub?gid=0&single=true&output=csv';

export const fetchPaperData = async (): Promise<PrintRecord[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(DATA_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(), // Normalize headers to lowercase
      complete: (results) => {
        const rawData = results.data as any[];
        
        const cleanedData: PrintRecord[] = rawData.map((row) => {
            // Helper to extract property with fallback aliases (supports English & Thai)
            const getVal = (aliases: string[]) => {
                for (const alias of aliases) {
                    if (row[alias] !== undefined && row[alias] !== null && row[alias] !== "") {
                        return row[alias];
                    }
                }
                return undefined;
            };

            // Mapping Logic with Fallbacks
            const dateStr = getVal(['date', 'timestamp', 'วันที่', 'time']) || '';
            const deptStr = getVal(['department', 'dept', 'แผนก', 'dep']) || 'Unknown';
            const userTypeStr = getVal(['user_type', 'usertype', 'user type', 'ประเภทผู้ใช้', 'ประเภท']) || 'Unknown';
            
            // Safe Number Parsing (removes commas, handles strings)
            const parseNum = (aliases: string[], defaultVal = 0): number => {
                const val = getVal(aliases);
                if (!val) return defaultVal;
                
                // Remove commas and non-numeric chars that aren't dots
                const cleanVal = String(val).replace(/,/g, '').trim();
                const num = parseFloat(cleanVal);
                return isNaN(num) ? defaultVal : num;
            };

            return {
                date: dateStr,
                department: deptStr,
                user_type: userTypeStr,
                pages_per_sheet: parseNum(['pages_per_sheet', 'pagespersheet', 'pps', 'จำนวนหน้าต่อแผ่น'], 1),
                total_pages: parseNum(['total_pages', 'totalpages', 'จำนวนหน้าทั้งหมด', 'จำนวนหน้า'], 0),
                copies: parseNum(['copies', 'copy', 'amount', 'จำนวนชุด'], 0),
                sheet_used: parseNum(['sheet_used', 'sheetused', 'usage', 'used', 'จำนวนกระดาษ', 'จำนวนกระดาษที่ใช้ไป', 'กระดาษที่ใช้'], 0)
            };
        }).filter(item => item.sheet_used > 0 && item.date.length > 0); // Strict filter: must have usage and date

        console.log(`Processed ${cleanedData.length} valid records out of ${rawData.length} raw rows.`);
        resolve(cleanedData);
      },
      error: (err) => {
        reject(err);
      },
    });
  });
};

export const calculateStats = (data: PrintRecord[]): DashboardStats => {
  const totalSheetsUsed = data.reduce((acc, curr) => acc + curr.sheet_used, 0);
  const totalRequests = data.length;
  
  // Calculate Savings (Total Logic Pages - Physical Sheets Used)
  // Logic: If I print 2 pages on 1 sheet. Logic Pages = 2, Sheet Used = 1. Saved = 1.
  const totalLogicPages = data.reduce((acc, curr) => acc + (curr.total_pages * (curr.copies || 1)), 0); 
  // Note: Depending on CSV, total_pages usually implies 'pages in document' and copies is multiplier. 
  // But let's stick to the simpler metric provided by the CSV structure if total_pages means "total pages processed".
  // Assuming dataset 'total_pages' means 'logical pages printed' and 'sheet_used' means 'physical paper'.
  const sheetsSaved = data.reduce((acc, curr) => {
      // If total_pages > sheet_used, the difference is what we saved via N-up/Duplex
      const saved = Math.max(0, curr.total_pages - curr.sheet_used);
      return acc + saved;
  }, 0);

  // Environmental Constants
  // Source: Environmental Paper Network & Standard industry averages
  // 1 Tree approx 8,333 sheets of A4
  // CO2: approx 4.5 grams per sheet
  // Water: approx 300ml - 325ml per sheet (lifecycle)
  
  const treesConsumed = totalSheetsUsed / 8333;
  const co2Emitted = (totalSheetsUsed * 4.5) / 1000; // convert g to kg
  const waterUsed = (totalSheetsUsed * 0.3); // liters

  // Find most active department
  const deptCounts: Record<string, number> = {};
  data.forEach(d => {
    deptCounts[d.department] = (deptCounts[d.department] || 0) + d.sheet_used;
  });
  
  const mostActiveDepartment = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return {
    totalSheetsUsed,
    totalRequests,
    averageSheetsPerRequest: totalRequests > 0 ? Math.round(totalSheetsUsed / totalRequests) : 0,
    mostActiveDepartment,
    treesConsumed,
    co2Emitted,
    waterUsed,
    sheetsSaved
  };
};

export const getDepartmentUsageData = (data: PrintRecord[]): ChartDataPoint[] => {
  const counts: Record<string, number> = {};
  data.forEach(d => {
    const dept = d.department || 'Unknown';
    counts[dept] = (counts[dept] || 0) + d.sheet_used;
  });

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value); // Descending order
};

export const getPaperSavingData = (data: PrintRecord[]): ChartDataPoint[] => {
  let singlePage = 0;
  let multiPage = 0;

  data.forEach(d => {
    if (d.pages_per_sheet > 1) {
      multiPage += d.sheet_used;
    } else {
      singlePage += d.sheet_used;
    }
  });

  return [
    { name: 'Standard (1 Page/Sheet)', value: singlePage, color: '#4ade80' },
    { name: 'Eco-Save (2+ Pages/Sheet)', value: multiPage, color: '#16a34a' },
  ];
};

export const getYearlyTrendData = (data: PrintRecord[]): TrendDataPoint[] => {
  const trends: Record<string, number> = {};

  data.forEach(d => {
    let year = 'Unknown';
    const cleanDate = d.date.trim();

    // Strategy 1: Slash separated (e.g., DD/MM/YYYY or MM/DD/YYYY)
    if (cleanDate.includes('/')) {
        const parts = cleanDate.split('/');
        // Assuming the year is the last part if it has 4 digits
        const lastPart = parts[parts.length - 1];
        if (lastPart.length === 4) {
            year = lastPart;
        } else if (lastPart.length === 2) {
             // Heuristic for 2 digit year
            year = '20' + lastPart;
        }
    } 
    // Strategy 2: Dash separated ISO-like (e.g., YYYY-MM-DD)
    else if (cleanDate.includes('-')) {
        const parts = cleanDate.split('-');
        if (parts[0].length === 4) {
            year = parts[0];
        }
    } 
    // Strategy 3: Just Year or fallback
    else if (cleanDate.length === 4 && !isNaN(parseInt(cleanDate))) {
        year = cleanDate;
    }
    // Strategy 4: Date Object (Last resort, can be inconsistent across browsers)
    else {
        const dateObj = new Date(cleanDate);
        if (!isNaN(dateObj.getFullYear())) {
            year = dateObj.getFullYear().toString();
        }
    }

    if (year !== 'Unknown' && !isNaN(parseInt(year))) {
        trends[year] = (trends[year] || 0) + d.sheet_used;
    }
  });

  return Object.entries(trends)
    .map(([year, sheets]) => ({ date: year, sheets }))
    .sort((a, b) => a.date.localeCompare(b.date));
};