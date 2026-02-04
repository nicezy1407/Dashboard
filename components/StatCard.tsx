import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, description }) => {
  return (
    <div className="group bg-white rounded-2xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
        </div>
        <div className="p-3 rounded-xl bg-eco-50 text-eco-600 group-hover:bg-eco-500 group-hover:text-white transition-colors duration-300 shadow-sm">
          <Icon size={24} />
        </div>
      </div>
      {description && (
        <div className="mt-4 flex items-center pt-4 border-t border-slate-50">
           <span className="text-xs font-medium text-slate-400">
             {description}
           </span>
        </div>
      )}
    </div>
  );
};