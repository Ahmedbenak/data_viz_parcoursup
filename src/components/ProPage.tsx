import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Briefcase, 
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
  X,
  Bell,
  ArrowLeft
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
  Legend,
  ReferenceArea,
  Label
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

import {
  fetchCurrentStats,
  fetchEmploymentEvolution,
  fetchTopFormations,
  fetchFormationsList
} from '../lib/proStatsService';

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

function MapUpdater({ center, zoom, department, formations }: { center: [number, number], zoom: number, department?: string, formations: any[] }) {
  const map = useMap();
  
  useEffect(() => {
    // 1. If we have a specific department, focus on it
    if (department && formations.length > 0 && center[0] === 46.603354) {
      const departmentMarkers = formations.filter(f => 
        f.departement.toLowerCase() === department.toLowerCase() && f.position
      );
      
      if (departmentMarkers.length > 0) {
        const bounds = L.latLngBounds(departmentMarkers.map(f => f.position));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 });
        return;
      }
    }
    
    // 2. Otherwise use the center and zoom provided
    map.setView(center, zoom);
  }, [center, zoom, department, formations, map]);
  
  return null;
}

function MarkerWithAutoPopup({ position, icon, children, timestamp }: any) {
  const markerRef = useRef<L.Marker>(null);
  
  useEffect(() => {
    if (timestamp && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [timestamp]);
  
  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      {children}
    </Marker>
  );
}

import { Skeleton, CardSkeleton } from './Skeleton';
import Header from './Header';

interface ProPageProps {
  onBack: () => void;
  onboardingData?: OnboardingData | null;
  setOnboardingComplete: (complete: boolean) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ProPage({ onBack, onboardingData, setOnboardingComplete }: ProPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
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
  const [targetFormation, setTargetFormation] = useState<{data: any, timestamp: number} | null>(null);
  const [geoFilter, setGeoFilter] = useState({
    center: [46.603354, 1.888334] as [number, number],
    zoom: 6,
    radius: 1000,
    city: '',
    department: onboardingData?.department || '',
    formationTypes: onboardingData?.targetFormationTypes || [] as string[]
  });

  // Questionnaire states
  const [showProOnboarding, setShowProOnboarding] = useState(true);
  const [proUserNote, setProUserNote] = useState<string>('');
  const [proOnboardingData, setProOnboardingData] = useState<{
    bacPro: string;
    targetFormation: string;
    averageBac: string;
    department: string;
  }>({
    bacPro: '',
    targetFormation: '',
    averageBac: '',
    department: ''
  });

  const [qBacProSearch, setQBacProSearch] = useState('');
  const [qDeptSearch, setQDeptSearch] = useState('');
  const [showQBacProSuggestions, setShowQBacProSuggestions] = useState(false);
  const [showQDeptSuggestions, setShowQDeptSuggestions] = useState(false);

  // Load saved onboarding from sessionStorage if exists
  useEffect(() => {
    const saved = sessionStorage.getItem('parcoursup_pro_onboarding');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProOnboardingData(parsed);
        setQBacProSearch(parsed.bacPro);
        setQDeptSearch(parsed.department);
        
        // Pre-select and set state directly
        setSelectedBacPro(parsed.bacPro);
        setProUserNote(parsed.averageBac);
        setGeoFilter(prev => ({
          ...prev,
          department: parsed.department,
          formationTypes: parsed.targetFormation ? [parsed.targetFormation] : prev.formationTypes
        }));
        setShowProOnboarding(false);
      } catch (e) {
        console.error("Error parsing saved pro onboarding:", e);
      }
    }
  }, []);

  const filteredQBacPros = useMemo(() => {
    if (!qBacProSearch) return allBacPros.slice(0, 10);
    return allBacPros.filter(bp => bp.toLowerCase().includes(qBacProSearch.toLowerCase())).slice(0, 10);
  }, [allBacPros, qBacProSearch]);

  const filteredQDepts = useMemo(() => {
    if (!qDeptSearch) return allDepartments.slice(0, 10);
    return allDepartments.filter(d => d.toLowerCase().includes(qDeptSearch.toLowerCase())).slice(0, 10);
  }, [allDepartments, qDeptSearch]);

  const isQFormValid = useMemo(() => {
    const avg = parseFloat(proOnboardingData.averageBac);
    const isAvgOk = !isNaN(avg) && avg >= 8 && avg <= 20;
    return (
      proOnboardingData.bacPro !== '' &&
      proOnboardingData.targetFormation !== '' &&
      proOnboardingData.department !== '' &&
      isAvgOk
    );
  }, [proOnboardingData]);

  // Dynamic Color Mapping based on all loaded formation types
  const typeColorMap = useMemo(() => {
    const map: Record<string, string> = { };
    allFormationTypes.forEach((type, index) => {
      const hue = (index * 360) / Math.max(1, allFormationTypes.length);
      map[type] = `hsl(${hue}, 75%, 45%)`;
    });
    return map;
  }, [allFormationTypes]);

  const getFormationColor = useCallback((type: string) => {
    return typeColorMap[type] || '#64748b';
  }, [typeColorMap]);

  // Secondary Loading States
  const [statsLoading, setStatsLoading] = useState(false);

  // 1. Initial Metadata Load: dropdown options and map helper lists
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setLoading(true);
        const supabase = getSupabase();

        const [
          cityResult,
          deptResult,
          typeResult,
          bacProListData
        ] = await Promise.all([
          supabase.rpc('get_unique_cities'),
          supabase.rpc('get_unique_departments'),
          supabase.rpc('get_unique_formation_types_pro'),
          fetchFormationsList()
        ]);

        if (cityResult.error) throw cityResult.error;
        if (deptResult.error) throw deptResult.error;
        if (typeResult.error) throw typeResult.error;

        if (cityResult.data) setAllCities(cityResult.data.map((r: any) => r.city));
        if (deptResult.data) setAllDepartments(deptResult.data.map((r: any) => r.dept));
        if (typeResult.data) setAllFormationTypes(typeResult.data.map((r: any) => r.filiere));
        if (bacProListData) setAllBacPros(bacProListData);

      } catch (err: any) {
        console.error('Error fetching Pro page metadata:', err);
        setError("Impossible de charger les métadonnées de la page.");
      } finally {
        setLoading(false);
      }
    };

    loadMetadata();
  }, []);

  // 2. Reactive Statistics Load: when selected specialty or dropdown references change
  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        
        // A. Fetch current stats for selection or fallback to global
        const statsRow = await fetchCurrentStats(selectedBacPro || null);
        
        if (statsRow) {
          // Process Trajectory Points
          const trajectory = [
            { name: '6 mois', value: statsRow.avg_taux_emploi_6mois },
            { name: '12 mois', value: statsRow.avg_taux_emploi_12mois },
            { name: '18 mois', value: statsRow.avg_taux_emploi_18mois },
            { name: '24 mois', value: statsRow.avg_taux_emploi_24mois },
          ].filter(d => d.value !== null);
          setTrajectoryData(trajectory);

          // Process Outcomes Points
          const outcomes = [
            { name: 'Emploi', value: statsRow.avg_devenir_part_emploi_6mois },
            { name: 'Études', value: statsRow.avg_devenir_part_poursuite_etudes },
            { name: 'Autre', value: statsRow.avg_devenir_part_autre_situation_6mois },
          ].filter(d => d.value !== null);
          setOutcomeData(outcomes);

          // Header summary stats
          setStats({
            avgEmployment: statsRow.avg_taux_emploi_6mois || 0,
            avgStudies: statsRow.avg_devenir_part_poursuite_etudes || 0,
            totalFormations: selectedBacPro ? 1 : (statsRow.total_formations_uniques || allBacPros.length)
          });
        }

        // B. Fetch evolution over time
        const evolutionPoints = await fetchEmploymentEvolution(selectedBacPro || null);
        const evolution = evolutionPoints.map(p => ({
          name: p.annee.replace('cumul ', ''),
          value: p.taux_emploi_6mois
        })).filter(p => p.value !== null);
        setEvolutionData(evolution);

        // C. Fetch top formations list
        const topList = await fetchTopFormations(10);
        let top = topList.map(item => ({
          name: item.libelle_formation.charAt(0).toUpperCase() + item.libelle_formation.slice(1),
          value: item.avg_taux_emploi_6mois,
          isHighlighted: false
        }));

        if (selectedBacPro) {
          const formattedSelectedName = selectedBacPro.charAt(0).toUpperCase() + selectedBacPro.slice(1);
          const foundIndex = top.findIndex(item => item.name.toLowerCase() === selectedBacPro.toLowerCase() || item.name.toLowerCase().includes(selectedBacPro.toLowerCase()));
          
          if (foundIndex !== -1) {
            top[foundIndex].isHighlighted = true;
            top[foundIndex].name = `🌟 ${top[foundIndex].name} (Mon Bac)`;
          } else if (statsRow) {
            top.push({
              name: `🌟 ${formattedSelectedName} (Mon Bac)`,
              value: statsRow.avg_taux_emploi_6mois || 0,
              isHighlighted: true
            });
            // Re-sort descending by value to show exactly where it fits in rank!
            top.sort((a, b) => b.value - a.value);
          }
        }
        setTopFormations(top);

      } catch (err) {
        console.error('Error fetching Pro stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [selectedBacPro, allBacPros.length]);

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
            .neq('pct_admis_neo_pro', '0')
            .not('pct_admis_neo_pro', 'is', null)
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
              filiere_detaillee: row.filiere_detaillee || "",
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
      base = base.filter(f => f.departement.toLowerCase() === geoFilter.department.toLowerCase());
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

  const handleShowOnMap = (formation: any) => {
    setTargetFormation({ data: formation, timestamp: Date.now() });
    const coords = (formation.coordonnees_gps || "").split(',').map((c: string) => parseFloat(c.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      setGeoFilter(prev => ({
        ...prev,
        center: [coords[0], coords[1]] as [number, number],
        zoom: 13,
        radius: 1000,
        department: formation.departement
      }));
      
      if (!geoFilter.formationTypes.includes(formation.filiere_generale)) {
        setGeoFilter(prev => ({
          ...prev,
          formationTypes: [...prev.formationTypes, formation.filiere_generale]
        }));
      }

      setTimeout(() => {
        // Need to check the ID of map section in ProPage
        const mapSection = document.getElementById('section-geo-pro'); 
        if (mapSection) {
          mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
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
      <div className="min-h-screen bg-slate-50 space-y-8">
        <Skeleton className="h-16 w-full" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <Skeleton className="h-20 w-full rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-[400px] rounded-[3.5rem]" />
            <Skeleton className="h-[400px] rounded-[3.5rem]" />
          </div>
        </div>
      </div>
    );
  }

  if (showProOnboarding) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        {/* Floating Back Button in Onboarding */}
        <div className="absolute top-8 left-8 z-[100]">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900/90 backdrop-blur-sm text-white rounded-full font-bold shadow-xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 group border border-white/20 text-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Retour à l'accueil</span>
          </button>
        </div>

        <div className="max-w-4xl w-full mt-12 sm:mt-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-white p-8 sm:p-16 rounded-[4.5rem] shadow-soft border border-slate-100 relative overflow-hidden"
          >
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full -ml-32 -mb-32 blur-3xl" />

            <div className="mb-12 text-center relative z-10">
              <motion.div 
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="w-20 h-20 bg-primary-light rounded-[2rem] flex items-center justify-center mb-6 mx-auto shadow-lg shadow-primary/10"
              >
                <GraduationCap className="w-10 h-10 text-primary" />
              </motion.div>
              <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter">Votre profil Bac Pro</h2>
              <p className="text-slate-500 font-medium text-lg">Parlez-nous de votre parcours pour des recommandations adaptées.</p>
            </div>

            <div className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Section 1: Formation Actuelle */}
                <div className="space-y-3 relative">
                  <label className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                    <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[11px] shadow-lg shadow-primary/25 font-black">1</span>
                    Ma formation actuelle (Bac Pro)
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Ex: Commerce, Électricité..."
                      value={qBacProSearch}
                      onChange={(e) => {
                        setQBacProSearch(e.target.value);
                        setProOnboardingData(p => ({ ...p, bacPro: e.target.value }));
                        setShowQBacProSuggestions(true);
                      }}
                      onFocus={() => setShowQBacProSuggestions(true)}
                      className="w-full text-base font-bold text-slate-900 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all placeholder:text-slate-400"
                    />
                    {showQBacProSuggestions && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowQBacProSuggestions(false)} />
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-20 max-h-60 overflow-y-auto p-2 custom-scrollbar">
                          {filteredQBacPros.length > 0 ? (
                            filteredQBacPros.map((bp, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setQBacProSearch(bp);
                                  setProOnboardingData(p => ({ ...p, bacPro: bp }));
                                  setShowQBacProSuggestions(false);
                                }}
                                className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl transition-all"
                              >
                                {bp}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-4 text-sm text-slate-400 italic text-center">Aucune spécialité trouvée</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Section 2: Formation Visée */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                    <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[11px] shadow-lg shadow-primary/25 font-black">2</span>
                    Filière visée (Poursuite d'études)
                  </label>
                  <div className="relative">
                    <select
                      value={proOnboardingData.targetFormation}
                      onChange={(e) => setProOnboardingData(p => ({ ...p, targetFormation: e.target.value }))}
                      className="w-full text-base font-bold text-slate-900 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Sélectionner une formation...</option>
                      {allFormationTypes.map((type, idx) => (
                        <option key={idx} value={type}>{type}</option>
                      ))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Section 3: Moyenne Attendue / Obtenue */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                    <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[11px] shadow-lg shadow-primary/25 font-black">3</span>
                    Moyenne attendue ou obtenue au Bac
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 14.5 (De 8 à 20)"
                    value={proOnboardingData.averageBac}
                    onChange={(e) => {
                      const value = e.target.value.replace(',', '.');
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setProOnboardingData(p => ({ ...p, averageBac: value }));
                      }
                    }}
                    className="w-full text-base font-bold text-slate-900 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Section 4: Département */}
                <div className="space-y-3 relative">
                  <label className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                    <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[11px] shadow-lg shadow-primary/25 font-black">4</span>
                    Département d'intérêt
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Ex: 75 ou Paris ou Haute-Savoie..."
                      value={qDeptSearch}
                      onChange={(e) => {
                        setQDeptSearch(e.target.value);
                        setProOnboardingData(p => ({ ...p, department: e.target.value }));
                        setShowQDeptSuggestions(true);
                      }}
                      onFocus={() => setShowQDeptSuggestions(true)}
                      className="w-full text-base font-bold text-slate-900 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all placeholder:text-slate-400"
                    />
                    {showQDeptSuggestions && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowQDeptSuggestions(false)} />
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-20 max-h-60 overflow-y-auto p-2 custom-scrollbar">
                          {filteredQDepts.length > 0 ? (
                            filteredQDepts.map((dept, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setQDeptSearch(dept);
                                  setProOnboardingData(p => ({ ...p, department: dept }));
                                  setShowQDeptSuggestions(false);
                                }}
                                className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl transition-all"
                              >
                                {dept}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-4 text-sm text-slate-400 italic text-center">Aucun département trouvé</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 mt-8">
                <button
                  onClick={onBack}
                  className="w-full sm:w-auto px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  Retour
                </button>
                <div className="flex items-center justify-end gap-4 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setShowProOnboarding(false);
                    }}
                    className="px-6 py-4 text-slate-400 hover:text-slate-600 transition-colors font-bold text-sm"
                  >
                    Passer
                  </button>
                  <button
                    disabled={!isQFormValid}
                    onClick={() => {
                      sessionStorage.setItem('parcoursup_pro_onboarding', JSON.stringify(proOnboardingData));
                      setSelectedBacPro(proOnboardingData.bacPro);
                      setProUserNote(proOnboardingData.averageBac);
                      setGeoFilter(prev => ({
                        ...prev,
                        department: proOnboardingData.department,
                        formationTypes: proOnboardingData.targetFormation ? [proOnboardingData.targetFormation] : prev.formationTypes
                      }));
                      setShowProOnboarding(false);
                    }}
                    className={cn(
                      "w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all",
                      isQFormValid 
                        ? "bg-primary text-white hover:bg-primary-dark hover:-translate-y-0.5 active:translate-y-0" 
                        : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                    )}
                  >
                    <span>Valider & Analyser</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header onboardingData={onboardingData} setOnboardingComplete={setOnboardingComplete} onHome={onBack} />
      
      <main className="max-w-7xl mx-auto px-6 sm:px-10 py-12">

        {/* Bac Pro Selection Bar */}
        <div className="mb-12">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-soft relative z-10">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Search className="w-3 h-3" /> Ma formation actuelle (Bac Pro)
                  </label>
                  <button 
                    onClick={() => {
                      setQBacProSearch(selectedBacPro);
                      setQDeptSearch(geoFilter.department);
                      setProOnboardingData({
                        bacPro: selectedBacPro,
                        targetFormation: geoFilter.formationTypes[0] || '',
                        averageBac: proUserNote || (onboardingData?.averageBac || ''),
                        department: geoFilter.department
                      });
                      setShowProOnboarding(true);
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 hover:scale-105 transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Target className="w-3.5 h-3.5 text-primary" />
                    <span>Modifier mon profil</span>
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Sélectionne une formation pour avoir des statistiques détaillées"
                    value={selectedBacPro}
                    onChange={(e) => {
                      setSelectedBacPro(e.target.value);
                      setShowBacProSuggestions(true);
                    }}
                    onFocus={() => setShowBacProSuggestions(true)}
                    className="w-full text-lg font-bold text-slate-900 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-400"
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
                      <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">
                        Options
                      </div>
                      <button
                        onClick={() => {
                          setSelectedBacPro('');
                          setShowBacProSuggestions(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-3 group mb-1",
                          !selectedBacPro ? "bg-primary-light text-primary" : "text-slate-600 hover:bg-slate-50 hover:text-primary"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                          !selectedBacPro ? "bg-primary text-white" : "bg-slate-100 group-hover:bg-primary-light"
                        )}>
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        (Moyenne pour toutes les formations)
                      </button>

                      {filteredBacPros.length > 0 ? (
                        <>
                          <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1 mt-2">
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

        {/* Notice Données Nationales */}
        <div className="max-w-4xl mx-auto mb-8 bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-3">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <p className="text-slate-500 text-xs font-medium">
            Ces indicateurs sont des moyennes nationales calculées sur la France entière.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
          <KPICard 
            title="Taux d'emploi à 6 mois"
            value={stats.avgEmployment > 0 ? `${stats.avgEmployment.toFixed(1)}%` : "Donnée indisponible"}
            icon={<TrendingUp className="w-7 h-7" />}
            tooltipText={`Calculé uniquement parmi les diplômés qui recherchent un emploi après leurs études.\n\n${selectedBacPro ? `Moyenne pour le ${selectedBacPro}` : "Moyenne nationale Bac Pro"}`}
            color="emerald"
          />
          <KPICard 
            title="Poursuite d'études"
            value={stats.avgStudies > 0 ? `${stats.avgStudies.toFixed(1)}%` : "Donnée indisponible"}
            icon={<GraduationCap className="w-7 h-7" />}
            tooltipText={selectedBacPro 
              ? `Parmi l'ensemble des élèves de la formation ${selectedBacPro}, ${stats.avgStudies > 0 ? stats.avgStudies.toFixed(1) : "0"}% décident de poursuivre leurs études.\n\nCalculé parmi l'ensemble des élèves de ce Bac Pro.` 
              : `Parmi l'ensemble des diplômés, ${stats.avgStudies > 0 ? stats.avgStudies.toFixed(1) : "0"}% décident de poursuivre leurs études.\n\nCalculé parmi l'ensemble des élèves de la formation.`
            }
            color="blue"
          />
        </div>

        <div className="grid grid-cols-1 gap-12 mb-12">
          {/* Top Formations */}
          <ChartContainer 
            title="Top 10 : Taux d'emploi à 6 mois (National)" 
            icon={<BarChart3 className="w-6 h-6" />}
          >
            <div className="h-[500px] w-full pt-4">
              {topFormations.length > 0 && topFormations.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topFormations} layout="vertical" margin={{ left: 10, right: 40, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 600 }}
                      width={220}
                      interval={0}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, "Taux d'emploi"]}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                      {topFormations.map((entry, index) => {
                        const baseColor = COLORS[index % COLORS.length];
                        if (entry.isHighlighted) {
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={baseColor}
                              stroke="#0f172a"
                              strokeWidth={3}
                            />
                          );
                        }
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={baseColor} 
                            opacity={selectedBacPro ? 0.65 : 1}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoDataMessage />
              )}
            </div>
          </ChartContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Evolution Chart */}
          <ChartContainer title="Évolution du taux d'emploi (2019-2024)" icon={<Calendar className="w-5 h-5" />} isNational={true}>
            <div className="h-[300px] w-full">
              {evolutionData.length > 0 && evolutionData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  {evolutionData.filter(d => d.value > 0).length === 1 ? (
                    <BarChart data={evolutionData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} unit="%" domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, "Taux d'emploi"]}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#8b5cf6" 
                        radius={[6, 6, 0, 0]} 
                        barSize={50} 
                      />
                    </BarChart>
                  ) : (
                    <LineChart data={evolutionData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} unit="%" domain={['auto', 'auto']} />

                      <ReferenceArea 
                        x1="2019-2020" 
                        x2="2020-2021" 
                        {...({
                          fill: "#f1f5f9",
                          fillOpacity: 0.8,
                          stroke: "#e2e8f0",
                          strokeDasharray: "3 3"
                        } as any)}
                      >
                        <Label 
                          value="Covid + Confinement" 
                          position="insideTop" 
                          {...({
                            offset: 15,
                            fill: "#64748b",
                            style: { fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.04em' }
                          } as any)}
                        />
                      </ReferenceArea>

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
                  )}
                </ResponsiveContainer>
              ) : (
                <NoDataMessage />
              )}
            </div>
          </ChartContainer>

          {/* Outcome Pie Chart */}
          <ChartContainer title="Devenir des diplômés (à 6 mois)" icon={<PieChartIcon className="w-5 h-5" />} isNational={true}>
            <div className="h-[300px] w-full flex items-center justify-center">
              {outcomeData.length > 0 && outcomeData.some(d => d.value > 0) ? (
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
              ) : (
                <NoDataMessage />
              )}
            </div>
          </ChartContainer>
        </div>

        {/* Stats Panel Section */}
        <StatsPanel 
          data={filteredMapData} 
          userNote={proUserNote ? parseFloat(proUserNote) : (onboardingData ? parseFloat(onboardingData.averageBac) : null)}
          selectedDepartment={geoFilter.department || undefined}
          selectedCity={geoFilter.city || undefined}
          selectedFormations={geoFilter.formationTypes}
          allDataOfSameType={mapData}
          allFormationTypes={allFormationTypes}
          allCities={allCities}
          allDepartments={allDepartments}
          onFilterChange={(filters) => setGeoFilter(prev => ({ ...prev, ...filters }))}
          onShowOnMap={handleShowOnMap}
          pageType="pro"
        />

        {/* Map Section */}
        <div id="section-geo-pro" className="mb-12">
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
                zoom={geoFilter.zoom} 
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <MapUpdater 
                  center={geoFilter.center} 
                  zoom={geoFilter.zoom}
                  department={geoFilter.department} 
                  formations={mapData} 
                />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {groupedMapData.map((group, idx) => {
                  const targeted = targetFormation && group.formations.some(f => 
                    f.etablissement === targetFormation.data.etablissement && 
                    f.filiere_formation === targetFormation.data.filiere_formation &&
                    f.coordonnees_gps === targetFormation.data.coordonnees_gps
                  );

                  return (
                    <MarkerWithAutoPopup 
                      key={idx} 
                      position={group.position}
                      icon={createMarkerIcon(group.colors, group.formations.length)}
                      timestamp={targeted ? targetFormation.timestamp : null}
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
                            {f.filiere_detaillee && <p className="text-[10px] italic text-primary font-medium mb-1">{f.filiere_detaillee}</p>}
                            <p className="text-xs font-medium text-primary-dark mb-1">{f.selectivite}</p>
                            <p className="text-xs text-slate-500 mb-2">{f.commune} ({f.departement})</p>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-slate-50 p-2 rounded-lg">
                                <span className="block text-[10px] text-slate-400 uppercase font-bold">Taux Accès</span>
                                <span className="text-sm font-bold text-primary">
                                  {f.taux_acces !== null ? `${f.taux_acces.toFixed(1)}%` : "Inconnu"}
                                </span>
                              </div>
                              <div className="bg-slate-50 p-2 rounded-lg">
                                <span className="block text-[10px] text-slate-400 uppercase font-bold">Capacité</span>
                                <span className="text-sm font-bold text-slate-700">{f.capacite}</span>
                              </div>
                            </div>
                            
                            <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-2">
                              <span className="text-[10px] text-slate-400 font-medium italic leading-tight block">
                                Note moyenne au bac pour les admis: {f.note_moyenne !== null ? `${f.note_moyenne.toFixed(1)}/20` : "N/A"}
                              </span>
                              <span className="text-[10px] text-emerald-600 font-bold block">
                                Part de boursiers: {f.pct_admis_neo_boursiers !== undefined ? `${f.pct_admis_neo_boursiers.toFixed(1)}%` : "N/A"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium italic leading-tight block">
                                % Bac Pro admis: {f.pct_admis_neo_pro.toFixed(1)}%
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
                    </MarkerWithAutoPopup>
                  );
                })}
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

function NoDataMessage({ message = "Informations indisponibles pour cette formation" }: { message?: string }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
        <Info className="w-8 h-8 text-slate-300" />
      </div>
      <p className="text-slate-500 font-medium max-w-[200px] leading-relaxed italic">
        {message}
      </p>
    </div>
  );
}

function KPICard({ title, value, icon, tooltipText, color }: { title: string, value: string, icon: React.ReactNode, tooltipText: string, color: 'emerald' | 'blue' | 'amber' }) {
  const colors = {
    emerald: "bg-emerald-50/50 border-emerald-100/50 text-emerald-600",
    blue: "bg-blue-50/50 border-blue-100/50 text-blue-600",
    amber: "bg-amber-50/50 border-amber-100/50 text-amber-600"
  };

  return (
    <motion.div 
      whileHover={{ y: -3, shadow: "var(--shadow-hover)" }}
      className={cn("p-4 rounded-2xl border bg-white shadow-soft transition-all flex flex-col justify-between relative min-h-[110px]", colors[color])}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-lg shadow-xs bg-white", colors[color])}>
            {icon}
          </div>
          <span className="text-[9px] font-black text-[#E30613] bg-[#fbe6e7] border border-[#E30613]/25 px-2 py-0.5 rounded uppercase tracking-wider">
            Données Nationales
          </span>
        </div>
        
        {/* Info Icon with Tooltip */}
        <div className="relative group cursor-pointer p-1">
          <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
          
          {/* Tooltip Popup */}
          <div className="absolute right-0 bottom-full mb-2 w-72 p-4 bg-slate-900 border border-slate-800 text-white rounded-2xl text-xs font-semibold shadow-xl opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50 leading-relaxed font-sans font-medium text-left">
            <div className="relative">
              {tooltipText.split('\n\n').map((para, idx) => (
                <p key={idx} className={idx > 0 ? "mt-2 pt-2 border-t border-slate-800 text-slate-300" : "text-white"}>
                  {para}
                </p>
              ))}
              {/* Tooltip Arrow */}
              <div className="absolute top-full right-2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900"></div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.12em] mb-0.5">{title} (Moyenne Nationale)</h4>
        <div className="text-2xl font-black text-slate-900 tracking-tighter">{value}</div>
      </div>
    </motion.div>
  );
}

function ChartContainer({ title, icon, children, isNational = false }: { title: string, icon: React.ReactNode, children: React.ReactNode, isNational?: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-soft"
    >
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
            {icon}
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
        </div>
        {isNational && (
          <span className="text-[9px] font-black text-[#E30613] bg-[#fbe6e7] border border-[#E30613]/25 px-2 py-0.5 rounded uppercase tracking-wider">
            Données Nationales - InserJeunes
          </span>
        )}
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
