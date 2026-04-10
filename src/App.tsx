import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Navigation,
  Bell
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import OnboardingQuestionnaire, { OnboardingData } from './components/OnboardingQuestionnaire';
import StatsPanel from './components/StatsPanel';
import TrackSelection from './components/TrackSelection';
import ProPage from './components/ProPage';

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

const createMarkerIcon = (colors: string[]) => {
  if (colors.length === 1) {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${colors[0]}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
  } else {
    const gradient = `conic-gradient(${colors.map((c, i) => `${c} ${i * (360/colors.length)}deg ${(i+1) * (360/colors.length)}deg`).join(', ')})`;
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background: ${gradient}; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
  }
};

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
  eff_admis_neo?: number;
  capacite: number;
  taux_acces: number | null;
  note_moyenne: number | null;
  selectivite: string;
  pct_admis_neo_gen: number;
  pct_admis_neo_techno: number;
  pct_admis_neo_pro: number;
  lien_parcoursup?: string;
  pct_boursiers?: number;
  pct_admis_neo_boursiers?: number;
  eff_admis_boursiers_neo?: number;
  pct_admises_filles?: number;
  pct_admis_neo_sans_mention?: number;
  pct_admis_neo_mention_ab?: number;
  pct_admis_neo_mention_b?: number;
  pct_admis_neo_mention_tb?: number;
  pct_admis_neo_mention_tbf?: number;
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
  const [mapSpecificData, setMapSpecificData] = useState<Parcoursup2Data[]>([]);
  const [allFormationTypes, setAllFormationTypes] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [individualSpecialties, setIndividualSpecialties] = useState<string[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [bacType, setBacType] = useState<'general' | 'pro' | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Dashboard Filters
  const [filterAverage, setFilterAverage] = useState<string>('');
  
  // Table Filters & Sorting
  const [tableFilterMetric, setTableFilterMetric] = useState<'voeux' | 'admissions' | 'taux'>('voeux');
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'voeux' | 'admissions' | 'taux', direction: 'asc' | 'desc' }>({
    key: 'voeux',
    direction: 'desc'
  });

  // Map & Geo Filters
  const [geoFilter, setGeoFilter] = useState({
    city: '',
    department: '',
    formationTypes: [] as string[],
    radius: 1000, // km (France entière par défaut)
    center: [46.603354, 1.888334] as [number, number] // France center
  });

  const [showFormationSuggestions, setShowFormationSuggestions] = useState(false);

  // Dynamic Color Mapping based on all loaded formation types
  const typeColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    allFormationTypes.forEach((type, index) => {
      // Spread colors evenly across the hue spectrum (360 degrees)
      const hue = (index * 360) / Math.max(1, allFormationTypes.length);
      // Use consistent saturation and lightness for a professional look
      map[type] = `hsl(${hue}, 75%, 45%)`;
    });
    return map;
  }, [allFormationTypes]);

  const getFormationColor = useCallback((type: string) => {
    return typeColorMap[type] || '#64748b';
  }, [typeColorMap]);

  const [allCities, setAllCities] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [allDepartments, setAllDepartments] = useState<string[]>([]);
  const [showDeptSuggestions, setShowDeptSuggestions] = useState(false);

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

  // Step 1: Load unique specialties and all formation types
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = getSupabase();
      
      // Load Specialties
      const { data: specData, error: specError } = await supabase
        .from('parcoursup_1')
        .select('specialites');

      if (specError) throw specError;

      if (specData) {
        const uniqueSpecs = Array.from(new Set(specData.map(row => row.specialites)))
          .filter(Boolean)
          .sort() as string[];
        
        setSpecialties(uniqueSpecs);
        
        // Extract individual specialties from combinations
        const individual = Array.from(new Set(
          uniqueSpecs.flatMap(s => s.split(', ').map(part => part.trim()))
        )).sort();
        setIndividualSpecialties(individual);
      }

      // Load All Formation Types for the map
      const { data: typeData, error: typeError } = await supabase
        .from('parcoursup_2')
        .select('filiere_generale');

      if (!typeError && typeData) {
        const uniqueTypes = Array.from(new Set(typeData.map(row => row.filiere_generale)))
          .filter(Boolean)
          .sort() as string[];
        setAllFormationTypes(uniqueTypes);
      }

      // Load All Cities for the map filter
      const { data: cityData, error: cityError } = await supabase
        .from('parcoursup_2')
        .select('commune');

      if (!cityError && cityData) {
        const uniqueCities = Array.from(new Set(cityData.map(row => row.commune)))
          .filter(Boolean)
          .sort() as string[];
        setAllCities(uniqueCities);
      }

      // Load All Departments for the map filter
      const { data: deptData, error: deptError } = await supabase
        .from('parcoursup_2')
        .select('departement');

      if (!deptError && deptData) {
        const uniqueDepts = Array.from(new Set(deptData.map(row => row.departement)))
          .filter(Boolean)
          .sort() as string[];
        setAllDepartments(uniqueDepts);
      }
    } catch (err: any) {
      console.error('Error loading initial data:', err);
      setError("Erreur lors du chargement des données initiales.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Step 2: Load map specific data when formation types change
  useEffect(() => {
    const loadMapData = async () => {
      if (geoFilter.formationTypes.length === 0) {
        setMapSpecificData([]);
        return;
      }
      
      try {
        const supabase = getSupabase();
        let allP2Data: any[] = [];
        let from = 0;
        const PAGE_SIZE = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from('parcoursup_2')
            .select('*')
            .in('filiere_generale', geoFilter.formationTypes)
            .range(from, from + PAGE_SIZE - 1);
          
          if (error) throw error;
          if (data && data.length > 0) {
            allP2Data = [...allP2Data, ...data];
            if (data.length < PAGE_SIZE) {
              hasMore = false;
            } else {
              from += PAGE_SIZE;
            }
          } else {
            hasMore = false;
          }
        }

        if (allP2Data.length > 0) {
            setMapSpecificData(allP2Data.map(row => ({
              filiere_generale: row.filiere_generale || "",
              filiere_formation: row.filiere_formation || "",
              etablissement: row.etablissement || "",
              commune: row.commune || "",
              departement: row.departement || "",
              region: row.region || "",
              coordonnees_gps: row.coordonnees_gps || "",
              eff_admis: Number(row.eff_admis || 0),
              eff_admis_neo: Number(row.eff_admis_neo || 0),
              capacite: Number(row.capacite || 0),
              taux_acces: (row.taux_acces === "nd" || row.taux_acces === null || row.taux_acces === "") ? null : parseFloat(row.taux_acces),
              note_moyenne: (row.note_moyenne === null || row.note_moyenne === "" || isNaN(Number(row.note_moyenne))) ? null : Number(row.note_moyenne),
              selectivite: row.selectivite || "",
              pct_admis_neo_gen: Number(row["pct_admis_neo_gen"] || 0),
              pct_admis_neo_techno: Number(row["pct_admis_neo_techno"] || 0),
              pct_admis_neo_pro: Number(row["pct_admis_neo_pro"] || 0),
              lien_parcoursup: row.lien_parcoursup || "",
              pct_boursiers: Number(row.pct_boursiers || 0),
              pct_admis_neo_boursiers: Number(row.pct_admis_neo_boursiers || 0),
              eff_admis_boursiers_neo: Number(row.eff_admis_boursiers_neo || 0),
              pct_admises_filles: Number(row.pct_admises_filles || 0),
              pct_admis_neo_sans_mention: Number(row.pct_admis_neo_sans_mention || 0),
              pct_admis_neo_mention_ab: Number(row.pct_admis_neo_mention_ab || 0),
              pct_admis_neo_mention_b: Number(row.pct_admis_neo_mention_b || 0),
              pct_admis_neo_mention_tb: Number(row.pct_admis_neo_mention_tb || 0),
              pct_admis_neo_mention_tbf: Number(row.pct_admis_neo_mention_tbf || 0),
            })));
        }
      } catch (err) {
        console.error("Error loading map data:", err);
      }
    };
    
    loadMapData();
  }, [geoFilter.formationTypes]);

  useEffect(() => {
    const loadSpecialtyData = async () => {
      if (!selectedSpecialty) return;

      try {
        setLoadingDetails(true);
        const supabase = getSupabase();
        
        // Fetch from parcoursup_1
        let allOrientationData: any[] = [];
        let from = 0;
        const PAGE_SIZE = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from('parcoursup_1')
            .select('*')
            .eq('specialites', selectedSpecialty)
            .range(from, from + PAGE_SIZE - 1);
          
          if (error) throw error;
          if (data && data.length > 0) {
            allOrientationData = [...allOrientationData, ...data];
            if (data.length < PAGE_SIZE) {
              hasMore = false;
            } else {
              from += PAGE_SIZE;
            }
          } else {
            hasMore = false;
          }
        }

        if (allOrientationData.length > 0) {
          const mappedData = mapSupabaseData(allOrientationData);
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
    if (data.specialty) {
      setSelectedSpecialty(data.specialty);
      setSearchQuery(data.specialty);
    }
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

  const baseFormations = useMemo(() => {
    return filteredData
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
  }, [filteredData]);

  const formationsData = useMemo(() => {
    // Sort by the chosen metric for "Top 10"
    const sortedByMetric = [...baseFormations].sort((a, b) => b[tableFilterMetric] - a[tableFilterMetric]);
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
  }, [baseFormations, sortConfig, tableFilterMetric]);

  const unfilteredMapFormations = useMemo(() => {
    return mapSpecificData;
  }, [mapSpecificData]);

  const mapFormations = useMemo(() => {
    let base = [...unfilteredMapFormations];

    // Filter by Formation Types (only if explicitly selected in map filter)
    if (geoFilter.formationTypes.length > 0) {
      base = base.filter(f => geoFilter.formationTypes.includes(f.filiere_generale));
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
  }, [unfilteredMapFormations, geoFilter]);

  const groupedMapFormations = useMemo(() => {
    const groups = new Map<string, (Parcoursup2Data & { position: [number, number] })[]>();
    
    mapFormations.forEach(f => {
      const key = f.coordonnees_gps;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(f as any);
    });
    
    return Array.from(groups.values()).map(group => {
      const types = Array.from(new Set(group.map(f => f.filiere_generale)));
      return {
        formations: group,
        types,
        position: group[0].position,
        colors: types.map(t => getFormationColor(t))
      };
    });
  }, [mapFormations, getFormationColor]);

  const formationTypes = useMemo(() => {
    return allFormationTypes;
  }, [allFormationTypes]);

  const filteredCities = useMemo(() => {
    if (!geoFilter.city) return allCities.slice(0, 10);
    return allCities
      .filter(c => c.toLowerCase().includes(geoFilter.city.toLowerCase()))
      .slice(0, 10);
  }, [allCities, geoFilter.city]);

  const filteredDepts = useMemo(() => {
    if (!geoFilter.department) return allDepartments.slice(0, 10);
    return allDepartments
      .filter(d => d.toLowerCase().includes(geoFilter.department.toLowerCase()))
      .slice(0, 10);
  }, [allDepartments, geoFilter.department]);

  const globalStats = useMemo(() => {
    if (baseFormations.length === 0) return null;

    const voeux = baseFormations.reduce((acc, curr) => acc + curr.voeux, 0);
    const admissions = baseFormations.reduce((acc, curr) => acc + curr.admissions, 0);
    const taux = voeux > 0 ? Math.round((admissions / voeux) * 100) : 0;

    return {
      voeux,
      admissions,
      taux
    };
  }, [baseFormations]);

  const top10ByVoeux = useMemo(() => {
    return [...baseFormations].sort((a, b) => b.voeux - a.voeux).slice(0, 10);
  }, [baseFormations]);

  const top10ByTaux = useMemo(() => {
    return [...baseFormations].sort((a, b) => b.taux - a.taux).slice(0, 10);
  }, [baseFormations]);

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

  if (!bacType) {
    return <TrackSelection onSelect={setBacType} />;
  }

  if (bacType === 'pro') {
    return <ProPage onBack={() => setBacType(null)} />;
  }

  if (!onboardingComplete) {
    return (
      <OnboardingQuestionnaire 
        onComplete={handleOnboardingComplete} 
        specialties={specialties}
        individualSpecialties={individualSpecialties}
        loadingSpecialties={loading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary-light selection:text-primary">
      {/* Header */}
<header className="bg-primary sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* --- LIGNE HAUT : Logo et Actions --- */}
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img 
                src="/Logo.png" 
                alt="Logo l'Étudiant" 
                className="h-8 w-auto object-contain brightness-0 invert" 
              />
            </div>
            
            {/* Actions Droite */}
            <div className="flex items-center gap-5">
              <button className="text-white hover:text-white/80 transition-colors">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button className="text-white hover:text-white/80 transition-colors">
                <Search className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <div className="hidden sm:block w-px h-6 bg-white/30"></div> {/* Séparateur vertical */}

              {/* Vos données onboarding (conservées) */}
              {onboardingData && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full border border-white/30 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">
                    {onboardingData.academy}
                  </span>
                </div>
              )}
              
              {/* Votre bouton profil (adapté pour ressembler à un avatar/bouton d'action) */}
              <button 
                onClick={() => setOnboardingComplete(false)}
                className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-full sm:rounded-xl border border-white/20 transition-all text-sm font-bold shadow-sm"
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Profil</span>
              </button>
            </div>
          </div>

          {/* --- LIGNE BAS : Navigation --- */}
          <nav className="flex items-center gap-6 pb-3 overflow-x-auto no-scrollbar">
            <a href="#" className="text-white font-bold text-[14px] sm:text-[15px] hover:underline whitespace-nowrap">Salons</a>
            
            <button className="flex items-center gap-1 text-white font-bold text-[14px] sm:text-[15px] hover:underline whitespace-nowrap">
              Orientation <ChevronDown className="w-4 h-4" />
            </button>
            
            <button className="flex items-center gap-1 text-white font-bold text-[14px] sm:text-[15px] hover:underline whitespace-nowrap">
              Révisions / Examens <ChevronDown className="w-4 h-4" />
            </button>
            
            <button className="flex items-center gap-1 text-white font-bold text-[14px] sm:text-[15px] hover:underline whitespace-nowrap">
              Métiers <ChevronDown className="w-4 h-4" />
            </button>
            
            <button className="flex items-center gap-1 text-white font-bold text-[14px] sm:text-[15px] hover:underline whitespace-nowrap">
              Vie étudiante <ChevronDown className="w-4 h-4" />
            </button>
            
            <button className="flex items-center gap-1 text-white font-bold text-[14px] sm:text-[15px] hover:underline whitespace-nowrap">
              Jobs, stages, alternance <ChevronDown className="w-4 h-4" />
            </button>
            
            <a href="#" className="text-white font-bold text-[14px] sm:text-[15px] hover:underline whitespace-nowrap">EducPros</a>
          </nav>
        </div>

        {/* --- LIGNE MULTICOLORE (Design signature l'Étudiant) --- */}
        <div className="h-1 w-full flex">
          <div className="h-full flex-1 bg-pink-500"></div>
          <div className="h-full flex-1 bg-yellow-400"></div>
          <div className="h-full flex-1 bg-green-500"></div>
          <div className="h-full flex-1 bg-blue-500"></div>
          <div className="h-full flex-1 bg-orange-500"></div>
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

              {(filterAverage !== onboardingData?.averageBac) && (
                <button 
                  onClick={() => {
                    setFilterAverage(onboardingData?.averageBac || '');
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
                title="Total du nombre de vœux confirmés pour ce profil" 
                value={globalStats ? globalStats.voeux.toLocaleString() : '0'} 
                icon={<Users className="w-6 h-6 text-blue-600" />}
                description=""
                color="blue"
              />
              <StatCard 
                title="Total des propositions d'admission reçues pour ce profil" 
                value={globalStats ? globalStats.admissions.toLocaleString() : '0'} 
                icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
                description=""
                color="emerald"
              />
              <StatCard 
                title="Accessibilité des formations" 
                value={globalStats ? `${globalStats.taux}%` : '0%'} 
                icon={<TrendingUp className="w-6 h-6 text-primary" />}
                description="En moyenne, voici la probabilité qu'un seul de tes vœux soit accepté. N'oublie pas : plus tu fais de vœux, plus tu augmentes tes chances d'être pris quelque part !"
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
                    Top 10 des Formations Demandées
                  </h3>
                  <Info className="w-4 h-4 text-slate-400 cursor-help" />
                </div>
                <div className="h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={top10ByVoeux} layout="vertical" margin={{ left: 40, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={120} 
                        tick={{ fontSize: 11, fill: '#64748b' }}
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
                        barSize={24}
                        name="Nombre de vœux"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart: Access Rates by Field */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Top 10 : Taux d'Accès par Filière
                  </h3>
                  <Info className="w-4 h-4 text-slate-400 cursor-help" />
                </div>
                <div className="h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={top10ByTaux} layout="vertical" margin={{ left: 40, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={120} 
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`${value}%`, 'Taux d\'accès']}
                      />
                      <Bar 
                        dataKey="taux" 
                        fill="#10b981" 
                        radius={[0, 8, 8, 0]} 
                        barSize={24}
                        name="Taux d'accès"
                      />
                    </BarChart>
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
                        onClick={() => {
                          setTableFilterMetric(metric);
                          handleSort(metric); // Also trigger sorting by this metric
                        }}
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
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th 
                        className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group/header"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Formation 
                          <div className={cn("transition-opacity", sortConfig.key === 'name' ? "opacity-100" : "opacity-0 group-hover/header:opacity-50")}>
                            <SortIcon column="name" />
                            {sortConfig.key !== 'name' && <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:bg-slate-100 transition-colors group/header"
                        onClick={() => handleSort('voeux')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Vœux 
                          <div className={cn("transition-opacity", sortConfig.key === 'voeux' ? "opacity-100" : "opacity-0 group-hover/header:opacity-50")}>
                            <SortIcon column="voeux" />
                            {sortConfig.key !== 'voeux' && <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:bg-slate-100 transition-colors group/header"
                        onClick={() => handleSort('admissions')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Admissions 
                          <div className={cn("transition-opacity", sortConfig.key === 'admissions' ? "opacity-100" : "opacity-0 group-hover/header:opacity-50")}>
                            <SortIcon column="admissions" />
                            {sortConfig.key !== 'admissions' && <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:bg-slate-100 transition-colors group/header"
                        onClick={() => handleSort('taux')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Taux d'accès 
                          <div className={cn("transition-opacity", sortConfig.key === 'taux' ? "opacity-100" : "opacity-0 group-hover/header:opacity-50")}>
                            <SortIcon column="taux" />
                            {sortConfig.key !== 'taux' && <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formationsData.map((item, idx) => {
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
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
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">
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
                      {(geoFilter.city || geoFilter.department || geoFilter.formationTypes.length > 0 || geoFilter.radius !== 1000) && (
                        <button 
                          onClick={() => setGeoFilter({
                            city: '',
                            department: '',
                            formationTypes: [],
                            radius: 1000,
                            center: geoFilter.center
                          })}
                          className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                        >
                          Réinitialiser filtres
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
              </div>

              <div className="h-[550px] w-full relative z-0 overflow-hidden">
                {geoFilter.formationTypes.length === 0 ? (
                  <div className="absolute inset-0 z-10 bg-slate-900/5 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-sm">
                      <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-primary" />
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 mb-2">Prêt à explorer ?</h4>
                      <p className="text-sm text-slate-500 mb-6">
                        Sélectionne un ou plusieurs types de formation dans le filtre ci-dessous pour les voir sur la carte.
                      </p>
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => setShowFormationSuggestions(true)}
                          className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors"
                        >
                          Choisir des formations
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
                  {groupedMapFormations.map((group, idx) => (
                    <Marker 
                      key={idx} 
                      position={group.position}
                      icon={createMarkerIcon(group.colors)}
                    >
                      <Popup minWidth={250} maxWidth={320}>
                        <div className="max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                          {group.formations.map((f, fIdx) => (
                            <div key={fIdx} className={cn("p-1", fIdx > 0 && "mt-4 pt-4 border-t border-slate-200")}>
                              {group.formations.length > 1 && (
                                <div className="flex items-center justify-between mb-2">
                                  <span className="px-1.5 py-0.5 bg-primary-light text-primary text-[9px] font-bold rounded uppercase">
                                    Formation {fIdx + 1}/{group.formations.length}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-bold uppercase">ID: {f.etablissement.slice(0,3)}...</span>
                                </div>
                              )}
                              <div className="flex items-start gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: getFormationColor(f.filiere_generale) }} />
                                <h4 className="font-bold text-slate-900 text-sm">{f.etablissement}</h4>
                              </div>
                              <p className="text-xs text-slate-500 mb-1 leading-relaxed">{f.filiere_formation}</p>
                              <p className="text-xs font-medium text-primary-dark mb-1">{f.selectivite}</p>
                              <p className="text-xs text-slate-500 mb-2">{f.commune} ({f.departement})</p>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-slate-50 p-2 rounded-lg">
                                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Taux Accès</span>
                                  <span className="text-sm font-bold text-primary">
                                    {f.taux_acces !== null ? `${f.taux_acces}%` : "Inconnu"}
                                  </span>
                                </div>
                                <div className="bg-slate-50 p-2 rounded-lg">
                                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Capacité</span>
                                  <span className="text-sm font-bold text-slate-700">{f.capacite}</span>
                                </div>
                              </div>
                              
                              <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-2">
                                <span className="text-[10px] text-slate-400 font-medium italic leading-tight block">
                                  Note moyenne au bac pour les admis: {f.note_moyenne !== null ? `${f.note_moyenne.toFixed(2)}/20` : "N/A"}
                                </span>
                                <span className="text-[10px] text-emerald-600 font-bold block">
                                  Part de boursiers: {f.pct_admis_neo_boursiers !== undefined ? `${f.pct_admis_neo_boursiers}%` : "N/A"}
                                </span>
                                {f.lien_parcoursup && (
                                  <a 
                                    href={f.lien_parcoursup} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-black text-primary hover:underline flex items-center gap-1 uppercase tracking-wider"
                                  >
                                    Voir sur Parcoursup <ArrowRight className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
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

              <div className="p-8 border-t border-slate-100 bg-slate-50/30 rounded-b-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Search className="w-3 h-3" /> Type de formation
                    </label>
                    <div className="relative">
                      <button 
                        onClick={() => setShowFormationSuggestions(!showFormationSuggestions)}
                        className="w-full text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none shadow-sm flex items-center justify-between"
                      >
                        <span className="truncate">
                          {geoFilter.formationTypes.length === 0 
                            ? "Aucune sélectionnée" 
                            : `${geoFilter.formationTypes.length} sélectionnée(s)`}
                        </span>
                        <ChevronDown className={cn("w-4 h-4 transition-transform", showFormationSuggestions && "rotate-180")} />
                      </button>
                      
                      {showFormationSuggestions && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowFormationSuggestions(false)} />
                          <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {formationTypes.map((type, i) => {
                              const isSelected = geoFilter.formationTypes.includes(type);
                              const color = getFormationColor(type);
                              return (
                                <label 
                                  key={i} 
                                  className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                                    isSelected ? "bg-slate-50" : "hover:bg-slate-50/50"
                                  )}
                                >
                                  <input 
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      setGeoFilter(prev => ({
                                        ...prev,
                                        formationTypes: isSelected 
                                          ? prev.formationTypes.filter(t => t !== type)
                                          : [...prev.formationTypes, type]
                                      }));
                                    }}
                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                  />
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                  <span className="text-sm text-slate-600 font-medium">{type}</span>
                                </label>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3 h-3" /> Ville
                    </label>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Ex: Paris, Lyon..."
                        value={geoFilter.city}
                        onChange={(e) => {
                          const newCity = e.target.value;
                          setGeoFilter(prev => ({ 
                            ...prev, 
                            city: newCity,
                            radius: newCity ? 1000 : prev.radius 
                          }));
                          setShowCitySuggestions(true);
                        }}
                        onFocus={() => setShowCitySuggestions(true)}
                        className="w-full text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none shadow-sm"
                      />
                      <button 
                        onClick={() => setShowCitySuggestions(!showCitySuggestions)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <ChevronDown className={cn("w-4 h-4 transition-transform", showCitySuggestions && "rotate-180")} />
                      </button>
                    </div>
                    
                    {showCitySuggestions && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowCitySuggestions(false)} />
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto custom-scrollbar overflow-x-hidden">
                          {filteredCities.length > 0 ? (
                            filteredCities.map((city, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setGeoFilter(prev => ({ ...prev, city, radius: 1000 }));
                                  setShowCitySuggestions(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors flex items-center gap-2"
                              >
                                <MapPin className="w-3 h-3 text-slate-300" />
                                {city}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-xs text-slate-400 italic">Aucune ville trouvée</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> Département
                    </label>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Ex: Paris, Haute-Garonne..."
                        value={geoFilter.department}
                        onChange={(e) => {
                          const newDept = e.target.value;
                          setGeoFilter(prev => ({ 
                            ...prev, 
                            department: newDept,
                            radius: newDept ? 1000 : prev.radius
                          }));
                          setShowDeptSuggestions(true);
                        }}
                        onFocus={() => setShowDeptSuggestions(true)}
                        className="w-full text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none shadow-sm"
                      />
                      <button 
                        onClick={() => setShowDeptSuggestions(!showDeptSuggestions)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <ChevronDown className={cn("w-4 h-4 transition-transform", showDeptSuggestions && "rotate-180")} />
                      </button>
                    </div>
                    
                    {showDeptSuggestions && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowDeptSuggestions(false)} />
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto custom-scrollbar overflow-x-hidden">
                          {filteredDepts.length > 0 ? (
                            filteredDepts.map((dept, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setGeoFilter(prev => ({ ...prev, department: dept, radius: 1000 }));
                                  setShowDeptSuggestions(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors flex items-center gap-2"
                              >
                                <MapPin className="w-3 h-3 text-slate-300" />
                                {dept}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-xs text-slate-400 italic">Aucun département trouvé</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Navigation className="w-3 h-3" /> Rayon de recherche
                    </label>
                    <select 
                      value={geoFilter.radius}
                      onChange={(e) => {
                        const newRadius = Number(e.target.value);
                        setGeoFilter(prev => ({ 
                          ...prev, 
                          radius: newRadius,
                          city: newRadius < 1000 ? '' : prev.city,
                          department: newRadius < 1000 ? '' : prev.department
                        }));
                      }}
                      className="w-full text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none cursor-pointer shadow-sm"
                    >
                      <option value={10}>10 km (Proximité immédiate)</option>
                      <option value={30}>30 km (Zone urbaine)</option>
                      <option value={100}>100 km (Rayon régional)</option>
                      <option value={250}>250 km (Grand secteur)</option>
                      <option value={1000}>France entière (Pas de limite)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Panel Section */}
            {onboardingData && (
              <StatsPanel 
                data={mapFormations} 
                userNote={parseFloat(onboardingData.averageBac)}
                selectedDepartment={geoFilter.department || undefined}
                allDataOfSameType={unfilteredMapFormations}
              />
            )}
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
      {description && (
        <p className="text-slate-500 text-xs leading-relaxed">{description}</p>
      )}
    </div>
  );
}
