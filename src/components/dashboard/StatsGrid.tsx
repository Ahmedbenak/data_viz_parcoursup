import React from 'react';
import { Users, CheckCircle, TrendingUp } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  color: 'blue' | 'emerald' | 'indigo';
}

function StatCard({ title, value, icon, description, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-50/50 border-blue-100",
    emerald: "bg-emerald-50/50 border-emerald-100",
    indigo: "bg-indigo-50/50 border-indigo-100"
  };

  return (
    <div className={cn("p-8 rounded-[2rem] border shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group", colorClasses[color])}>
      <div className="flex items-start justify-between mb-6">
        <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:shadow-md transition-all">
          {icon}
        </div>
      </div>
      <h4 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">{title}</h4>
      <div className="text-4xl font-black text-slate-900 mb-3 tracking-tight">{value}</div>
      {description && (
        <p className="text-slate-500 text-sm leading-relaxed font-medium">{description}</p>
      )}
    </div>
  );
}

interface StatsGridProps {
  stats: {
    voeux: number;
    admissions: number;
    taux: number;
  } | null;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <StatCard 
        title="Total du nombre de vœux confirmés pour ce profil" 
        value={stats ? stats.voeux.toLocaleString() : '0'} 
        icon={<Users className="w-8 h-8 text-blue-600" />}
        description=""
        color="blue"
      />
      <StatCard 
        title="Total des propositions d'admission reçues pour ce profil" 
        value={stats ? stats.admissions.toLocaleString() : '0'} 
        icon={<CheckCircle className="w-8 h-8 text-emerald-600" />}
        description=""
        color="emerald"
      />
      <StatCard 
        title="Accessibilité des formations" 
        value={stats ? `${stats.taux}%` : '0%'} 
        icon={<TrendingUp className="w-8 h-8 text-indigo-600" />}
        description="En moyenne, voici la probabilité qu'un seul de tes vœux soit accepté. N'oublie pas : plus tu fais de vœux, plus tu augmentes tes chances d'être pris quelque part !"
        color="indigo"
      />
    </div>
  );
}
