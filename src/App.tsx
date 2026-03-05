import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
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
  Legend
} from 'recharts';
import { 
  Search, 
  Upload, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Info,
  GraduationCap,
  LayoutDashboard
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OrientationData {
  "Enseignements de spécialité": string;
  "Formation": string;
  "Nombre de candidats bacheliers ayant confirmé au moins un vœu": string | number;
  "Nombre de candidats bacheliers ayant reçu au moins une proposition d'admission": string | number;
  "Nombre de candidats bacheliers ayant accepté une proposition d'admission": string | number;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

export default function App() {
  const [data, setData] = useState<OrientationData[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await fetch('/data_orientation.csv');
        if (!response.ok) throw new Error('Failed to fetch');
        const csvText = await response.text();
        parseCSV(csvText);
      } catch (err) {
        console.error('Error loading initial CSV:', err);
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const parseCSV = (csvText: string) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as OrientationData[];
        setData(parsedData);
        
        // Set default specialty if available
        const specialties = Array.from(new Set(parsedData.map(item => item["Enseignements de spécialité"]))).filter(Boolean);
        if (specialties.length > 0 && !selectedSpecialty) {
          setSelectedSpecialty(specialties[0]);
        }
        setLoading(false);
      },
      error: (err) => {
        setError("Erreur lors de la lecture du fichier CSV.");
        setLoading(false);
      }
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        parseCSV(text);
      };
      reader.readAsText(file);
    }
  };

  const specialties = useMemo(() => {
    return Array.from(new Set(data.map(item => item["Enseignements de spécialité"]))).filter(Boolean);
  }, [data]);

  const filteredData = useMemo(() => {
    if (!selectedSpecialty) return [];
    return data.filter(item => item["Enseignements de spécialité"] === selectedSpecialty);
  }, [data, selectedSpecialty]);

  const globalStats = useMemo(() => {
    const stats = filteredData.find(item => 
      item["Formation"] && item["Formation"].toLowerCase().includes("ensemble des bacheliers")
    );
    if (!stats) return null;

    const voeux = Number(stats["Nombre de candidats bacheliers ayant confirmé au moins un vœu"]) || 0;
    const admissions = Number(stats["Nombre de candidats bacheliers ayant reçu au moins une proposition d'admission"]) || 0;
    const taux = voeux > 0 ? Math.round((admissions / voeux) * 100) : 0;

    return {
      voeux,
      admissions,
      taux
    };
  }, [filteredData]);

  const formationsData = useMemo(() => {
    return filteredData
      .filter(item => item["Formation"] && !item["Formation"].toLowerCase().includes("ensemble des bacheliers"))
      .map(item => {
        const voeux = Number(item["Nombre de candidats bacheliers ayant confirmé au moins un vœu"]) || 0;
        const admissions = Number(item["Nombre de candidats bacheliers ayant reçu au moins une proposition d'admission"]) || 0;
        const taux = voeux > 0 ? Math.round((admissions / voeux) * 100) : 0;
        
        return {
          name: item["Formation"],
          voeux,
          admissions,
          taux
        };
      })
      .sort((a, b) => b.voeux - a.voeux);
  }, [filteredData]);

  const topFormations = formationsData.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 hidden sm:block">
              Orientation <span className="text-indigo-600">Post-Bac</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="cursor-pointer flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
              <Upload className="w-4 h-4" />
              <span className="hidden md:inline">Importer un CSV</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero / Selection */}
        <section className="mb-12 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Trouve ta voie après le bac
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Analyse les statistiques d'admission basées sur tes enseignements de spécialité pour mieux préparer tes vœux Parcoursup.
          </p>
          
          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="block w-full pl-11 pr-10 py-4 text-base border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-lg rounded-2xl bg-white shadow-xl shadow-indigo-100/50 appearance-none transition-all"
            >
              <option value="" disabled>Sélectionne tes spécialités...</option>
              {specialties.map((spec) => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        </section>

        {selectedSpecialty ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                title="Candidats Totaux" 
                value={globalStats ? globalStats.voeux.toLocaleString() : '0'} 
                icon={<Users className="w-6 h-6 text-blue-600" />}
                description="Nombre de vœux confirmés pour ce profil"
                color="blue"
              />
              <StatCard 
                title="Admissions" 
                value={globalStats ? globalStats.admissions.toLocaleString() : '0'} 
                icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
                description="Nombre total de propositions reçues"
                color="emerald"
              />
              <StatCard 
                title="Taux d'Accès Global" 
                value={globalStats ? `${globalStats.taux}%` : '0%'} 
                icon={<TrendingUp className="w-6 h-6 text-indigo-600" />}
                description="Chance moyenne d'obtenir une proposition"
                color="indigo"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bar Chart: Top Formations */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-indigo-600" />
                    Top 5 des Formations Demandées
                  </h3>
                  <Info className="w-4 h-4 text-slate-400 cursor-help" />
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topFormations} layout="vertical" margin={{ left: 40, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={120} 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar 
                        dataKey="voeux" 
                        fill="#6366f1" 
                        radius={[0, 8, 8, 0]} 
                        barSize={32}
                        name="Nombre de vœux"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart: Success Distribution */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Taux d'Accès par Filière
                  </h3>
                  <Info className="w-4 h-4 text-slate-400 cursor-help" />
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topFormations}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="taux"
                        nameKey="name"
                      >
                        {topFormations.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`${value}%`, 'Taux d\'accès']}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Détails des formations</h3>
                <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                  {formationsData.length} filières trouvées
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Formation</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Vœux</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Admissions</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Taux d'accès</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formationsData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                              {idx + 1}
                            </div>
                            <span className="font-medium text-slate-700">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-600 font-mono text-sm">{item.voeux.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-slate-600 font-mono text-sm">{item.admissions.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                              <div 
                                className="h-full bg-indigo-500 rounded-full" 
                                style={{ width: `${item.taux}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-900 text-sm">{item.taux}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <LayoutDashboard className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Prêt à commencer ?</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Sélectionne tes enseignements de spécialité ci-dessus pour visualiser les statistiques d'orientation.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="bg-slate-900 p-1.5 rounded-lg">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900">Orientation Post-Bac</span>
            </div>
            <p className="text-slate-500 text-sm">
              Données basées sur les statistiques officielles Parcoursup.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors">Documentation</a>
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
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
    blue: "bg-blue-50 border-blue-100",
    emerald: "bg-emerald-50 border-emerald-100",
    indigo: "bg-indigo-50 border-indigo-100"
  };

  return (
    <div className={cn("p-6 rounded-3xl border shadow-sm transition-all hover:shadow-md", colorClasses[color])}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-white rounded-2xl shadow-sm">
          {icon}
        </div>
      </div>
      <h4 className="text-slate-500 text-sm font-medium mb-1">{title}</h4>
      <div className="text-3xl font-extrabold text-slate-900 mb-2">{value}</div>
      <p className="text-slate-500 text-xs leading-relaxed">{description}</p>
    </div>
  );
}
