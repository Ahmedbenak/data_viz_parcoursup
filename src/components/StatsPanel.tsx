import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  RadialLinearScale,
} from 'chart.js';
import { Bar, Pie, Radar } from 'react-chartjs-2';
import { 
  TrendingUp, 
  Users, 
  Target, 
  AlertTriangle, 
  Info,
  CheckCircle2,
  ArrowUpRight,
  GraduationCap,
  MapPin,
  Lightbulb,
  UserCheck,
  BarChart3,
  ChevronRight,
  Minus
} from 'lucide-react';

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
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

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

interface StatsPanelProps {
  data: Parcoursup2Data[];
  userNote?: number | null;
  selectedDepartment?: string;
  allDataOfSameType: Parcoursup2Data[];
}

export default function StatsPanel({ data, userNote, selectedDepartment, allDataOfSameType }: StatsPanelProps) {
  const [localUserNote, setLocalUserNote] = useState<number | null>(userNote || null);
  const [inputValue, setInputValue] = useState<string>(userNote ? userNote.toString() : '');

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

  // Filter out NaN note_moyenne
  const validData = useMemo(() => data.filter(d => d.note_moyenne !== null), [data]);
  const nationalData = useMemo(() => allDataOfSameType.filter(d => d.note_moyenne !== null), [allDataOfSameType]);

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
      accessible: calcStats(accessible),
      level: calcStats(level),
      ambitious: calcStats(ambitious),
    };
  }, [validData, localUserNote]);

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
    if (nationalData.length === 0) return null;
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    
    return {
      meanNote: avg(nationalData.map(d => d.note_moyenne!)),
      tauxAcces: avg(nationalData.map(d => d.taux_acces || 0)),
      neoGen: avg(nationalData.map(d => d.pct_admis_neo_gen)),
    };
  }, [nationalData]);

  // Charts Data
  const accessibilityChartData = {
    labels: ['Accessibles', 'À votre niveau', 'Ambitieuses'],
    datasets: [
      {
        label: 'Nombre de formations',
        data: [segments.accessible.count, segments.level.count, segments.ambitious.count],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderRadius: 8,
      },
    ],
  };

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

  if (validData.length === 0) return null;

  return (
    <div className="mt-20 space-y-16 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary-light rounded-[1.5rem] flex items-center justify-center shadow-soft ring-4 ring-white">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">Analyse <span className="text-primary">Statistique</span></h3>
            <p className="text-slate-500 font-medium text-xl">Décryptage de ton profil et des opportunités</p>
          </div>
        </div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
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
                  label: 'Sécure', 
                  count: segments.accessible.count, 
                  color: 'emerald', 
                  icon: CheckCircle2,
                  desc: "Ta note est supérieure à la moyenne des admis.",
                  advice: "C'est ton filet de sécurité."
                },
                { 
                  label: 'Réaliste', 
                  count: segments.level.count, 
                  color: 'amber', 
                  icon: Info,
                  desc: "Ta note correspond exactement au profil type.",
                  advice: "Tes chances sont très sérieuses."
                },
                { 
                  label: 'Ambitieux', 
                  count: segments.ambitious.count, 
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
                    "p-6 rounded-[2rem] border transition-all flex items-center gap-6",
                    seg.color === 'emerald' ? "bg-emerald-50/30 border-emerald-100" :
                    seg.color === 'amber' ? "bg-amber-50/30 border-amber-100" :
                    "bg-rose-50/30 border-rose-100"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-soft",
                    seg.color === 'emerald' ? "bg-emerald-500 text-white" :
                    seg.color === 'amber' ? "bg-amber-400 text-white" :
                    "bg-rose-500 text-white"
                  )}>
                    <seg.icon className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn("text-xs font-black uppercase tracking-[0.2em]", `text-${seg.color}-600`)}>
                        {seg.label}
                      </span>
                      <span className="text-2xl font-black text-slate-900 tracking-tighter">
                        {seg.count} <span className="text-[10px] text-slate-400 uppercase font-bold tracking-normal">formations</span>
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium leading-snug">
                      {seg.desc} <span className="text-slate-400 italic block mt-1">{seg.advice}</span>
                    </p>
                  </div>
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
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-50 rounded-[1.25rem] flex items-center justify-center">
                <MapPin className="w-7 h-7 text-slate-600" />
              </div>
              <h4 className="text-3xl font-black text-slate-900 tracking-tight">Comparaison</h4>
            </div>
            {selectedDepartment && (
              <div className="px-5 py-2 bg-primary-light text-primary rounded-full text-xs font-black uppercase tracking-[0.15em] border border-primary/10">
                {selectedDepartment}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-12">
            <div className={cn("grid gap-y-10", selectedDepartment ? "grid-cols-2 gap-x-12" : "grid-cols-1")}>
              <div className={cn("grid text-center pb-6 border-b border-slate-100", selectedDepartment ? "col-span-2 grid-cols-2" : "grid-cols-1")}>
                <div className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">National</div>
                {selectedDepartment && (
                  <div className="text-xs font-black text-primary uppercase tracking-[0.3em]">{selectedDepartment}</div>
                )}
              </div>

              {[
                { label: "Formations", val: validData.length, nat: nationalData.length },
                { label: "Note moyenne admis", val: profile?.meanNote || 0, nat: nationalProfile?.meanNote || 0, isNote: true },
                { label: "Taux d'accès moyen", val: Math.round(profile?.tauxAcces || 0), nat: Math.round(nationalProfile?.tauxAcces || 0), isPct: true },
                { label: "% Bac Général", val: Math.round(profile?.neoGen || 0), nat: Math.round(nationalProfile?.neoGen || 0), isPct: true }
              ].map((item, i) => (
                <React.Fragment key={i}>
                  <div className={cn("text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-4", selectedDepartment ? "col-span-2" : "col-span-1")}>{item.label}</div>
                  <div className={cn("text-3xl font-black text-center tracking-tighter", selectedDepartment ? "text-slate-400" : "text-slate-900")}>
                    {item.isNote ? item.nat.toFixed(1) : item.nat}{item.isPct ? '%' : ''}
                  </div>
                  {selectedDepartment && (
                    <div className="text-3xl font-black text-primary text-center tracking-tighter">{item.isNote ? item.val.toFixed(1) : item.val}{item.isPct ? '%' : ''}</div>
                  )}
                </React.Fragment>
              ))}
            </div>

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
            { icon: GraduationCap, text: `${Math.round(profile?.neoGen || 0)}% des admis ont un bac général`, color: 'text-blue-400', bg: 'bg-blue-400/10' },
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
  );
}
