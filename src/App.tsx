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
  ChevronUp,
  ChevronDown,
  MapPin,
  Target,
  X,
  Building2,
  Navigation
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import OnboardingQuestionnaire, { OnboardingData } from './components/OnboardingQuestionnaire';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup,
  Circle,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface OrientationData {
  "specialites": string;
  "formation": string;
  "candidats_voeu_confirme": number;
  "candidats_proposition_recue": number;
  "candidats_proposition_acceptee": number;
}

interface Parcoursup2Data {
  filiere_generale: string;
  filiere_formation: string;
  etablissement: string;
  commune: string;
  departement: string;
  region: string;
  coordonnees_gps: string;
  eff_admis: number;
  capacite: number;
  taux_acces: number;
  note_moyenne: number;
  selectivite: string;
  pct_admis_neo_gen: number;
  pct_admis_neo_techno: number;
  pct_admis_neo_pro: number;
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

const ACADEMIES = [
  "Aix-Marseille", "Amiens", "Besançon", "Bordeaux", "Clermont-Ferrand", 
  "Corse", "Créteil", "Dijon", "Grenoble", "Lille", "Limoges", "Lyon", 
  "Montpellier", "Nancy-Metz", "Nantes", "Nice", "Normandie", 
  "Orléans-Tours", "Paris", "Poitiers", "Reims", "Rennes", 
  "Strasbourg", "Toulouse", "Versailles", "Guyane", "La Réunion", 
  "Martinique", "Mayotte"
];

// Utility for distance calculation (Haversine formula)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function App() {
  const [data, setData] = useState<OrientationData[]>([]);
  const [detailedData, setDetailedData] = useState<Parcoursup2Data[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Dashboard Filters
  const [filterAcademy, setFilterAcademy] = useState<string>('');
  const [filterMobility, setFilterMobility] = useState<boolean>(false);
  const [filterAverage, setFilterAverage] = useState<string>('');
  
  // Table Filters & Sorting
  const [tableFilterMetric, setTableFilterMetric] = useState<'voeux' | 'admissions' | 'taux'>('taux');
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'voeux' | 'admissions' | 'taux', direction: 'asc' | 'desc' }>({
    key: 'taux',
    direction: 'desc'
  });

  // Map & Geo Filters
  const [selectedForMap, setSelectedForMap] = useState<string[]>([]);
  const [geoFilter, setGeoFilter] = useState({
    city: '',
    department: '',
    formationType: '',
    radius: 100, // km
    center: [46.603354, 1.888334] as [number, number] // France center
  });

