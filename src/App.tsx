import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getSupabase } from './lib/supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
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
import { Skeleton, CardSkeleton, TableSkeleton } from './components/Skeleton';
import { motion, AnimatePresence } from 'motion/react';

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

const createMarkerIcon = (colors: string[], count: number) => {
  if (count === 1) {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${colors[0]}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
  } else {
    const gradient = colors.length > 1 
      ? `conic-gradient(${colors.map((c, i) => `${c} ${i * (360/colors.length)}deg ${(i+1) * (360/colors.length)}deg`).join(', ')})`
      : colors[0];
      
    // Adjusted size for multiple formations (22px) and fixed centering
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background: ${gradient}; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 900; text-shadow: 0 1px 2px rgba(0,0,0,0.6);">${count}</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
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

import Header from './components/Header';

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
  const [bacType, setBacType] = useState<'general' | 'pro' | 'techno' | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Dashboard Filters
  const [filterAverage, setFilterAverage] = useState<string>('');
  
  // Phase tracking for sidebar guide
  const [activePhase, setActivePhase] = useState<1 | 2 | 3>(1);

  // Scroll spy for phase tracking
  useEffect(() => {
    if (!selectedSpecialty) return;

    const handleScroll = () => {
      const vh = window.innerHeight;
      const threshold = vh * 0.4; // 40% of viewport height

      // Check phases from bottom to top
      const p3 = document.getElementById('trigger-phase-3');
      const p2 = document.getElementById('trigger-phase-2');
      const p1 = document.getElementById('trigger-phase-1');

      if (p3 && p3.getBoundingClientRect().top < threshold) {
        setActivePhase(3);
      } else if (p2 && p2.getBoundingClientRect().top < threshold) {
        setActivePhase(2);
      } else if (p1) {
        setActivePhase(1);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedSpecialty]);
  
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

  // Step 1: Load unique specialties and all formation types using RPC
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = getSupabase();
      
      // Use RPCs for much faster data loading (Server-side DISTINCT)
      const [
        { data: specData, error: specError },
        { data: typeData, error: typeError },
        { data: cityData, error: cityError },
        { data: deptData, error: deptError }
      ] = await Promise.all([
        supabase.rpc('get_unique_specialties'),
        supabase.rpc('get_unique_formation_types'),
        supabase.rpc('get_unique_cities'),
        supabase.rpc('get_unique_departments')
      ]);

      if (specError) throw specError;
      if (typeError) throw typeError;
      if (cityError) throw cityError;
      if (deptError) throw deptError;

      if (specData) {
        const specs = specData.map((row: any) => row.spec);
        setSpecialties(specs);
        const individual = Array.from(new Set(
          specs.flatMap((s: string) => s.split(', ').map(part => part.trim()))
        )).sort();
        setIndividualSpecialties(individual);
      }

      if (typeData) {
        setAllFormationTypes(typeData.map((row: any) => row.filiere));
      }

      if (cityData) {
        setAllCities(cityData.map((row: any) => row.city));
      }

      if (deptData) {
        setAllDepartments(deptData.map((row: any) => row.dept));
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
            .neq('pct_admis_neo_gen', '0')
            .not('pct_admis_neo_gen', 'is', null)
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
    
    // Pre-fill formation types filter
    if (data.targetFormationTypes && data.targetFormationTypes.length > 0) {
      setGeoFilter(prev => ({
        ...prev,
        formationTypes: data.targetFormationTypes
      }));
    }
    
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
    if (geoFilter.formationTypes.length === 0) return [];
    
    let base = [...unfilteredMapFormations];
    base = base.filter(f => geoFilter.formationTypes.includes(f.filiere_generale));

    // Filter by City
    if (geoFilter.city) {
      base = base.filter(f => f.commune.toLowerCase().includes(geoFilter.city.toLowerCase()));
    }

    // Filter by Department (Exact match to avoid partial matches like "Ain" in "Ille-et-Vilaine")
    if (geoFilter.department) {
      base = base.filter(f => f.departement.toLowerCase() === geoFilter.department.toLowerCase());
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

  if (loading && !bacType) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 space-y-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <TableSkeleton />
        </div>
      </div>
    );
  }

  if (!bacType) {
    return <TrackSelection onSelect={setBacType} onboardingData={onboardingData} setOnboardingComplete={setOnboardingComplete} />;
  }

  if (bacType === 'pro') {
    return <ProPage onBack={() => setBacType(null)} onboardingData={onboardingData} setOnboardingComplete={setOnboardingComplete} />;
  }

  if (bacType === 'techno') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md bg-white p-12 rounded-[3rem] shadow-soft border border-slate-100"
        >
          <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-8 mx-auto">
            <Target className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Bac Technologique</h2>
          <p className="text-slate-500 font-medium mb-8">
            Cette section est en cours de préparation. Reviens bientôt pour découvrir les statistiques d'admission des séries technologiques !
          </p>
          <button 
            onClick={() => setBacType(null)}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
          >
            Retour à l'accueil
          </button>
        </motion.div>
      </div>
    );
  }

  if (!onboardingComplete) {
    return (
      <OnboardingQuestionnaire 
        onComplete={handleOnboardingComplete} 
        specialties={specialties}
        individualSpecialties={individualSpecialties}
        loadingSpecialties={loading}
        allFormationTypes={allFormationTypes}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary-light selection:text-primary">
      <Header onboardingData={onboardingData} setOnboardingComplete={setOnboardingComplete} onHome={() => setBacType(null)} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero / Selection */}
        <section className="mb-16 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1]">
              Trouve ta voie <span className="text-primary">après le bac</span>
            </h2>
            <p className="text-xl text-slate-500 mb-10 font-medium max-w-2xl mx-auto leading-relaxed">
              Analyse les statistiques d'admission basées sur tes enseignements de spécialité pour mieux préparer tes vœux Parcoursup.
            </p>
          </motion.div>
          
          <div className="relative max-w-2xl mx-auto">
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
                "block w-full pl-12 pr-10 py-5 text-lg border-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary sm:text-xl rounded-3xl bg-white shadow-2xl shadow-primary-light/30 transition-all placeholder:text-slate-400 font-medium",
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
          <div className="lg:grid lg:grid-cols-[80px_1fr] gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            {/* Sidebar Guide - Sticky Vertical Rail */}
            <aside className="hidden lg:block">
              <div className="sticky top-40 space-y-24">
                {/* Phase 1 */}
                <div 
                  className={cn(
                    "flex flex-col items-center cursor-pointer group transition-all duration-500",
                    activePhase === 1 ? "opacity-100" : "opacity-30 hover:opacity-100"
                  )}
                  onClick={() => document.getElementById('trigger-phase-1')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-primary transition-colors mb-6">
                    1. Infos d'accès
                  </div>
                  <div className={cn(
                    "w-1 h-12 rounded-full transition-all duration-700",
                    activePhase === 1 ? "bg-primary shadow-[0_0_15px_rgba(227,6,19,0.6)]" : "bg-slate-200"
                  )} />
                </div>

                {/* Phase 2 */}
                <div 
                  className={cn(
                    "flex flex-col items-center cursor-pointer group transition-all duration-500",
                    activePhase === 2 ? "opacity-100" : "opacity-30 hover:opacity-100"
                  )}
                  onClick={() => document.getElementById('trigger-phase-2')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-primary transition-colors mb-6">
                    2. Stats formations
                  </div>
                  <div className={cn(
                    "w-1 h-12 rounded-full transition-all duration-700",
                    activePhase === 2 ? "bg-primary shadow-[0_0_15px_rgba(227,6,19,0.6)]" : "bg-slate-200"
                  )} />
                </div>

                {/* Phase 3 */}
                <div 
                  className={cn(
                    "flex flex-col items-center cursor-pointer group transition-all duration-500",
                    activePhase === 3 ? "opacity-100" : "opacity-30 hover:opacity-100"
                  )}
                  onClick={() => document.getElementById('trigger-phase-3')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-primary transition-colors mb-6">
                    3. Cartographie
                  </div>
                  <div className={cn(
                    "w-1 h-12 rounded-full transition-all duration-700",
                    activePhase === 3 ? "bg-primary shadow-[0_0_15px_rgba(227,6,19,0.6)]" : "bg-slate-200"
                  )} />
                </div>
              </div>
            </aside>

            <div className="space-y-8 relative">
              <div id="trigger-phase-1" className="absolute top-0 h-1 w-full -z-10" />
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

            {/* Phase 2: Stats */}
            <div 
              className={cn(
                "scroll-mt-32 transition-all duration-1000 relative",
                activePhase < 2 && "grayscale opacity-40 blur-[2px] pointer-events-none"
              )}
            >
              <div id="trigger-phase-2" className="absolute top-0 h-1 w-full -z-10" />
              {onboardingData && (
                <StatsPanel 
                  data={mapFormations} 
                  userNote={parseFloat(onboardingData.averageBac)}
                  selectedDepartment={geoFilter.department || undefined}
                  selectedCity={geoFilter.city || undefined}
                  selectedFormations={geoFilter.formationTypes}
                  allDataOfSameType={unfilteredMapFormations}
                  allFormationTypes={allFormationTypes}
                  allCities={allCities}
                  allDepartments={allDepartments}
                  onFilterChange={(filters) => setGeoFilter(prev => ({ ...prev, ...filters }))}
                  pageType="general"
                />
              )}
              {/* This trigger activates Phase 3 near the end of Phase 2 (Key Takeaways) */}
              <div id="trigger-phase-3" className="absolute bottom-32 h-1 w-full -z-10" />
            </div>

            {/* Phase 3: Cartographie */}
            <div 
              className={cn(
                "scroll-mt-32 transition-all duration-1000 relative",
                activePhase < 3 && "grayscale opacity-40 blur-[2px] pointer-events-none"
              )}
            >
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">
                <div className="p-6 border-b border-slate-100">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Cartographie de la formation en France</h3>
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
                        icon={createMarkerIcon(group.colors, group.formations.length)}
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
              </div>
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
      {description && (
        <p className="text-slate-500 text-xs leading-relaxed">{description}</p>
      )}
    </div>
  );
}
