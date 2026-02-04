export interface RawPrintRecord {
  date: string;
  user_type: string;
  department: string;
  pages_per_sheet: string; // CSV often returns numbers as strings
  total_pages: string;
  copies: string;
  sheet_used: string;
}

export interface PrintRecord {
  date: string;
  user_type: string;
  department: string;
  pages_per_sheet: number;
  total_pages: number;
  copies: number;
  sheet_used: number;
}

export interface DashboardStats {
  totalSheetsUsed: number;
  totalRequests: number;
  averageSheetsPerRequest: number;
  mostActiveDepartment: string;
  // New Eco Metrics
  treesConsumed: number;
  co2Emitted: number; // in kg
  waterUsed: number; // in liters
  sheetsSaved: number; // sheets saved by N-up printing
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface TrendDataPoint {
  date: string;
  sheets: number;
}