  const handleLocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setGeoFilter(prev => ({
          ...prev,
          center: [position.coords.latitude, position.coords.longitude]
        }));
      }, (err) => {
        console.error("Geolocation error:", err);
        alert("Impossible de récupérer ta position. Vérifie les permissions de ton navigateur.");
      });
    } else {
      alert("La géolocalisation n'est pas supportée par ton navigateur.");
    }
  };

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
        
        // Fetch from parcoursup_1
        const { data: orientationData, error: fetchError } = await supabase
          .from('parcoursup_1')
          .select('*')
          .eq('specialites', selectedSpecialty);

        if (fetchError) throw fetchError;

          if (orientationData && orientationData.length > 0) {
            const mappedData = mapSupabaseData(orientationData);
            setData(mappedData);
            
            // Get the list of formations to filter parcoursup_2
            const formationsList = orientationData.map(row => row.formation).filter(Boolean);
            
            // Fetch from parcoursup_2 where filiere_generale matches any of the formations
            const { data: p2Data, error: p2Error } = await supabase
              .from('parcoursup_2')
              .select('*')
              .in('filiere_generale', formationsList);
            
            if (!p2Error && p2Data) {
            setDetailedData(p2Data.map(row => ({
              filiere_generale: row.filiere_generale || "",
              filiere_formation: row.filiere_formation || "",
              etablissement: row.etablissement || "",
              commune: row.commune || "",
              departement: row.departement || "",
              region: row.region || "",
              coordonnees_gps: row.coordonnees_gps || "",
              eff_admis: Number(row.eff_admis || 0),
              capacite: Number(row.capacite || 0),
              taux_acces: Number(row.taux_acces || 0),
              note_moyenne: Number(row.note_moyenne || 0),
              selectivite: row.selectivite || "",
              pct_admis_neo_gen: Number(row["pct_admis_neo_gen"] || 0),
              pct_admis_neo_techno: Number(row["pct_admis_neo_techno"] || 0),
              pct_admis_neo_pro: Number(row["pct_admis_neo_pro"] || 0),
            })));
          }
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
    if (data.specialty) {
      setSelectedSpecialty(data.specialty);
      setSearchQuery(data.specialty);
    }
    setFilterAcademy(data.academy);
    setFilterMobility(data.stayInAcademy);
    setFilterAverage(data.averageBac);
    setOnboardingComplete(true);
  };

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

  const formationsData = useMemo(() => {
    let baseData = filteredData
      .filter(item => item.formation && !item.formation.toLowerCase().includes("ensemble des bacheliers"))
      .map(item => {
        const voeux = item.candidats_voeu_confirme || 0;
        const admissions = item.candidats_proposition_recue || 0;
        const taux = voeux > 0 ? Math.round((admissions / voeux) * 100) : 0;
        
        return {
          name: item.formation,
          voeux,
          admissions,
          taux,
          academy: (item as any).academie || '' 
        };
      });

    // Apply Academy Filter
    if (filterAcademy) {
      const hasAcademyColumn = baseData.some(d => d.academy);
      if (hasAcademyColumn) {
        baseData = baseData.filter(d => d.academy === filterAcademy);
      }
    }

    // Sort by the chosen metric for "Top 10"
    const sortedByMetric = [...baseData].sort((a, b) => b[tableFilterMetric] - a[tableFilterMetric]);
    const top10 = sortedByMetric.slice(0, 10);

    // Then apply the table's own sorting on these top 10
    return [...top10].sort((a, b) => {
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
  }, [filteredData, sortConfig, filterAcademy, tableFilterMetric]);

  const mapFormations = useMemo(() => {
    // If no formation type is selected and no specific formations are picked, show nothing by default
    if (!geoFilter.formationType && selectedForMap.length === 0) {
      return [];
    }

    let base = detailedData;

    // Filter by Formation Type
    if (geoFilter.formationType) {
      base = base.filter(f => f.filiere_generale === geoFilter.formationType);
    }

    // Filter by City
    if (geoFilter.city) {
      base = base.filter(f => f.commune.toLowerCase().includes(geoFilter.city.toLowerCase()));
    }

    // Filter by Department
    if (geoFilter.department) {
      base = base.filter(f => 
        f.departement.toLowerCase().includes(geoFilter.department.toLowerCase()) ||
        (f.departement.match(/\(([^)]+)\)/)?.[1] || "").includes(geoFilter.department)
      );
    }

    // Filter by selected for map
    if (selectedForMap.length > 0) {
      base = base.filter(f => selectedForMap.includes(f.etablissement + ' - ' + f.commune));
    }

    const mapped = base.map(f => {
      const coords = f.coordonnees_gps.split(',').map(c => parseFloat(c.trim()));
      return {
        ...f,
        position: (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) ? coords as [number, number] : null
      };
    }).filter(f => f.position !== null);

    // Apply Perimeter Filter
    if (geoFilter.radius < 1000) {
      return mapped.filter(f => {
        const dist = getDistance(geoFilter.center[0], geoFilter.center[1], f.position![0], f.position![1]);
        return dist <= geoFilter.radius;
      });
    }

    return mapped;
  }, [detailedData, geoFilter, selectedForMap]);

  const formationTypes = useMemo(() => {
    return Array.from(new Set(detailedData.map(f => f.filiere_generale))).sort();
  }, [detailedData]);

  const globalStats = useMemo(() => {
    if (formationsData.length === 0) return null;

    const voeux = formationsData.reduce((acc, curr) => acc + curr.voeux, 0);
    const admissions = formationsData.reduce((acc, curr) => acc + curr.admissions, 0);
    const taux = voeux > 0 ? Math.round((admissions / voeux) * 100) : 0;

    return {
      voeux,
      admissions,
      taux
    };
  }, [formationsData]);

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
    return (
      <OnboardingQuestionnaire 
        onComplete={handleOnboardingComplete} 
        specialties={specialties}
        loadingSpecialties={loading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary-light selection:text-primary">
      {/* Header */}
      <header className="bg-primary sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 160 40" className="h-9 w-auto fill-white" xmlns="http://www.w3.org/2000/svg">
              <text x="0" y="32" fontFamily="Arial, sans-serif" fontWeight="900" fontStyle="italic" fontSize="28" fill="white">l'Étudiant</text>
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
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all text-sm font-bold shadow-sm"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Modifier mon profil</span>
              <span className="sm:hidden">Profil</span>
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

          {/* Quick Filters Section */}
          <div className="mt-8 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Filtres de ton profil</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-primary/30 transition-all">
                <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Académie</span>
                  <select 
                    value={filterAcademy}
                    onChange={(e) => setFilterAcademy(e.target.value)}
                    className="text-sm font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer min-w-[140px]"
                  >
                    <option value="">Toutes les académies</option>
                    {ACADEMIES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-200 transition-all">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Moyenne Bac</span>
                  <div className="flex items-center gap-1">
                    <input 
                      type="text"
                      value={filterAverage}
                      onChange={(e) => setFilterAverage(e.target.value)}
                      className="w-10 text-sm font-bold text-emerald-700 bg-transparent border-none p-0 focus:ring-0"
                    />
                    <span className="text-xs font-bold text-slate-400">/ 20</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setFilterMobility(!filterMobility)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all shadow-sm group",
                  filterMobility 
                    ? "bg-primary border-primary text-white" 
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  filterMobility ? "bg-white/20" : "bg-slate-100 group-hover:bg-primary-light"
                )}>
                  <Target className={cn("w-4 h-4", filterMobility ? "text-white" : "text-slate-400 group-hover:text-primary")} />
                </div>
                <div className="flex flex-col items-start">
                  <span className={cn("text-[10px] font-bold uppercase tracking-tight", filterMobility ? "text-white/70" : "text-slate-400")}>Mobilité</span>
                  <span className="text-sm font-bold">{filterMobility ? "Ma zone" : "France entière"}</span>
                </div>
              </button>

              {(filterAcademy !== onboardingData?.academy || filterAverage !== onboardingData?.averageBac || filterMobility !== onboardingData?.stayInAcademy) && (
                <button 
                  onClick={() => {
                    setFilterAcademy(onboardingData?.academy || '');
                    setFilterAverage(onboardingData?.averageBac || '');
                    setFilterMobility(onboardingData?.stayInAcademy || false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 hover:text-primary transition-all hover:bg-primary-light rounded-xl"
                >
                  <ArrowRight className="w-3 h-3 rotate-180" />
                  Réinitialiser
                </button>
              )}
            </div>
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
              <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Top 10 des formations</h3>
                  <p className="text-xs text-slate-500 mt-1">Sélectionne les formations pour les voir sur la carte</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                    {(['voeux', 'admissions', 'taux'] as const).map((metric) => (
                      <button
                        key={metric}
                        onClick={() => setTableFilterMetric(metric)}
                        className={cn(
                          "text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider",
                          tableFilterMetric === metric 
                            ? "bg-white text-primary shadow-sm" 
                            : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        Top {metric === 'voeux' ? 'Vœux' : metric === 'admissions' ? 'Admissions' : 'Taux'}
                      </button>
                    ))}
                  </div>
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
                    Trier
                    {sortConfig.key === 'taux' && (
                      sortConfig.direction === 'desc' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 w-10"></th>
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
                    {formationsData.map((item, idx) => {
                      const matches = detailedData.filter(d => d.filiere_generale === item.name);
                      const isSelected = matches.length > 0 && matches.every(m => selectedForMap.includes(m.etablissement + ' - ' + m.commune));
                      const isSomeSelected = matches.length > 0 && matches.some(m => selectedForMap.includes(m.etablissement + ' - ' + m.commune));

                      return (
                        <tr key={idx} className={cn("hover:bg-slate-50/50 transition-colors group", isSomeSelected && "bg-primary-light/30")}>
                          <td className="px-6 py-4">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              ref={el => {
                                if (el) el.indeterminate = isSomeSelected && !isSelected;
                              }}
                              onChange={(e) => {
                                if (matches.length > 0) {
                                  const ids = matches.map(m => m.etablissement + ' - ' + m.commune);
                                  setSelectedForMap(prev => 
                                    e.target.checked 
                                      ? Array.from(new Set([...prev, ...ids])) 
                                      : prev.filter(p => !ids.includes(p))
                                  );
                                }
                              }}
                              className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center text-primary font-bold text-xs">
                                {idx + 1}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-700">{item.name}</span>
                                {filterAverage && Number(filterAverage) >= 12 && item.taux > 40 && (
                                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Profil compatible
                                  </span>
                                )}
                              </div>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Map Section */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Carte des formations</h3>
                      <p className="text-sm text-slate-500">
                        {mapFormations.length > 0 
                          ? `${mapFormations.length} établissement${mapFormations.length > 1 ? 's' : ''} trouvé${mapFormations.length > 1 ? 's' : ''}`
                          : "Explore les établissements par zone géographique"
                        }
                      </p>
                    </div>
                  </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(geoFilter.city || geoFilter.department || geoFilter.formationType || geoFilter.radius !== 100) && (
                        <button 
                          onClick={() => setGeoFilter({
                            city: '',
                            department: '',
                            formationType: '',
                            radius: 100,
                            center: geoFilter.center
                          })}
                          className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                        >
                          Réinitialiser filtres
                        </button>
                      )}
                      {selectedForMap.length > 0 && (
                      <button 
                        onClick={() => setSelectedForMap([])}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
                      >
                        <X className="w-3 h-3" />
                        Effacer sélection ({selectedForMap.length})
                      </button>
                    )}
                    <div className="h-8 w-px bg-slate-200 hidden lg:block mx-2" />
                    <button 
                      onClick={handleLocateUser}
                      className="px-4 py-2 bg-primary-light text-primary rounded-xl font-bold text-sm hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                    >
                      <Target className="w-4 h-4" />
                      Ma position
                    </button>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Search className="w-3 h-3" /> Type de formation
                    </label>
                    <select 
                      value={geoFilter.formationType}
                      onChange={(e) => setGeoFilter(prev => ({ ...prev, formationType: e.target.value }))}
                      className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none cursor-pointer"
                    >
                      <option value="">Toutes les formations</option>
                      {formationTypes.map((type, i) => (
                        <option key={i} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3 h-3" /> Ville
                    </label>
                    <input 
                      type="text"
                      placeholder="Ex: Paris, Lyon..."
                      value={geoFilter.city}
                      onChange={(e) => setGeoFilter(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> Département
                    </label>
                    <input 
                      type="text"
                      placeholder="Ex: 75, 69, 33..."
                      value={geoFilter.department}
                      onChange={(e) => setGeoFilter(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Navigation className="w-3 h-3" /> Rayon de recherche
                    </label>
                    <select 
                      value={geoFilter.radius}
                      onChange={(e) => setGeoFilter(prev => ({ ...prev, radius: Number(e.target.value) }))}
                      className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none cursor-pointer"
                    >
                      <option value={20}>20 km (Proximité)</option>
                      <option value={100}>100 km (Régional)</option>
                      <option value={250}>250 km (Grand Sud/Nord)</option>
                      <option value={500}>500 km (National)</option>
                      <option value={1000}>France entière</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="h-[550px] w-full relative z-0">
                {!geoFilter.formationType && selectedForMap.length === 0 ? (
                  <div className="absolute inset-0 z-10 bg-slate-900/5 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-sm">
                      <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-primary" />
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 mb-2">Prêt à explorer ?</h4>
                      <p className="text-sm text-slate-500 mb-6">
                        Sélectionne un type de formation ou coche des établissements dans le tableau pour les voir sur la carte.
                      </p>
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => {
                            const firstType = formationTypes[0];
                            if (firstType) setGeoFilter(prev => ({ ...prev, formationType: firstType }));
                          }}
                          className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors"
                        >
                          Voir toutes les formations
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
                <MapContainer 
                  center={geoFilter.center} 
                  zoom={6} 
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={false}
                >
                  <MapUpdater center={geoFilter.center} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {mapFormations.map((f, idx) => (
                    <Marker key={idx} position={f.position!}>
                      <Popup>
                        <div className="p-1">
                          <h4 className="font-bold text-slate-900 text-sm mb-1">{f.etablissement}</h4>
                          <p className="text-xs text-slate-500 mb-1">{f.filiere_formation}</p>
                          <p className="text-xs font-medium text-primary-dark mb-1">{f.selectivite}</p>
                          <p className="text-xs text-slate-500 mb-2">{f.commune} ({f.departement})</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 p-2 rounded-lg">
                              <span className="block text-[10px] text-slate-400 uppercase font-bold">Taux Accès</span>
                              <span className="text-sm font-bold text-primary">{f.taux_acces}%</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg">
                              <span className="block text-[10px] text-slate-400 uppercase font-bold">Capacité</span>
                              <span className="text-sm font-bold text-slate-700">{f.capacite}</span>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <span className="text-[10px] text-slate-400 font-medium italic">
                              Note moyenne au bac pour les admis de cette formation: {f.note_moyenne.toFixed(2)}/20
                            </span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  {geoFilter.radius < 1000 && (
                    <Circle 
                      center={geoFilter.center} 
                      radius={geoFilter.radius * 1000} 
                      pathOptions={{ color: '#e30613', fillColor: '#e30613', fillOpacity: 0.1 }} 
                    />
                  )}
                </MapContainer>
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
                <text x="0" y="32" fontFamily="Arial, sans-serif" fontWeight="900" fontStyle="italic" fontSize="28" fill="currentColor">l'Étudiant</text>
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
