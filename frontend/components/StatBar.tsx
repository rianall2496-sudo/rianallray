import React from 'react';

interface StatBarProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  maxValue?: number;
  colorClass: string;
  description: string;
}

export const StatBar: React.FC<StatBarProps> = ({ icon, label, value, maxValue = 100, colorClass, description }) => {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <div className="mb-4 group relative">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-sm font-bold text-slate-900">{value.toLocaleString()}</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${colorClass} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg z-10 text-center">
        {description}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};
