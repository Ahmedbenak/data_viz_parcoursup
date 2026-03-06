import React from 'react';
import { TrendingUp, ChevronUp, ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FormationsTableProps {
  formationsData: any[];
  sortConfig: { key: string, direction: 'asc' | 'desc' };
  onSort: (key: any) => void;
}

export default function FormationsTable({ formationsData, sortConfig, onSort }: FormationsTableProps) {
  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
      <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-black text-slate-900 mb-1">Détails des formations</h3>
          <p className="text-slate-500 text-sm font-medium">Analyse comparative des filières d'admission</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onSort('taux')}
            className={cn(
              "text-xs font-bold px-5 py-3 rounded-2xl transition-all flex items-center gap-2",
              sortConfig.key === 'taux' 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            )}
          >
            <TrendingUp className="w-4 h-4" />
            Trier par taux d'accès
            {sortConfig.key === 'taux' && (
              sortConfig.direction === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
            )}
          </button>
          <span className="text-xs font-bold px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            {formationsData.length} filières
          </span>
        </div>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/30">
              <th 
                className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors"
                onClick={() => onSort('name')}
              >
                <div className="flex items-center gap-2">
                  Formation <SortIcon column="name" />
                </div>
              </th>
              <th 
                className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:text-indigo-600 transition-colors"
                onClick={() => onSort('voeux')}
              >
                <div className="flex items-center justify-end gap-2">
                  Vœux <SortIcon column="voeux" />
                </div>
              </th>
              <th 
                className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:text-indigo-600 transition-colors"
                onClick={() => onSort('admissions')}
              >
                <div className="flex items-center justify-end gap-2">
                  Admissions <SortIcon column="admissions" />
                </div>
              </th>
              <th 
                className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:text-indigo-600 transition-colors"
                onClick={() => onSort('taux')}
              >
                <div className="flex items-center justify-end gap-2">
                  Taux d'accès <SortIcon column="taux" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {formationsData.map((item, idx) => (
              <tr key={idx} className="hover:bg-indigo-50/20 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-white group-hover:text-indigo-600 transition-all border border-transparent group-hover:border-indigo-100">
                      {idx + 1}
                    </div>
                    <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{item.name}</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right text-slate-500 font-mono font-bold text-sm">{item.voeux.toLocaleString()}</td>
                <td className="px-8 py-6 text-right text-slate-500 font-mono font-bold text-sm">{item.admissions.toLocaleString()}</td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-4">
                    <div className="w-28 h-2.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                      <div 
                        className="h-full bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.4)]" 
                        style={{ width: `${item.taux}%` }}
                      />
                    </div>
                    <span className="font-black text-slate-900 text-base">{item.taux}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
