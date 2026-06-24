import React from 'react';
import { Users, CheckCircle, TrendingUp } from 'lucide-react';
import { StatCard } from '../common/StatCard';

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
