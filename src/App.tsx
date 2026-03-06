import React, { useState, useEffect, useMemo } from 'react';
import { getSupabase } from './lib/supabase';
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
  TrendingUp, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Info,
  GraduationCap,
  LayoutDashboard,
  Settings,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import OnboardingQuestionnaire, { OnboardingData } from './components/OnboardingQuestionnaire';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OrientationData {
  "specialites": string;
  "formation": string;
  "candidats_voeu_confirme": number;
  "candidats_proposition_recue": number;
  "candidats_proposition_acceptee": number;
}

const mapSupabaseData = (rawData: any[]): OrientationData[] => {
  return rawData.map(row => ({
    "specialites": row.specialites || "",
    "formation": row.formation || "",
    "candidats_voeu_confirme": Number(row.candidats_voeu_confirme || 0),
    "candidats_proposition_recue": Number(row.candidats_proposition_recue || 0),
    "candidats_proposition_acceptee": Number(row.candidats_proposition_acceptee || 0),
  }));
};

const COLORS = ['#e30613', '#f43f5e', '#ec4899', '#8b5cf6', '#6366f1', '#10b981', '#06b6d4'];

export default function App() {
  const [data, setData] = useState<OrientationData[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'voeux' | 'admissions' | 'taux', direction: 'asc' | 'desc' }>({
    key: 'taux',
    direction: 'desc'
  });

  // Step 1: Load unique specialties from Supabase
  const loadSpecialties = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = getSupabase();
      
      const { data: specData, error: specError } = await supabase
        .from('parcoursup_1')
        .select('specialites');

      if (specError) throw specError;

      if (specData) {
        const uniqueSpecs = Array.from(new Set(specData.map(row => row.specialites)))
          .filter(Boolean)
          .sort() as string[];
        
        setSpecialties(uniqueSpecs);
      }
    } catch (err: any) {
      console.error('Error loading specialties:', err);
      setError("Erreur lors du chargement des spécialités.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpecialties();
  }, []);

  useEffect(() => {
    const loadSpecialtyData = async () => {
      if (!selectedSpecialty) return;

      try {
        setLoadingDetails(true);
        const supabase = getSupabase();
        
        const { data: orientationData, error: fetchError } = await supabase
          .from('parcoursup_1')
          .select('*')
          .eq('specialites', selectedSpecialty);

        if (fetchError) throw fetchError;

        if (orientationData) {
          const mappedData = mapSupabaseData(orientationData);
          setData(mappedData);
        }
      } catch (err: any) {
        console.error('Error loading specialty data:', err);
        setError("Erreur lors du chargement des données.");
      } finally {
        setLoadingDetails(false);
      }
    };

    loadSpecialtyData();
  }, [selectedSpecialty]);

  const handleOnboardingComplete = (data: OnboardingData) => {
    setOnboardingData(data);
    setOnboardingComplete(true);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSpecialties = useMemo(() => {
    return specialties.filter(spec => 
      spec.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [specialties, searchQuery]);

  const handleSpecialtySelect = (spec: string) => {
    setSelectedSpecialty(spec);
    setSearchQuery(spec);
    setShowSuggestions(false);
  };

  // Update search query when selectedSpecialty changes (e.g. on initial load)
  useEffect(() => {
    if (selectedSpecialty && !searchQuery) {
      setSearchQuery(selectedSpecialty);
    }
  }, [selectedSpecialty]);

  const filteredData = useMemo(() => {
    if (!selectedSpecialty) return [];
    return data; // Data is already filtered by Supabase query
  }, [data, selectedSpecialty]);

  const globalStats = useMemo(() => {
    const stats = filteredData.find(item => 
      item.formation && item.formation.toLowerCase().includes("ensemble des bacheliers")
    );
    if (!stats) return null;

    const voeux = stats.candidats_voeu_confirme || 0;
    const admissions = stats.candidats_proposition_recue || 0;
    const taux = voeux > 0 ? Math.round((admissions / voeux) * 100) : 0;

    return {
      voeux,
      admissions,
      taux
    };
  }, [filteredData]);

  const formationsData = useMemo(() => {
    const baseData = filteredData
      .filter(item => item.formation && !item.formation.toLowerCase().includes("ensemble des bacheliers"))
      .map(item => {
        const voeux = item.candidats_voeu_confirme || 0;
        const admissions = item.candidats_proposition_recue || 0;
        const taux = voeux > 0 ? Math.round((admissions / voeux) * 100) : 0;
        
        return {
          name: item.formation,
          voeux,
          admissions,
          taux
        };
      });

    return [...baseData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      const aNum = aValue as number;
      const bNum = bValue as number;

      return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
    });
  }, [filteredData, sortConfig]);

  const topFormations = useMemo(() => {
    // Top formations for charts should probably always be by volume (voeux) or we can use the sorted data
    // Let's keep it by volume for consistent charts or use the first 5 of sorted data?
    // User asked for sorting the "details" section, so let's keep charts stable by volume or use sorted.
    // Usually charts represent the "top" by a fixed metric.
    return [...formationsData].sort((a, b) => b.voeux - a.voeux).slice(0, 5);
  }, [formationsData]);

  const handleSort = (key: 'name' | 'voeux' | 'admissions' | 'taux') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const SortIcon = ({ column }: { column: 'name' | 'voeux' | 'admissions' | 'taux' }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!onboardingComplete) {
    return <OnboardingQuestionnaire onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary-light selection:text-primary">
      {/* Header */}
      <header className="bg-primary sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 160 40" className="h-9 w-auto fill-white" xmlns="http://www.w3.org/2000/svg">
              <text x="0" y="32" font-family="Arial, sans-serif" font-weight="900" font-style="italic" font-size="28" fill="white">l'Étudiant</text>
            </svg>
          </div>
          
          <div className="flex items-center gap-4">
            {onboardingData && (
              <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full border border-white/30 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">
                  Profil: {onboardingData.academy}
                </span>
              </div>
            )}
            <button 
              onClick={() => setOnboardingComplete(false)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
              title="Modifier mon profil"
            >
              <Settings className="w-5 h-5" />
            </button>
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
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder={loading ? "Chargement des spécialités..." : "Recherche tes spécialités..."}
              disabled={loading}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className={cn(
                "block w-full pl-11 pr-10 py-4 text-base border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-lg rounded-2xl bg-white shadow-xl shadow-primary-light/50 transition-all",
                loading && "opacity-50 cursor-not-allowed"
              )}
            />
            
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {showSuggestions && filteredSpecialties.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-60 overflow-y-auto custom-scrollbar">
                {filteredSpecialties.map((spec) => (
                  <button
                    key={spec}
                    onClick={() => handleSpecialtySelect(spec)}
                    className={cn(
                      "w-full text-left px-5 py-3 hover:bg-primary-light transition-colors text-slate-700 font-medium border-b border-slate-50 last:border-none",
                      selectedSpecialty === spec && "bg-primary-light text-primary"
                    )}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            )}
            
            {/* Click outside to close suggestions */}
            {showSuggestions && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowSuggestions(false)}
              />
            )}
          </div>
        </section>

        {selectedSpecialty ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            {loadingDetails && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-3xl">
                <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-bold text-slate-900">Mise à jour des données...</p>
                </div>
              </div>
            )}
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
                icon={<TrendingUp className="w-6 h-6 text-primary" />}
                description="Chance moyenne d'obtenir une proposition"
                color="primary"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bar Chart: Top Formations */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-primary" />
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
                        fill="#e30613" 
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
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-900">Détails des formations</h3>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleSort('taux')}
                    className={cn(
                      "text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2",
                      sortConfig.key === 'taux' 
                        ? "bg-primary text-white shadow-lg shadow-primary-light" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Trier par taux d'accès
                    {sortConfig.key === 'taux' && (
                      sortConfig.direction === 'desc' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <span className="text-xs font-medium px-2.5 py-1 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
                    {formationsData.length} filières
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th 
                        className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Formation <SortIcon column="name" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => handleSort('voeux')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Vœux <SortIcon column="voeux" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => handleSort('admissions')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Admissions <SortIcon column="admissions" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => handleSort('taux')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Taux d'accès <SortIcon column="taux" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formationsData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center text-primary font-bold text-xs">
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
                                className="h-full bg-primary rounded-full" 
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
              <svg viewBox="0 0 160 40" className="h-8 w-auto fill-primary" xmlns="http://www.w3.org/2000/svg">
                <text x="0" y="32" font-family="Arial, sans-serif" font-weight="900" font-style="italic" font-size="28" fill="currentColor">l'Étudiant</text>
              </svg>
            </div>
            <p className="text-slate-500 text-sm">
              Données basées sur les statistiques officielles Parcoursup.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-slate-400 hover:text-primary transition-colors">Documentation</a>
              <a href="#" className="text-slate-400 hover:text-primary transition-colors">Contact</a>
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
  color: 'blue' | 'emerald' | 'primary';
}

function StatCard({ title, value, icon, description, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-100",
    emerald: "bg-emerald-50 border-emerald-100",
    primary: "bg-primary-light border-primary/10"
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
