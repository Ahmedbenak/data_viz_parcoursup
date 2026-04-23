import React, { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { 
  TrendingUp,
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  MapPin, 
  Lightbulb, 
  UserCheck, 
  ChevronRight,
  GraduationCap,
  Target,
  Users,
  ChevronDown,
  Search,
  Building2,
  X,
  FileDown,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Parcoursup2Data {
  filiere_generale: string;
  filiere_formation: string;
  filiere_detaillee?: string;
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

interface StatsPanelProps {
  data: Parcoursup2Data[];
  userNote?: number | null;
  selectedDepartment?: string;
  selectedCity?: string;
  selectedFormations?: string[];
  allDataOfSameType: Parcoursup2Data[];
  allFormationTypes: string[];
  allCities: string[];
  allDepartments: string[];
  onFilterChange: (filters: { city?: string; department?: string; formationTypes?: string[] }) => void;
  onShowOnMap?: (formation: Parcoursup2Data) => void;
  pageType: 'general' | 'pro';
  loading?: boolean;
}

export default function StatsPanel({ 
  data, 
  userNote, 
  selectedDepartment, 
  selectedCity, 
  selectedFormations, 
  allDataOfSameType, 
  allFormationTypes,
  allCities,
  allDepartments,
  onFilterChange,
  onShowOnMap,
  pageType,
  loading = false
}: StatsPanelProps) {
  const [localUserNote, setLocalUserNote] = useState<number | null>(userNote || null);
  const [inputValue, setInputValue] = useState<string>(userNote ? userNote.toString() : '');
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Filter bar states
  const [showFormationDropdown, setShowFormationDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState(selectedCity || '');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [deptSearch, setDeptSearch] = useState(selectedDepartment || '');
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);

  // Sync city/dept search when props change
  useEffect(() => {
    setCitySearch(selectedCity || '');
  }, [selectedCity]);

  useEffect(() => {
    setDeptSearch(selectedDepartment || '');
  }, [selectedDepartment]);

  const filteredCities = useMemo(() => 
    allCities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).slice(0, 10),
    [allCities, citySearch]
  );

  const filteredDepts = useMemo(() => 
    allDepartments.filter(d => d.toLowerCase().includes(deptSearch.toLowerCase())).slice(0, 10),
    [allDepartments, deptSearch]
  );

  // Sync with prop if it changes from outside
  useEffect(() => {
    if (userNote !== undefined) {
      setLocalUserNote(userNote);
      setInputValue(userNote ? userNote.toString() : '');
    }
  }, [userNote]);

  const handleValidate = () => {
    const sanitized = inputValue.replace(',', '.');
    const val = parseFloat(sanitized);
    if (!isNaN(val) && val >= 0 && val <= 20) {
      setLocalUserNote(val);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      setIsExporting(true);
      const element = reportRef.current;
      
      // Selectively hide elements that shouldn't be in PDF (like the filter bar and download button)
      const filterBar = element.querySelector('.dynamic-filter-bar');
      const noPrintBtns = element.querySelectorAll('.no-print-btn');
      
      if (filterBar) (filterBar as HTMLElement).style.display = 'none';
      noPrintBtns.forEach(btn => (btn as HTMLElement).style.display = 'none');
      
      // Small delay to ensure React finishes re-rendering in "export" mode
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const dataUrl = await toPng(element, {
        quality: 0.95,
        backgroundColor: '#f8fafc', // match slate-50 background
        width: element.offsetWidth,
        height: element.offsetHeight,
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      if (filterBar) (filterBar as HTMLElement).style.display = 'flex';
      noPrintBtns.forEach(btn => (btn as HTMLElement).style.display = 'flex');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [element.offsetWidth, element.offsetHeight]
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, element.offsetWidth, element.offsetHeight);
      pdf.save(`Rapport_Orientation_${pageType === 'general' ? 'General' : 'Pro'}_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Filter out NaN note_moyenne
  const validData = useMemo(() => data.filter(d => d.note_moyenne !== null), [data]);
  // Overview Stats
  const overview = useMemo(() => {
    const totalPlaces = validData.reduce((acc, curr) => acc + curr.capacite, 0);
    const selectiveCount = validData.filter(d => d.selectivite.toLowerCase().includes('sélective') && !d.selectivite.toLowerCase().includes('non')).length;
    const nonSelectiveCount = validData.length - selectiveCount;
    
    return {
      count: validData.length,
      totalPlaces,
      selectivePct: validData.length > 0 ? Math.round((selectiveCount / validData.length) * 100) : 0,
      nonSelectivePct: validData.length > 0 ? Math.round((nonSelectiveCount / validData.length) * 100) : 0,
    };
  }, [validData]);

  // Accessibility Segments
  const segments = useMemo(() => {
    if (localUserNote === null || localUserNote === 0) {
      return {
        accessible: { count: 0, totalCap: 0, avgTaux: 0, minNote: 0, maxNote: 0 },
        level: { count: 0, totalCap: 0, avgTaux: 0, minNote: 0, maxNote: 0 },
        ambitious: { count: 0, totalCap: 0, avgTaux: 0, minNote: 0, maxNote: 0 },
      };
    }

    const accessible = validData.filter(d => d.note_moyenne! <= localUserNote - 0.5);
    const level = validData.filter(d => d.note_moyenne! > localUserNote - 0.5 && d.note_moyenne! <= localUserNote + 0.5);
    const ambitious = validData.filter(d => d.note_moyenne! > localUserNote + 0.5);

    const calcStats = (segmentData: Parcoursup2Data[]) => {
      const count = segmentData.length;
      const totalCap = segmentData.reduce((acc, curr) => acc + curr.capacite, 0);
      const avgTaux = segmentData.length > 0 
        ? Math.round(segmentData.reduce((acc, curr) => acc + (curr.taux_acces || 0), 0) / segmentData.length) 
        : 0;
      
      const notes = segmentData.map(d => d.note_moyenne!);
      const minNote = notes.length > 0 ? Math.min(...notes) : 0;
      const maxNote = notes.length > 0 ? Math.max(...notes) : 0;

      return { count, totalCap, avgTaux, minNote, maxNote };
    };

    return {
      accessible: { ...calcStats(accessible), items: accessible },
      level: { ...calcStats(level), items: level },
      ambitious: { ...calcStats(ambitious), items: ambitious },
    };
  }, [validData, localUserNote]);

  const [viewingSegment, setViewingSegment] = useState<{
    label: string;
    items: Parcoursup2Data[];
    color: string;
  } | null>(null);

  // Profile Averages
  const profile = useMemo(() => {
    if (validData.length === 0) return null;

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    
    const notes = validData.map(d => d.note_moyenne!);
    const meanNote = avg(notes);
    const stdDevNote = Math.sqrt(avg(notes.map(n => Math.pow(n - meanNote, 2))));

    return {
      meanNote,
      stdDevNote,
      tauxAcces: avg(validData.map(d => d.taux_acces || 0)),
      neoGen: avg(validData.map(d => d.pct_admis_neo_gen)),
      neoTechno: avg(validData.map(d => d.pct_admis_neo_techno)),
      neoPro: avg(validData.map(d => d.pct_admis_neo_pro)),
      boursiers: (() => {
        const totalBoursiers = allDataOfSameType.reduce((sum, d) => sum + (d.eff_admis_boursiers_neo || 0), 0);
        const totalAdmis = allDataOfSameType.reduce((sum, d) => sum + (d.eff_admis_neo || 0), 0);
        return totalAdmis > 0 ? (totalBoursiers / totalAdmis) * 100 : 0;
      })(),
      femmes: avg(validData.map(d => d.pct_admises_filles || 0)),
      mentions: {
        sans: avg(validData.map(d => d.pct_admis_neo_sans_mention || 0)),
        ab: avg(validData.map(d => d.pct_admis_neo_mention_ab || 0)),
        b: avg(validData.map(d => d.pct_admis_neo_mention_b || 0)),
        tb: avg(validData.map(d => d.pct_admis_neo_mention_tb || 0)),
        tbf: avg(validData.map(d => d.pct_admis_neo_mention_tbf || 0)),
      }
    };
  }, [validData]);

  // National Averages for comparison
  const nationalProfile = useMemo(() => {
    const validNational = allDataOfSameType.filter(d => d.note_moyenne !== null);
    if (validNational.length === 0) return null;
    
    let sumNote = 0;
    let sumTaux = 0;
    let sumNeoGen = 0;
    
    for (const d of validNational) {
      sumNote += d.note_moyenne!;
      sumTaux += (d.taux_acces || 0);
      sumNeoGen += (d.pct_admis_neo_gen || 0);
    }
    
    const count = validNational.length;
    return {
      meanNote: sumNote / count,
      tauxAcces: sumTaux / count,
      neoGen: sumNeoGen / count,
    };
  }, [allDataOfSameType]);

  // Local/Departmental Profile for comparison
  const departmentalProfile = useMemo(() => {
    if (!selectedDepartment) return null;
    const departmentalData = allDataOfSameType.filter(d => 
      d.departement.toLowerCase() === selectedDepartment.toLowerCase() && 
      d.note_moyenne !== null
    );
    
    if (departmentalData.length === 0) return null;
    
    let sumNote = 0;
    let sumTaux = 0;
    let sumNeoGen = 0;
    
    for (const d of departmentalData) {
      sumNote += d.note_moyenne!;
      sumTaux += (d.taux_acces || 0);
      sumNeoGen += (d.pct_admis_neo_gen || 0);
    }
    
    const count = departmentalData.length;
    return {
      meanNote: sumNote / count,
      tauxAcces: sumTaux / count,
      neoGen: sumNeoGen / count,
      count
    };
  }, [allDataOfSameType, selectedDepartment]);

  const bacChartData = {
    labels: ['Général', 'Techno', 'Pro'],
    datasets: [
      {
        data: [
          Math.round(profile?.neoGen || 0), 
          Math.round(profile?.neoTechno || 0), 
          Math.round(profile?.neoPro || 0)
        ],
        backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899'],
        borderWidth: 0,
      },
    ],
  };

  const mentionsChartData = {
    labels: ['Sans mention', 'Mention AB', 'Mention B', 'Mention TB', 'Mention TBF'],
    datasets: [
      {
        label: '% des admis',
        data: [
          Math.round(profile?.mentions.sans || 0),
          Math.round(profile?.mentions.ab || 0),
          Math.round(profile?.mentions.b || 0),
          Math.round(profile?.mentions.tb || 0),
          Math.round(profile?.mentions.tbf || 0),
        ],
        backgroundColor: '#6366f1',
        borderRadius: 4,
      },
    ],
  };

  const genderChartData = {
    labels: ['Filles', 'Garçons'],
    datasets: [
      {
        data: [
          Math.round(profile?.femmes || 0), 
          Math.round(100 - (profile?.femmes || 0))
        ],
        backgroundColor: ['#ec4899', '#3b82f6'],
        borderWidth: 0,
      },
    ],
  };

  const isEmpty = validData.length === 0;

  return (
    <div ref={reportRef} className="mt-20 space-y-16 pb-24 relative">
      {/* Header */}
      <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-8 transition-all", isEmpty && "opacity-60")}>
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary-light rounded-[1.5rem] flex items-center justify-center shadow-soft ring-4 ring-white">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Analyse <span className="text-primary">Statistique</span> pour la formation : 
              <span className="block text-2xl md:text-3xl mt-2 text-slate-700">
                {selectedFormations && selectedFormations.length > 0 
                  ? selectedFormations.join(', ') 
                  : 'Toutes les formations'}
              </span>
            </h3>
            <p className="text-slate-500 font-medium text-lg mt-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Basé sur : {[selectedCity, selectedDepartment].filter(Boolean).join(', ') || 'France entière'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {!isEmpty && (
          <div className="flex items-center gap-4 no-print-btn">
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className={cn(
                "flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg",
                isExporting 
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                  : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-xl active:scale-95 shadow-slate-900/20"
              )}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <FileDown className="w-5 h-5" />
                  Télécharger le rapport PDF
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {createPortal(
        <AnimatePresence>
          {viewingSegment && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setViewingSegment(null)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, y: 100, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.95 }}
                className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10"
              >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                  {/* ... same modal content ... */}
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
                      style={{ backgroundColor: viewingSegment.color }}
                    >
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {viewingSegment.label === 'Ambitieux' ? 'Formations Ambitieuses' : 
                         viewingSegment.label === 'Sécure' ? 'Formations Sécures' : 
                         viewingSegment.label === 'Réaliste' ? 'Formations Réalistes' : 
                         `Formations ${viewingSegment.label}`}
                      </h3>
                      <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">{viewingSegment.items.length} formations trouvées</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setViewingSegment(null)}
                    className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                  {viewingSegment.items.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewingSegment.items.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group bg-slate-50 border border-slate-100 p-6 rounded-2xl hover:bg-white hover:shadow-xl hover:border-primary/20 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <h4 className="text-sm font-black text-slate-900 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                {item.etablissement}
                              </h4>
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onShowOnMap) onShowOnMap(item);
                                    setViewingSegment(null);
                                  }}
                                  className="p-2 bg-white border border-slate-100 rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                  title="Affiche sur la carte"
                                >
                                  <MapPin className="w-4 h-4" />
                                </button>
                                {item.lien_parcoursup && (
                                  <a
                                    href={item.lien_parcoursup}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-primary hover:border-primary transition-all shadow-sm"
                                    title="Voir sur Parcoursup"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                            
                            {item.filiere_detaillee && (
                              <p className="text-[11px] font-bold text-primary-dark mb-3 line-clamp-1 opacity-80 italic">
                                {item.filiere_detaillee}
                              </p>
                            )}

                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold mb-4">
                              <MapPin className="w-3 h-3" />
                              {item.commune} ({item.departement})
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">Note moyenne des intégrés</span>
                              <span className="text-base font-black text-slate-900">{item.note_moyenne?.toFixed(1)} <span className="text-xs text-slate-300">/ 20</span></span>
                            </div>
                            <div className="flex flex-col text-right">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Places</span>
                              <span className="text-base font-black text-slate-900">{item.capacite}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
                        <Search className="w-10 h-10 text-slate-200" />
                      </div>
                      <h4 className="text-xl font-black text-slate-900 tracking-tight mb-2">Aucune formation disponible</h4>
                      <p className="text-slate-500 font-medium max-w-sm">
                        Désolé, nous n'avons trouvé aucune formation correspondant à la catégorie <span className="font-bold">{viewingSegment.label}</span> pour ta recherche actuelle.
                      </p>
                      <button 
                        onClick={() => setViewingSegment(null)}
                        className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                      >
                        Retourner au tableau de bord
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Dynamic Filter Bar */}
      <div className="dynamic-filter-bar bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-wrap items-center gap-4 relative z-50">
          {/* Formation Filter */}
          <div className="flex-1 min-w-[200px] relative">
            <button 
              onClick={() => setShowFormationDropdown(!showFormationDropdown)}
              className="w-full h-12 px-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-sm font-bold text-slate-700 hover:bg-slate-100 transition-all"
            >
              <div className="flex items-center gap-2 truncate">
                <GraduationCap className="w-4 h-4 text-primary" />
                <span className="truncate">
                  {selectedFormations && selectedFormations.length > 0 
                    ? `${selectedFormations.length} types sélectionnés` 
                    : 'Toutes les formations'}
                </span>
              </div>
              <ChevronDown className={cn("w-4 h-4 transition-transform", showFormationDropdown && "rotate-180")} />
            </button>
            
            {showFormationDropdown && (
              <>
                <div className="fixed inset-0 z-[60]" onClick={() => setShowFormationDropdown(false)} />
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[70] p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                  <div className="space-y-2">
                    {allFormationTypes.map((type, i) => {
                      const isSelected = selectedFormations?.includes(type);
                      return (
                        <label key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              const newList = isSelected 
                                ? selectedFormations?.filter(t => t !== type) 
                                : [...(selectedFormations || []), type];
                              onFilterChange({ formationTypes: newList });
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm font-bold text-slate-600">{type}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* City Filter */}
          <div className="flex-1 min-w-[200px] relative">
            <div className="relative h-12">
              <input 
                type="text"
                placeholder="Ville (ex: Lyon)"
                value={citySearch}
                onChange={(e) => {
                  setCitySearch(e.target.value);
                  setShowCityDropdown(true);
                  if (e.target.value === '') onFilterChange({ city: '' });
                }}
                onFocus={() => setShowCityDropdown(true)}
                className="w-full h-full pl-12 pr-10 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-inner"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              {citySearch && (
                <button 
                  onClick={() => { setCitySearch(''); onFilterChange({ city: '' }); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {showCityDropdown && citySearch && (
              <>
                <div className="fixed inset-0 z-[60]" onClick={() => setShowCityDropdown(false)} />
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[70] overflow-hidden">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          onFilterChange({ city });
                          setCitySearch(city);
                          setShowCityDropdown(false);
                        }}
                        className="w-full px-5 py-3 text-left text-sm font-bold text-slate-600 hover:bg-primary-light hover:text-primary transition-all flex items-center gap-3"
                      >
                        <Building2 className="w-4 h-4 text-slate-300" />
                        {city}
                      </button>
                    ))
                  ) : (
                    <div className="px-5 py-3 text-sm text-slate-400 italic">Aucune ville trouvée</div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Department Filter */}
          <div className="flex-1 min-w-[200px] relative">
            <div className="relative h-12">
              <input 
                type="text"
                placeholder="Département"
                value={deptSearch}
                onChange={(e) => {
                  setDeptSearch(e.target.value);
                  setShowDeptDropdown(true);
                  if (e.target.value === '') onFilterChange({ department: '' });
                }}
                onFocus={() => setShowDeptDropdown(true)}
                className="w-full h-full pl-12 pr-10 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-inner"
              />
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              {deptSearch && (
                <button 
                  onClick={() => { setDeptSearch(''); onFilterChange({ department: '' }); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {showDeptDropdown && deptSearch && (
              <>
                <div className="fixed inset-0 z-[60]" onClick={() => setShowDeptDropdown(false)} />
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[70] overflow-hidden">
                  {filteredDepts.length > 0 ? (
                    filteredDepts.map((dept, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          onFilterChange({ department: dept });
                          setDeptSearch(dept);
                          setShowDeptDropdown(false);
                        }}
                        className="w-full px-5 py-3 text-left text-sm font-bold text-slate-600 hover:bg-primary-light hover:text-primary transition-all flex items-center gap-3"
                      >
                        <MapPin className="w-4 h-4 text-slate-300" />
                        {dept}
                      </button>
                    ))
                  ) : (
                    <div className="px-5 py-3 text-sm text-slate-400 italic">Aucun département trouvé</div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="h-8 w-px bg-slate-200 hidden lg:block" />

          {/* Reset Filters */}
          <button 
            onClick={() => onFilterChange({ city: '', department: '', formationTypes: [] })}
            className="h-12 px-6 rounded-2xl bg-rose-50 text-rose-500 text-sm font-black uppercase tracking-wider hover:bg-rose-100 transition-all flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Réinitialiser
          </button>
        </div>

      <div className={cn("space-y-16 transition-all duration-500 relative", isEmpty && "grayscale opacity-40 pointer-events-none select-none blur-[1px]")}>
        {isEmpty && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/90 backdrop-blur-md p-10 rounded-[3rem] shadow-2xl border border-slate-200 max-w-md text-center"
            >
              <div className="w-20 h-20 bg-primary-light rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-primary" />
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-4">Aucune statistique à afficher</h4>
              <p className="text-slate-600 font-medium mb-8 leading-relaxed">
                Veuillez sélectionner au moins une formation dans les filtres ci-dessus pour afficher l'analyse statistique détaillée.
              </p>
              <button 
                onClick={() => setShowFormationDropdown(true)}
                className="px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center gap-2 mx-auto"
              >
                <GraduationCap className="w-5 h-5" />
                Choisir une formation
              </button>
            </motion.div>
          </div>
        )}

        {/* Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={isExporting ? false : { opacity: 0, y: 20 }}
          animate={isExporting ? { opacity: 1, y: 0 } : undefined}
          whileInView={isExporting ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -10, shadow: "var(--shadow-hover)" }}
          className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-soft transition-all"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.15em]">Formations</span>
          </div>
          <div className="text-5xl font-black text-slate-900 tracking-tighter">{overview.count}</div>
          <p className="text-sm text-slate-400 mt-2 font-bold">Établissements analysés</p>
        </motion.div>

        <motion.div 
          initial={isExporting ? false : { opacity: 0, y: 20 }}
          animate={isExporting ? { opacity: 1, y: 0 } : undefined}
          whileInView={isExporting ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -10, shadow: "var(--shadow-hover)" }}
          className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-soft transition-all"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.15em]">Places Totales</span>
          </div>
          <div className="text-5xl font-black text-slate-900 tracking-tighter">{overview.totalPlaces.toLocaleString()}</div>
          <p className="text-sm text-slate-400 mt-2 font-bold">Capacité d'accueil cumulée</p>
        </motion.div>

        <motion.div 
          initial={isExporting ? false : { opacity: 0, y: 20 }}
          animate={isExporting ? { opacity: 1, y: 0 } : undefined}
          whileInView={isExporting ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -10, shadow: "var(--shadow-hover)" }}
          className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-soft sm:col-span-2 lg:col-span-1 transition-all"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
              <Target className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.15em]">Sélectivité</span>
          </div>
          <div className="flex items-end gap-3">
            <div className="text-5xl font-black text-slate-900 tracking-tighter">{overview.selectivePct}%</div>
            <div className="text-xs text-slate-400 mb-2 font-black uppercase tracking-wider">Sélectives</div>
          </div>
          <div className="w-full h-4 bg-slate-100 rounded-full mt-6 overflow-hidden p-1 shadow-inner">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${overview.selectivePct}%` }} />
          </div>
        </motion.div>
      </div>

      {/* Profil des Admis Section */}
      <div className="bg-white p-10 md:p-16 rounded-[4rem] border border-slate-100 shadow-soft relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <UserCheck className="w-64 h-64 text-indigo-600" />
        </div>
        
        <div className="flex items-center gap-4 mb-16">
          <div className="w-14 h-14 bg-indigo-50 rounded-[1.25rem] flex items-center justify-center">
            <UserCheck className="w-7 h-7 text-indigo-600" />
          </div>
          <h4 className="text-3xl font-black text-slate-900 tracking-tight">Profil type des admis</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {/* Bac Types */}
          <div className="space-y-8">
            <div className="text-center">
              <span className="text-xs font-black text-slate-400 uppercase tracking-[0.25em] block mb-8">Origine (Bac)</span>
              <div className="h-[220px] flex items-center justify-center">
                <Pie data={bacChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { weight: 'bold', size: 11 }, padding: 20 } } } }} />
              </div>
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-8">
            <div className="text-center">
              <span className="text-xs font-black text-slate-400 uppercase tracking-[0.25em] block mb-8">Répartition Genre</span>
              <div className="h-[220px] flex items-center justify-center">
                <Pie data={genderChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { weight: 'bold', size: 11 }, padding: 20 } } } }} />
              </div>
            </div>
          </div>

          {/* Mentions */}
          <div className="space-y-8">
            <div className="text-center">
              <span className="text-xs font-black text-slate-400 uppercase tracking-[0.25em] block mb-8">Mentions au Bac</span>
              <div className="h-[220px] flex items-center justify-center">
                <Bar 
                  data={mentionsChartData} 
                  options={{ 
                    indexAxis: 'y',
                    maintainAspectRatio: false, 
                    plugins: { legend: { display: false } },
                    scales: { 
                      x: { beginAtZero: true, max: 100, grid: { display: false }, ticks: { font: { size: 10 } } }, 
                      y: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 11 } } } 
                    }
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Section: Accessibility (Left) & Comparison (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Accessibility Section (Left) */}
        <div className={cn(
          "bg-white p-10 md:p-12 rounded-[4rem] border border-slate-100 shadow-soft transition-all duration-700 relative overflow-hidden",
          (localUserNote === null || localUserNote === 0) && "bg-slate-50 border-dashed border-2"
        )}>
          {(localUserNote === null || localUserNote === 0) && (
            <div className="absolute inset-0 z-10 bg-slate-50/60 backdrop-blur-[4px] flex items-center justify-center p-12 text-center">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-10 rounded-[3rem] shadow-hover border border-slate-100 max-w-sm w-full"
              >
                <div className="w-16 h-16 bg-primary-light rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h5 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Potentiel d'admission</h5>
                <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                  Saisis ta moyenne pour débloquer l'analyse prédictive de tes chances d'admission.
                </p>
                <div className="flex flex-col gap-4 items-center justify-center bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 mb-6">
                  <div className="flex items-center gap-4">
                    <input 
                      type="text" 
                      inputMode="decimal"
                      placeholder="--"
                      autoFocus
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                      className="w-24 bg-white border-2 border-slate-100 p-3 rounded-2xl text-3xl font-black text-primary text-center focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    />
                    <span className="text-slate-300 font-black text-2xl">/ 20</span>
                  </div>
                  <button 
                    onClick={handleValidate}
                    disabled={!inputValue || isNaN(parseFloat(inputValue.replace(',', '.')))}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
                  >
                    Valider ma note
                  </button>
                </div>
              </motion.div>
            </div>
          )}
          
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-[1.25rem] flex items-center justify-center">
                <Target className="w-7 h-7 text-emerald-600" />
              </div>
              <h4 className="text-3xl font-black text-slate-900 tracking-tight">Ton Potentiel</h4>
              <p className="text-sm font-bold text-slate-400 mt-1">change ta moyenne attendue pour voir tes chances d'accès aux formations</p>
            </div>
            {localUserNote !== null && (
              <div className="flex items-center gap-4">
                <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-inner">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Ta Note</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={handleValidate}
                        onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                        className="w-14 bg-transparent border-none p-0 text-2xl font-black text-primary focus:ring-0"
                      />
                      <span className="text-slate-300 font-black text-lg">/ 20</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-10">
            {/* Visual Distribution Bar */}
            <div className="relative pt-4 pb-10">
              <div className="flex h-6 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner p-1">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(segments.accessible.count / overview.count) * 100}%` }}
                  className="h-full bg-emerald-500 rounded-full" 
                />
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(segments.level.count / overview.count) * 100}%` }}
                  className="h-full bg-amber-400 rounded-full mx-1" 
                />
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(segments.ambitious.count / overview.count) * 100}%` }}
                  className="h-full bg-rose-500 rounded-full" 
                />
              </div>
              <div className="flex justify-between mt-4 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sécure</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-400 rounded-full" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Réaliste</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-rose-500 rounded-full" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ambitieux</span>
                </div>
              </div>
            </div>

            {/* Detailed Cards */}
            <div className="grid grid-cols-1 gap-6">
              {[
                { 
                  id: 'accessible',
                  label: 'Sécure', 
                  count: segments.accessible.count, 
                  items: segments.accessible.items,
                  color: 'emerald', 
                  icon: CheckCircle2,
                  desc: "Ta note est supérieure à la moyenne des admis.",
                  advice: "C'est ton filet de sécurité."
                },
                { 
                  id: 'level',
                  label: 'Réaliste', 
                  count: segments.level.count, 
                  items: segments.level.items,
                  color: 'amber', 
                  icon: Info,
                  desc: "Ta note correspond exactement au profil type.",
                  advice: "Tes chances sont très sérieuses."
                },
                { 
                  id: 'ambitious',
                  label: 'Ambitieux', 
                  count: segments.ambitious.count, 
                  items: segments.ambitious.items,
                  color: 'rose', 
                  icon: AlertTriangle,
                  desc: "Ta note est un peu juste par rapport aux admis.",
                  advice: "Nécessite un dossier exceptionnel."
                }
              ].map((seg, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ x: 5 }}
                  className={cn(
                    "p-5 rounded-[2.5rem] border transition-all flex flex-col sm:flex-row items-center gap-4 sm:gap-6",
                    seg.color === 'emerald' ? "bg-emerald-50/20 border-emerald-100" :
                    seg.color === 'amber' ? "bg-amber-50/20 border-amber-100" :
                    "bg-rose-50/20 border-rose-100"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-[1rem] flex items-center justify-center shrink-0 shadow-sm",
                    seg.color === 'emerald' ? "bg-white text-emerald-600 border border-emerald-100" :
                    seg.color === 'amber' ? "bg-white text-amber-600 border border-amber-100" :
                    "bg-white text-rose-600 border border-rose-100"
                  )}>
                    <seg.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full self-center sm:self-start", 
                        seg.color === 'emerald' ? "bg-emerald-100 text-emerald-700" :
                        seg.color === 'amber' ? "bg-amber-100 text-amber-700" :
                        "bg-rose-100 text-rose-700"
                      )}>
                        {seg.label}
                      </span>
                      <span className="text-xl font-black text-slate-900 tracking-tighter">
                        {seg.count} <span className="text-[10px] text-slate-400 uppercase font-bold tracking-normal">formations</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {seg.desc} <span className="text-slate-400 italic sm:ml-1">{seg.advice}</span>
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => setViewingSegment({ 
                      label: seg.label, 
                      items: seg.items, 
                      color: seg.color === 'emerald' ? '#10b981' : seg.color === 'amber' ? '#f59e0b' : '#f43f5e'
                    })}
                    className={cn(
                      "group flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all whitespace-nowrap shrink-0",
                      seg.color === 'emerald' ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/10" :
                      seg.color === 'amber' ? "bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/10" :
                      "bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/10"
                    )}
                  >
                    Voir
                    <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Final Advice */}
            <div className="mt-8 p-8 bg-slate-900 rounded-[2.5rem] text-white flex items-start gap-6 shadow-2xl shadow-slate-900/20">
              <div className="p-3 bg-white/10 rounded-2xl">
                <Lightbulb className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold leading-relaxed">
                  {segments.accessible.count > 0 
                    ? `Tu as ${segments.accessible.count} formations "Sécure". C'est excellent pour garantir ton admission !`
                    : "Attention, tu n'as aucune formation 'Sécure'. Pense à élargir tes vœux pour plus de sécurité."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Section (Right) */}
        <div className="bg-white p-10 md:p-12 rounded-[4rem] border border-slate-100 shadow-soft flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-50 rounded-[1.25rem] flex items-center justify-center">
                <MapPin className="w-7 h-7 text-slate-600" />
              </div>
              <h4 className="text-3xl font-black text-slate-900 tracking-tight">Comparaison</h4>
            </div>
          </div>

          <div className="flex-1 flex flex-col space-y-6">
            {loading && !nationalProfile ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-20">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Calcul des statistiques nationales...</p>
              </div>
            ) : (
              [
                { 
                  label: "Formations", 
                  val: departmentalProfile?.count || 0, 
                  nat: allDataOfSameType.length,
                  desc: "Nombre total d'établissements proposant ces filières dans la zone."
                },
                { 
                  label: "Note moyenne admis", 
                  val: departmentalProfile?.meanNote || 0, 
                  nat: nationalProfile?.meanNote || 0, 
                  isNote: true, 
                  hasStar: true,
                  desc: "Note moyenne calculée sur la base des différentes mentions obtenues*"
                },
                { 
                  label: "Taux d'accès moyen", 
                  val: Math.round(departmentalProfile?.tauxAcces || 0), 
                  nat: Math.round(nationalProfile?.tauxAcces || 0), 
                  isPct: true,
                  desc: "Pourcentage moyen de candidats ayant reçu une proposition d'admission."
                },
                { 
                  label: "% Bac Général", 
                  val: Math.round(departmentalProfile?.neoGen || 0), 
                  nat: Math.round(nationalProfile?.neoGen || 0), 
                  isPct: true,
                  desc: "Part des bacheliers généraux parmi l'ensemble des admis."
                }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={isExporting ? false : { opacity: 0, x: 20 }}
                  animate={isExporting ? { opacity: 1, x: 0 } : undefined}
                  whileInView={isExporting ? undefined : { opacity: 1, x: 0 }}
                  transition={{ delay: isExporting ? 0 : i * 0.1 }}
                  className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 group hover:bg-white hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.label}</span>
                  </div>
                  
                  <div className="flex items-end justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">National</span>
                      <div className="text-2xl font-black text-slate-900 tracking-tighter">
                        {item.isNote ? item.nat.toFixed(1) : item.nat}{item.isPct ? '%' : ''}
                      </div>
                    </div>

                    {selectedDepartment && (
                      <div className="flex flex-col text-right">
                        <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest mb-1">{selectedDepartment}</span>
                        <div className="text-4xl font-black text-primary tracking-tighter">
                          {item.isNote ? item.val.toFixed(1) : item.val}{item.isPct ? '%' : ''}
                          {item.hasStar && <span className="text-xl ml-1">*</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200/50">
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed opacity-80 italic">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))
            )}

            {selectedDepartment && (
              <motion.div 
                initial={isExporting ? false : { opacity: 0 }}
                animate={isExporting ? { opacity: 1 } : undefined}
                whileInView={isExporting ? undefined : { opacity: 1 }}
                className="mt-4 p-6 bg-slate-900 rounded-[2.5rem] border border-white/5 shadow-2xl"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <span className="text-white font-black text-lg">*</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-300 font-bold leading-relaxed uppercase tracking-wider">
                      Barème de calcul des mentions :
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      "Très bien (+ félicitations)" = 18, "Très bien" = 18, "Bien" = 15, "Assez bien" = 13, Sans mention = 11
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {!selectedDepartment && (
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                <p className="text-sm text-slate-400 font-black uppercase tracking-widest leading-relaxed">
                  Sélectionnez un département sur la carte pour comparer les statistiques locales au niveau national.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Points clés Section */}
      <div className="bg-slate-900 p-12 md:p-20 rounded-[5rem] text-white shadow-2xl shadow-slate-900/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        </div>

        <div className="flex items-center gap-4 mb-16 relative z-10">
          <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center backdrop-blur-md">
            <Lightbulb className="w-8 h-8 text-primary" />
          </div>
          <h4 className="text-4xl font-black tracking-tight leading-tight">Points clés à retenir</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 relative z-10">
          {[
            pageType === 'general' 
              ? { icon: GraduationCap, text: `${Math.round(profile?.neoGen || 0)}% des admis ont un bac général`, color: 'text-blue-400', bg: 'bg-blue-400/10' }
              : { icon: GraduationCap, text: `${Math.round(profile?.neoPro || 0)}% des admis ont un bac pro`, color: 'text-pink-400', bg: 'bg-pink-400/10' },
            { icon: Target, text: `Note moyenne requise : ${(profile?.meanNote || 0).toFixed(1)}/20`, color: 'text-primary', bg: 'bg-primary/10' },
            { icon: UserCheck, text: `${Math.round(100 - (profile?.mentions.sans || 0))}% des admis ont une mention`, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { icon: Users, text: `${Math.round(profile?.boursiers || 0)}% de boursiers parmi les admis`, color: 'text-purple-400', bg: 'bg-purple-400/10' }
          ].map((item, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -10 }}
              className="flex flex-col gap-6 p-10 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all"
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", item.bg)}>
                <item.icon className={`w-7 h-7 ${item.color}`} />
              </div>
              <p className="font-black text-lg leading-tight tracking-tight">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
