import React from 'react';
import { cn } from '../../lib/utils';
import { StatCardProps } from '../../types';

export function StatCard({ title, value, icon, description, color }: { title: string, value: string | number, icon: React.ReactNode, description?: string, color: 'blue' | 'emerald' | 'primary' | 'indigo' | 'amber' | 'rose' | 'purple' | 'slate' }) {
  const colorClasses = {
    blue: "bg-blue-50/50 border-blue-100",
    emerald: "bg-emerald-50/50 border-emerald-100",
    primary: "bg-primary-light border-primary/10",
    indigo: "bg-indigo-50/50 border-indigo-100",
    amber: "bg-amber-50/50 border-amber-100",
    rose: "bg-rose-50/50 border-rose-100",
    purple: "bg-purple-50/50 border-purple-100",
    slate: "bg-slate-50 border-slate-100"
  };

  return (
    <div className={cn("p-6 md:p-8 rounded-3xl md:rounded-[2rem] border shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group", colorClasses[color])}>
      <div className="flex items-start justify-between mb-4 md:mb-6">
        <div className="p-3 md:p-4 bg-white rounded-2xl shadow-sm group-hover:shadow-md transition-all">
          {icon}
        </div>
      </div>
      <h4 className="text-slate-500 text-sm font-medium md:font-bold md:uppercase tracking-wider mb-1 md:mb-2">{title}</h4>
      <div className="text-3xl md:text-4xl font-extrabold md:font-black text-slate-900 mb-2 md:mb-3 tracking-tight">{value}</div>
      {description && (
        <p className="text-slate-500 text-xs md:text-sm leading-relaxed md:font-medium">{description}</p>
      )}
    </div>
  );
}
