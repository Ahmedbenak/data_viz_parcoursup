import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Briefcase, 
  ArrowLeft, 
  TrendingUp, 
  GraduationCap, 
  Users, 
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Map as MapIcon,
  Info,
  ExternalLink,
  ChevronRight,
  MapPin,
  Target,
  Search,
  Navigation,
  ChevronDown,
  ArrowRight,
  Building2,
  X
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
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
import { getSupabase } from '../lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import StatsPanel from './StatsPanel';

import { OnboardingData } from './OnboardingQuestionnaire';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

interface ProPageProps {
  onBack: () => void;
  onboardingData?: OnboardingData | null;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ProPage({ onBack, onboardingData }: ProPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [rawFineData, setRawFineData] = useState<any[]>([]);
  const [rawEvolData, setRawEvolData] = useState<any[]>([]);
  const [proData, setProData] = useState<any[]>([]);
  const [trajectoryData, setTrajectoryData] = useState<any[]>([]);
  const [outcomeData, setOutcomeData] = useState<any[]>([]);
  const [topFormations, setTopFormations] = useState<any[]>([]);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    avgEmployment: 0,
    avgStudies: 0,
    totalFormations: 0
  });

  // Bac Pro Selection states
  const [selectedBacPro, setSelectedBacPro] = useState<string>('');
  const [allBacPros, setAllBacPros] = useState<string[]>([]);
  const [showBacProSuggestions, setShowBacProSuggestions] = useState(false);

  // Map states
  const [mapData, setMapData] = useState<any[]>([]);
  const [allCities, setAllCities] = useState<string[]>([]);
  const [allDepartments, setAllDepartments] = useState<string[]>([]);
  const [allFormationTypes, setAllFormationTypes] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showDeptSuggestions, setShowDeptSuggestions] = useState(false);
  const [showFormationSuggestions, setShowFormationSuggestions] = useState(false);
  const [geoFilter, setGeoFilter] = useState({
    center: [46.603354, 1.888334] as [number, number],
    radius: 1000,
    city: '',
    department: '',
    formationTypes: [] as string[]
  });

  // Dynamic Color Mapping based on all loaded formation types
  const typeColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    allFormationTypes.forEach((type, index) => {
      const hue = (index * 360) / Math.max(1, allFormationTypes.length);
      map[type] = `hsl(${hue}, 75%, 45%)`;
    });
    return map;
  }, [allFormationTypes]);

  const getFormationColor = useCallback((type: string) => {
    return typeColorMap[type] || '#64748b';
  }, [typeColorMap]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const supabase = getSupabase();
        const currentYear = 'cumul 2023-2024';

        // 1. Fetch global stats from parcoursup_pro
        const { data: proData, error: proError } = await supabase
          .from('parcoursup_pro')
          .select('taux_emploi_6mois, devenir_part_poursuite_etudes')
          .eq('annee', currentYear)
          .eq('dont_apprentis_eple', 'ensemble');

        // 2. Fetch data for Trajectory and Outcomes (Bac Pro, current year)
        const { data: fineData, error: fineError } = await supabase
          .from('parcoursup_fine_clean')
          .select('*')
          .eq('annee', currentYear)
          .eq('type_diplome', 'BAC PRO');

        if (fineError) throw fineError;

        if (fineData && fineData.length > 0) {
          setRawFineData(fineData);
        }

        // 3. Fetch Evolution Data
        const { data: evolData, error: evolError } = await supabase
          .from('parcoursup_fine_clean')
          .select('annee, taux_emploi_6mois, libelle_formation')
          .eq('type_diplome', 'BAC PRO');

        if (evolData && evolData.length > 0) {
          setRawEvolData(evolData);
        }

        if (proData) {
          setProData(proData);
        }

        // 4. Fetch Map Filter Options (Cities, Departments, Types)
        const { data: cityData, error: cityError } = await supabase
          .from('parcoursup_2')
          .select('commune');
        if (!cityError && cityData) {
          setAllCities(Array.from(new Set(cityData.map(f => f.commune))).filter(Boolean).sort() as string[]);
        }

        const { data: deptData, error: deptError } = await supabase
          .from('parcoursup_2')
          .select('departement');
        if (!deptError && deptData) {
          setAllDepartments(Array.from(new Set(deptData.map(f => f.departement))).filter(Boolean).sort() as string[]);
        }

        const { data: typeData, error: typeError } = await supabase
          .from('parcoursup_2')
          .select('filiere_generale');
        if (!typeError && typeData) {
          setAllFormationTypes(Array.from(new Set(typeData.map(f => f.filiere_generale))).filter(Boolean).sort() as string[]);
        }

        // 5. Fetch all unique Bac Pro formations
        const { data: bacProList, error: bacProError } = await supabase
          .from('parcoursup_fine_clean')
          .select('libelle_formation')
          .eq('type_diplome', 'BAC PRO');
        
        if (!bacProError && bacProList) {
          const uniqueBacPros = Array.from(new Set(bacProList.map(b => b.libelle_formation)))
            .filter(Boolean)
            .sort() as string[];
          setAllBacPros(uniqueBacPros);
        }

      } catch (err: any) {
        console.error('Error fetching Pro data:', err);
        setError("Impossible de charger les données statistiques.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Process data when raw data or selectedBacPro changes
  useEffect(() => {
    if (rawFineData.length === 0) return;

    let filteredFine = rawFineData;
    let filteredEvol = rawEvolData;

    if (selectedBacPro) {
      filteredFine = rawFineData.filter(d => d.libelle_formation === selectedBacPro);
      filteredEvol = rawEvolData.filter(d => d.libelle_formation === selectedBacPro);
    }

    // Calculate Trajectory
    const trajectory = [
      { name: '6 mois', value: calculateAvg(filteredFine, 'taux_emploi_6mois') },
      { name: '12 mois', value: calculateAvg(filteredFine, 'taux_emploi_12mois') },
      { name: '18 mois', value: calculateAvg(filteredFine, 'taux_emploi_18mois') },
      { name: '24 mois', value: calculateAvg(filteredFine, 'taux_emploi_24mois') },
    ].filter(d => d.value !== null);
    setTrajectoryData(trajectory);

    // Calculate Outcomes
    const outcomes = [
      { name: 'Emploi', value: calculateAvg(filteredFine, 'devenir_part_emploi_6mois') },
      { name: 'Études', value: calculateAvg(filteredFine, 'devenir_part_poursuite_etudes') },
      { name: 'Autre', value: calculateAvg(filteredFine, 'devenir_part_autre_situation_6mois') },
    ].filter(d => d.value !== null);
    setOutcomeData(outcomes);

    // Top Formations (Always show top 10 from all Bac Pros for context, unless selectedBacPro is set)
    // Actually, if selectedBacPro is set, maybe we show top 10 similar ones? 
    // For now, let's keep Top 10 as global context if no selection, or just the selection if selected.
    const formationGroups: { [key: string]: { sum: number, count: number } } = {};
    const dataForTop = selectedBacPro ? filteredFine : rawFineData;
    dataForTop.forEach(item => {
      const val = parseNumeric(item.taux_emploi_6mois);
      if (val !== null && item.libelle_formation) {
        const name = item.libelle_formation.charAt(0).toUpperCase() + item.libelle_formation.slice(1);
        if (!formationGroups[name]) formationGroups[name] = { sum: 0, count: 0 };
        formationGroups[name].sum += val;
        formationGroups[name].count += 1;
      }
    });

    const top = Object.entries(formationGroups)
      .map(([name, data]) => ({
        name,
        value: Math.round((data.sum / data.count) * 10) / 10
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    setTopFormations(top);

    // Global Stats
    setStats({
      avgEmployment: (proData && proData.length > 0 && !selectedBacPro) 
        ? (calculateAvg(proData, 'taux_emploi_6mois') || calculateAvg(filteredFine, 'taux_emploi_6mois') || 0)
        : (calculateAvg(filteredFine, 'taux_emploi_6mois') || 0),
      avgStudies: (proData && proData.length > 0 && !selectedBacPro)
        ? (calculateAvg(proData, 'devenir_part_poursuite_etudes') || calculateAvg(filteredFine, 'devenir_part_poursuite_etudes') || 0)
        : (calculateAvg(filteredFine, 'devenir_part_poursuite_etudes') || 0),
      totalFormations: selectedBacPro ? 1 : new Set(rawFineData.map(d => d.libelle_formation)).size
    });

    // Evolution Data
    if (filteredEvol.length > 0) {
      const yearOrder = [
        'cumul 2018-2019', 'cumul 2019-2020', 'cumul 2020-2021',
        'cumul 2021-2022', 'cumul 2022-2023', 'cumul 2023-2024'
      ];
      const yearGroups: { [key: string]: { sum: number, count: number } } = {};
      filteredEvol.forEach(item => {
        const val = parseNumeric(item.taux_emploi_6mois);
        if (val !== null) {
          if (!yearGroups[item.annee]) yearGroups[item.annee] = { sum: 0, count: 0 };
          yearGroups[item.annee].sum += val;
          yearGroups[item.annee].count += 1;
        }
      });
      const evolution = yearOrder
        .filter(year => yearGroups[year])
        .map(year => ({
          name: year.replace('cumul ', ''),
          value: Math.round((yearGroups[year].sum / yearGroups[year].count) * 10) / 10
        }));
      setEvolutionData(evolution);
    }
  }, [rawFineData, rawEvolData, proData, selectedBacPro]);

  // Reactive Map Data Fetching (Identical to General section)
  useEffect(() => {
    const loadMapData = async () => {
      if (geoFilter.formationTypes.length === 0) {
        setMapData([]);
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
          const processedMapData = allP2Data.map(row => {
            const coords = (row.coordonnees_gps || "").split(',').map((c: string) => parseFloat(c.trim()));
            return {
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
              position: (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) ? coords as [number, number] : null
            };
          }).filter(f => f.position !== null);
          setMapData(processedMapData);
        }
      } catch (err) {
        console.error("Error loading map data:", err);
      }
    };
    
    loadMapData();
  }, [geoFilter.formationTypes]);

  const filteredMapData = useMemo(() => {
    if (geoFilter.formationTypes.length === 0) return [];
    
    let base = [...mapData];
    base = base.filter(f => geoFilter.formationTypes.includes(f.filiere_generale));

    if (geoFilter.city) {
      base = base.filter(f => f.commune.toLowerCase().includes(geoFilter.city.toLowerCase()));
    }

    if (geoFilter.department) {
      base = base.filter(f => 
        f.departement.toLowerCase().includes(geoFilter.department.toLowerCase()) ||
        (f.departement.match(/\(([^)]+)\)/)?.[1] || "").includes(geoFilter.department)
      );
    }

    if (geoFilter.radius < 1000) {
      base = base.filter(f => {
        const dist = getDistance(geoFilter.center[0], geoFilter.center[1], f.position![0], f.position![1]);
        return dist <= geoFilter.radius;
      });
    }

    return base;
  }, [mapData, geoFilter]);

  const groupedMapData = useMemo(() => {
    const groups = new Map<string, any[]>();
    filteredMapData.forEach(f => {
      const key = f.coordonnees_gps;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(f);
    });
    return Array.from(groups.values()).map(group => {
      const types = Array.from(new Set(group.map(f => f.filiere_generale)));
      return {
        formations: group,
        position: group[0].position,
        types,
        colors: types.map(t => getFormationColor(t))
      };
    });
  }, [filteredMapData, getFormationColor]);

  const filteredCities = useMemo(() => {
    if (!geoFilter.city) return allCities.slice(0, 10);
    return allCities.filter(c => c.toLowerCase().includes(geoFilter.city.toLowerCase())).slice(0, 10);
  }, [allCities, geoFilter.city]);

  const filteredDepts = useMemo(() => {
    if (!geoFilter.department) return allDepartments.slice(0, 10);
    return allDepartments.filter(d => d.toLowerCase().includes(geoFilter.department.toLowerCase())).slice(0, 10);
  }, [allDepartments, geoFilter.department]);

  const filteredBacPros = useMemo(() => {
    if (!selectedBacPro) return allBacPros.slice(0, 10);
    return allBacPros.filter(b => b.toLowerCase().includes(selectedBacPro.toLowerCase())).slice(0, 10);
  }, [allBacPros, selectedBacPro]);

  const handleLocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setGeoFilter(prev => ({
          ...prev,
          center: [position.coords.latitude, position.coords.longitude]
        }));
      });
    }
  };

  const parseNumeric = (val: any): number | null => {
    if (val === null || val === undefined || val === '') return null;
    const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
    return isNaN(num) ? null : num;
  };

  const calculateAvg = (data: any[], column: string) => {
    const values = data
      .map(d => parseNumeric(d[column]))
      .filter((v): v is number => v !== null);
    
    if (values.length === 0) return null;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / values.length) * 10) / 10;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-slate-500 font-medium animate-pulse">Chargement des données InserJeunes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-primary sticky top-0 z-50 shadow-soft">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 160 40" className="h-10 w-auto fill-white" xmlns="http://www.w3.org/2000/svg">
              <text x="0" y="32" fontFamily="Inter, sans-serif" fontWeight="900" fontStyle="italic" fontSize="28" fill="white">l'Étudiant</text>
            </svg>
          </div>
          
          <div className="flex items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="flex items-center gap-3 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all text-sm font-black shadow-sm backdrop-blur-md"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline uppercase tracking-widest">Modifier mon profil</span>
              <span className="sm:hidden">Profil</span>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 sm:px-10 py-12">
        {/* Bac Pro Selection Bar */}
        <div className="mb-12">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-soft relative z-[60]">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Search className="w-3 h-3" /> Ma formation actuelle (Bac Pro)
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Saisis ton Bac Pro (ex: Commerce, AGOrA...)"
                    value={selectedBacPro}
                    onChange={(e) => {
                      setSelectedBacPro(e.target.value);
                      setShowBacProSuggestions(true);
                    }}
                    onFocus={() => setShowBacProSuggestions(true)}
                    className="w-full text-lg font-bold text-slate-900 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300"
                  />
                  {selectedBacPro && (
                    <button 
                      onClick={() => {
                        setSelectedBacPro('');
                        setShowBacProSuggestions(false);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {showBacProSuggestions && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowBacProSuggestions(false)} />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-20 max-h-64 overflow-y-auto custom-scrollbar p-2">
                      {filteredBacPros.length > 0 ? (
                        <>
                          <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">
                            Formations disponibles
                          </div>
                          {filteredBacPros.map((bp, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setSelectedBacPro(bp);
                                setShowBacProSuggestions(false);
                              }}
                              className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary rounded-xl transition-all flex items-center gap-3 group"
                            >
                              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-primary-light transition-colors">
                                <GraduationCap className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                              </div>
                              {bp}
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="px-6 py-8 text-center">
                          <p className="text-sm text-slate-400 font-medium italic">Aucune formation trouvée pour "{selectedBacPro}"</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="hidden md:block w-px h-12 bg-slate-100" />
              <div className="flex flex-col justify-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Analyse personnalisée</p>
                <p className="text-sm text-slate-500 font-medium leading-tight max-w-[200px]">
                  {selectedBacPro 
                    ? `Données filtrées pour le ${selectedBacPro}`
                    : "Sélectionne ton Bac Pro pour voir tes perspectives d'avenir."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <KPICard 
            title="Taux d'emploi à 6 mois"
            value={`${stats.avgEmployment}%`}
            icon={<TrendingUp className="w-7 h-7" />}
            description={selectedBacPro ? `Moyenne pour le ${selectedBacPro}` : "Moyenne nationale Bac Pro"}
            color="emerald"
          />
          <KPICard 
            title="Poursuite d'études"
            value={`${stats.avgStudies}%`}
            icon={<GraduationCap className="w-7 h-7" />}
            description={selectedBacPro ? `Part des diplômés de ${selectedBacPro} qui continuent.` : `${stats.avgStudies}% des diplômés choisissent de continuer leurs études.`}
            color="blue"
          />
          <KPICard 
            title="Formations analysées"
            value={stats.totalFormations.toString()}
            icon={<Users className="w-7 h-7" />}
            description={selectedBacPro ? "Données spécifiques à cette spécialité." : "Nombre de spécialités de Bac Pro suivies dans cette analyse."}
            color="amber"
          />
        </div>

        <div className="grid grid-cols-1 gap-12 mb-12">
          {/* Top Formations */}
          <ChartContainer title={selectedBacPro ? `Statistiques pour : ${selectedBacPro}` : "Top 10 des formations par taux d'emploi"} icon={<BarChart3 className="w-6 h-6" />}>
            <div className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {selectedBacPro 
                  ? `Voici les statistiques d'insertion pour le ${selectedBacPro}.`
                  : `Ce graphique présente les 10 spécialités de Bac Pro qui offrent les meilleurs débouchés immédiats sur le marché du travail (taux d'emploi à 6 mois après l'obtention du diplôme).`
                }
              </p>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topFormations} layout="vertical" margin={{ left: 40, right: 40, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 600 }}
                    width={150}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, "Taux d'emploi"]}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                    {topFormations.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Evolution Chart */}
          <ChartContainer title="Évolution du taux d'emploi (2019-2024)" icon={<Calendar className="w-5 h-5" />}>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} unit="%" domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, "Taux d'emploi"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8b5cf6" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#8b5cf6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>

          {/* Outcome Pie Chart */}
          <ChartContainer title="Devenir des diplômés (à 6 mois)" icon={<PieChartIcon className="w-5 h-5" />}>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {outcomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, "Part"]}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>
        </div>

        {/* Map Section */}
        <div className="mb-12">
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
                      {filteredMapData.length > 0 
                        ? `${filteredMapData.length} établissement${filteredMapData.length > 1 ? 's' : ''} trouvé${filteredMapData.length > 1 ? 's' : ''}`
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
                {groupedMapData.map((group, idx) => (
                  <Marker 
                    key={idx} 
                    position={group.position}
                    icon={createMarkerIcon(group.colors)}
                  >
                    <Popup minWidth={250} maxWidth={320}>
                      <div className="max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                        {group.formations.map((f: any, fIdx: number) => (
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
                              <span className="text-[10px] text-slate-400 font-medium italic leading-tight block">
                                % Bac Pro admis: {f.pct_admis_neo_pro}%
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
                          {allFormationTypes.map((type, i) => {
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
                      <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto custom-scrollbar overflow-x-hidden">
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
                      <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto custom-scrollbar overflow-x-hidden">
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
        </div>

        {/* Stats Panel Section */}
        {filteredMapData.length > 0 && (
          <StatsPanel 
            data={filteredMapData} 
            userNote={onboardingData ? parseFloat(onboardingData.averageBac) : null}
            selectedDepartment={geoFilter.department || undefined}
            allDataOfSameType={mapData}
          />
        )}

        <div className="grid grid-cols-1 gap-8">
          {/* External Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
              <MapIcon className="w-5 h-5 text-blue-500" />
              Ressources utiles
            </h3>
            <ExternalLinkCard 
              title="Le guide des BTS"
              description="Découvre toutes les options de poursuite d'études après ton Bac Pro."
              url="https://www.letudiant.fr/etudes/bts.html"
            />
            <ExternalLinkCard 
              title="Fiches Métiers"
              description="Explore plus de 600 métiers et les formations pour y accéder."
              url="https://www.letudiant.fr/metiers.html"
            />
            <ExternalLinkCard 
              title="InserJeunes"
              description="Consulte les données officielles d'insertion par établissement."
              url="https://www.inserjeunes.education.gouv.fr/diffusion/accueil"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function KPICard({ title, value, icon, description, color }: { title: string, value: string, icon: React.ReactNode, description: string, color: 'emerald' | 'blue' | 'amber' }) {
  const colors = {
    emerald: "bg-emerald-50/50 border-emerald-100/50 text-emerald-600",
    blue: "bg-blue-50/50 border-blue-100/50 text-blue-600",
    amber: "bg-amber-50/50 border-amber-100/50 text-amber-600"
  };

  return (
    <motion.div 
      whileHover={{ y: -5, shadow: "var(--shadow-hover)" }}
      className={cn("p-8 rounded-[2.5rem] border bg-white shadow-soft transition-all", colors[color])}
    >
      <div className="flex items-center justify-between mb-8">
        <div className={cn("p-4 rounded-2xl shadow-sm bg-white", colors[color])}>
          {icon}
        </div>
      </div>
      <h4 className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-2">{title}</h4>
      <div className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">{value}</div>
      <p className="text-slate-500 text-xs font-medium leading-relaxed">{description}</p>
    </motion.div>
  );
}

function ChartContainer({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-white p-10 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-soft"
    >
      <div className="flex items-center gap-4 mb-12">
        <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
          {icon}
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function ExternalLinkCard({ title, description, url }: { title: string, description: string, url: string }) {
  return (
    <motion.a 
      whileHover={{ x: 10, backgroundColor: '#f8fafc' }}
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="group p-8 bg-white border border-slate-100 rounded-[2rem] shadow-soft hover:border-primary/20 transition-all flex items-center justify-between"
    >
      <div className="flex-1">
        <h4 className="text-lg font-black text-slate-900 group-hover:text-primary transition-colors flex items-center gap-3">
          {title}
          <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </h4>
        <p className="text-sm text-slate-500 font-medium mt-1">{description}</p>
      </div>
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-primary-light transition-colors">
        <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-primary transition-colors" />
      </div>
    </motion.a>
  );
}
