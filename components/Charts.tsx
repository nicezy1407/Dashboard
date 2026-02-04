import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { ChartDataPoint, TrendDataPoint } from '../types';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
const ECO_GREEN = '#10b981';
const ECO_LIGHT = '#6ee7b7';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-lg text-sm">
        <p className="font-semibold text-slate-800 mb-1">{label}</p>
        <p className="text-eco-600 font-medium">
          {`${payload[0].name}: ${payload[0].value.toLocaleString()}`}
        </p>
      </div>
    );
  }
  return null;
};

// --- PIE CHART ---
interface PrintModePieChartProps {
  data: ChartDataPoint[];
}

export const PrintModePieChart: React.FC<PrintModePieChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800">Resource Efficiency</h3>
        <p className="text-sm text-slate-400">Standard vs. Eco-friendly (2-up)</p>
      </div>
      <div className="flex-1 min-h-[250px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              cornerRadius={5}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#fbbf24' : ECO_GREEN} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', color: '#64748b' }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
                <span className="block text-2xl font-bold text-slate-800">
                    {Math.round((data[1]?.value / (data[0]?.value + data[1]?.value || 1)) * 100) || 0}%
                </span>
                <span className="text-xs text-slate-400 uppercase tracking-wide">Eco</span>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- BAR CHART ---
interface DepartmentBarChartProps {
  data: ChartDataPoint[];
}

export const DepartmentBarChart: React.FC<DepartmentBarChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 h-full">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800">Usage by Department</h3>
        <p className="text-sm text-slate-400">Total sheets consumed per department</p>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: '#94a3b8' }} 
                axisLine={false} 
                tickLine={false} 
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
            />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                content={<CustomTooltip />}
            />
            <Bar dataKey="value" fill={ECO_GREEN} radius={[6, 6, 0, 0]} name="Sheets Used" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- LINE CHART ---
interface UsageTrendChartProps {
  data: TrendDataPoint[];
}

export const UsageTrendChart: React.FC<UsageTrendChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800">Yearly Growth</h3>
        <p className="text-sm text-slate-400">Long-term paper consumption trends</p>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#94a3b8' }} 
                axisLine={false} 
                tickLine={false} 
                padding={{ left: 20, right: 20 }}
            />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line 
                type="monotone" 
                dataKey="sheets" 
                stroke={ECO_GREEN} 
                strokeWidth={3} 
                dot={{ r: 5, fill: '#fff', strokeWidth: 3, stroke: ECO_GREEN }}
                activeDot={{ r: 7, strokeWidth: 0, fill: '#059669' }}
                name="Sheets Used"
                animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};