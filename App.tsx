import React, { useEffect, useState, useMemo } from 'react';
import { FileText, Printer, TreeDeciduous, Users, Leaf, RefreshCw, Filter, ChevronDown, BarChart3, X, Cloud, Droplets, Recycle, Download, Sparkles, Bot } from 'lucide-react';
import { fetchPaperData, calculateStats, getDepartmentUsageData, getPaperSavingData, getYearlyTrendData } from './services/dataService';
import { generateEcoInsights } from './services/aiService';
import { PrintRecord, DashboardStats, ChartDataPoint, TrendDataPoint } from './types';
import { StatCard } from './components/StatCard';
import { DepartmentBarChart, PrintModePieChart, UsageTrendChart } from './components/Charts';

const App: React.FC = () => {
  const [rawData, setRawData] = useState<PrintRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');

  // Filter State
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPaperData();
      setRawData(data);
    } catch (err) {
      console.error("Failed to load data", err);
      setError("Failed to load data. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  // --- Filter Logic ---

  // 1. Get Unique Departments
  const departments = useMemo(() => {
    const depts = new Set(rawData.map(d => d.department).filter(Boolean));
    return ['All', ...Array.from(depts).sort()];
  }, [rawData]);

  // 2. Get Unique Years
  const years = useMemo(() => {
    const yrSet = new Set<string>();
    rawData.forEach(d => {
       const cleanDate = d.date.trim();
       let year = '';
       if (cleanDate.includes('/')) {
           const parts = cleanDate.split('/');
           if (parts.length === 3) year = parts[2].trim();
       } else if (cleanDate.includes('-')) {
           year = cleanDate.split('-')[0];
       } else if (cleanDate.length === 4) {
           year = cleanDate;
       }
       
       if (year && year.length === 4) yrSet.add(year);
    });
    return ['All', ...Array.from(yrSet).sort().reverse()];
  }, [rawData]);

  // 3. Filter Data
  const filteredData = useMemo(() => {
    return rawData.filter(item => {
      const matchesDept = selectedDept === 'All' || item.department === selectedDept;
      
      let itemYear = '';
      const cleanDate = item.date.trim();
      if (cleanDate.includes('/')) itemYear = cleanDate.split('/')[2]?.trim() || '';
      else if (cleanDate.includes('-')) itemYear = cleanDate.split('-')[0];
      else if (cleanDate.length === 4) itemYear = cleanDate;

      const matchesYear = selectedYear === 'All' || itemYear === selectedYear;

      return matchesDept && matchesYear;
    });
  }, [rawData, selectedDept, selectedYear]);

  // 4. Derive Stats from Filtered Data
  const stats = useMemo(() => calculateStats(filteredData), [filteredData]);
  const deptData = useMemo(() => getDepartmentUsageData(filteredData), [filteredData]);
  const pieData = useMemo(() => getPaperSavingData(filteredData), [filteredData]);
  const trendData = useMemo(() => getYearlyTrendData(filteredData), [filteredData]);

  const isFiltered = selectedDept !== 'All' || selectedYear !== 'All';

  // --- Export Function ---
  const handleExportCSV = () => {
    if (!filteredData.length) return;

    const headers = ['Date', 'Department', 'User Type', 'Sheets Used', 'Total Pages', 'Copies', 'Pages Per Sheet'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => [
        `"${row.date}"`,
        `"${row.department}"`,
        `"${row.user_type}"`,
        row.sheet_used,
        row.total_pages,
        row.copies,
        row.pages_per_sheet
      ].join(','))
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecoprint_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- AI Insight Handler ---
  const handleGenerateInsight = async () => {
    setIsAiModalOpen(true);
    // Only generate if empty or if needed (optional optimization, here we regen for freshness)
    setIsAiLoading(true);
    setAiInsight('');
    
    try {
        const result = await generateEcoInsights(stats, deptData, { dept: selectedDept, year: selectedYear });
        setAiInsight(result);
    } catch (e) {
        setAiInsight("Unable to generate insights at this time.");
    } finally {
        setIsAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-eco-200 border-t-eco-500 rounded-full animate-spin"></div>
            <Leaf className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-eco-500 w-6 h-6" />
        </div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading Analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md border border-red-100">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Printer className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Unavailable</h2>
          <p className="text-slate-500 mb-6 text-sm">{error}</p>
          <button 
            onClick={loadData}
            className="bg-slate-800 text-white px-6 py-2.5 rounded-xl hover:bg-slate-700 transition-all font-medium text-sm shadow-lg shadow-slate-200"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      
      {/* --- HERO HEADER --- */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40 bg-opacity-90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Logo Area */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-eco-400 to-eco-600 rounded-xl flex items-center justify-center shadow-eco-200 shadow-lg">
                        <Leaf className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">EcoPrint</h1>
                        <span className="text-xs text-slate-400 font-medium">Analytics Dashboard</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                     <button 
                        onClick={handleGenerateInsight}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                     >
                        <Sparkles className="w-4 h-4" />
                        <span className="hidden sm:inline">AI Insight</span>
                     </button>
                     <div className="h-8 w-[1px] bg-slate-200"></div>
                     <button 
                        onClick={loadData} 
                        className="p-2 text-slate-400 hover:text-eco-600 hover:bg-eco-50 rounded-lg transition-all"
                        title="Refresh Data"
                     >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* --- CONTROLS BAR --- */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Overview</h2>
                <p className="text-slate-500 mt-1 text-sm">Track your organization's paper footprint.</p>
            </div>

            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-2 w-full lg:w-auto items-center">
                {/* Department Filter */}
                <div className="relative group flex-1 lg:flex-none">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Users className="h-4 w-4 text-slate-400" />
                    </div>
                    <select 
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="pl-9 pr-10 py-2.5 w-full lg:w-48 bg-slate-50 border-0 rounded-lg text-sm font-medium text-slate-600 focus:ring-2 focus:ring-eco-500 focus:bg-white transition-all appearance-none cursor-pointer hover:bg-slate-100"
                    >
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept === 'All' ? 'All Departments' : dept}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                    </div>
                </div>

                {/* Year Filter */}
                <div className="relative group flex-1 lg:flex-none">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BarChart3 className="h-4 w-4 text-slate-400" />
                    </div>
                    <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="pl-9 pr-10 py-2.5 w-full lg:w-32 bg-slate-50 border-0 rounded-lg text-sm font-medium text-slate-600 focus:ring-2 focus:ring-eco-500 focus:bg-white transition-all appearance-none cursor-pointer hover:bg-slate-100"
                    >
                        {years.map(year => (
                            <option key={year} value={year}>{year === 'All' ? 'All Years' : year}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                    </div>
                </div>

                {/* Clear Filter Button */}
                {isFiltered && (
                    <button
                        onClick={() => {
                            setSelectedDept('All');
                            setSelectedYear('All');
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 rounded-lg transition-colors flex-1 lg:flex-none justify-center"
                        title="Clear all filters"
                    >
                        <X className="w-4 h-4" />
                        <span>Clear</span>
                    </button>
                )}

                {/* Export Button */}
                <button
                    onClick={handleExportCSV}
                    disabled={filteredData.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-eco-700 bg-eco-50 hover:bg-eco-100 border border-eco-200 rounded-lg transition-colors flex-1 lg:flex-none justify-center disabled:opacity-50 disabled:cursor-not-allowed ml-auto lg:ml-0"
                    title="Export data to CSV"
                >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                </button>
            </div>
        </div>

        {/* --- MAIN STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Sheets" 
            value={stats?.totalSheetsUsed.toLocaleString() || 0} 
            icon={FileText} 
            description="Total paper consumption"
          />
          <StatCard 
            title="Print Jobs" 
            value={stats?.totalRequests.toLocaleString() || 0} 
            icon={Printer}
            description="Total requests processed"
          />
          <StatCard 
            title="Avg. Sheets / Job" 
            value={stats?.averageSheetsPerRequest || 0} 
            icon={TreeDeciduous}
            description="Efficiency metric"
          />
          <StatCard 
            title="Top Department" 
            value={stats?.mostActiveDepartment || '-'} 
            icon={Users}
            description="Highest volume user"
          />
        </div>

        {/* --- ENVIRONMENTAL IMPACT SECTION --- */}
        <div>
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-eco-100 rounded-lg">
                    <Leaf className="w-5 h-5 text-eco-700" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Environmental Footprint & Savings</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {/* 1. Trees */}
                 <div className="bg-gradient-to-br from-eco-50 to-white p-6 rounded-2xl border border-eco-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-eco-700 uppercase tracking-wider">Trees Consumed</p>
                            <h4 className="text-2xl font-bold text-slate-800 mt-2">{stats?.treesConsumed.toFixed(2)} <span className="text-sm font-normal text-slate-500">trees</span></h4>
                        </div>
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <TreeDeciduous className="w-6 h-6 text-eco-600" />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-eco-100/50">
                        <p className="text-xs text-slate-500">Based on standard ~8,333 sheets/tree</p>
                    </div>
                 </div>

                 {/* 2. CO2 */}
                 <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CO2 Emissions</p>
                            <h4 className="text-2xl font-bold text-slate-800 mt-2">{stats?.co2Emitted.toFixed(1)} <span className="text-sm font-normal text-slate-500">kg</span></h4>
                        </div>
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Cloud className="w-6 h-6 text-slate-400" />
                        </div>
                    </div>
                     <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-500">Approx. 4.5g CO2 per sheet</p>
                    </div>
                 </div>

                 {/* 3. Water */}
                 <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Water Footprint</p>
                            <h4 className="text-2xl font-bold text-slate-800 mt-2">{Math.round(stats?.waterUsed || 0).toLocaleString()} <span className="text-sm font-normal text-slate-500">liters</span></h4>
                        </div>
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Droplets className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                     <div className="mt-4 pt-4 border-t border-blue-100/50">
                        <p className="text-xs text-slate-500">Water used in production lifecycle</p>
                    </div>
                 </div>

                 {/* 4. Savings */}
                 <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Paper Saved</p>
                            <h4 className="text-2xl font-bold text-emerald-800 mt-2">{stats?.sheetsSaved.toLocaleString()} <span className="text-sm font-normal text-emerald-600">sheets</span></h4>
                        </div>
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Recycle className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-emerald-100/50 relative z-10">
                        <p className="text-xs text-emerald-700 font-medium">Saved via multi-page/duplex printing</p>
                    </div>
                 </div>
            </div>
        </div>

        {/* --- CHARTS SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[400px]">
            <DepartmentBarChart data={deptData} />
          </div>
          <div className="h-[400px]">
            <PrintModePieChart data={pieData} />
          </div>
        </div>

        <div className="w-full h-[400px]">
          <UsageTrendChart data={trendData} />
        </div>

      </main>

      {/* --- AI INSIGHT MODAL --- */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={() => !isAiLoading && setIsAiModalOpen(false)}
            ></div>

            {/* Modal Container */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">AI Data Insight</h3>
                            <p className="text-xs text-indigo-500 font-medium">Powered by Gemini</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsAiModalOpen(false)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        disabled={isAiLoading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {isAiLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
                                <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-500 w-4 h-4 animate-pulse" />
                            </div>
                            <p className="text-slate-500 animate-pulse font-medium">Analyzing environmental data...</p>
                        </div>
                    ) : (
                        <div className="prose prose-slate max-w-none">
                            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-sm md:text-base">
                                {aiInsight}
                            </div>
                            
                            <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-indigo-800">
                                    <strong>Disclaimer:</strong> This analysis is generated by AI based on the current dataset. Please verify critical decisions with actual usage logs.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                {!isAiLoading && (
                    <div className="p-4 border-t border-slate-100 flex justify-end">
                        <button
                            onClick={() => setIsAiModalOpen(false)}
                            className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}

    </div>
  );
};

export default App;