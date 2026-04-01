import React, { useMemo, useState, useEffect } from 'react';
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
  userNote: number;
  selectedDepartment?: string;
  allDataOfSameType: Parcoursup2Data[];
}

export default function StatsPanel({ data, userNote, selectedDepartment, allDataOfSameType }: StatsPanelProps) {
  const [localUserNote, setLocalUserNote] = useState(userNote);

  // Sync with prop if it changes from outside
  useEffect(() => {
    setLocalUserNote(userNote);
  }, [userNote]);

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
        data: [profile?.neoGen || 0, profile?.neoTechno || 0, profile?.neoPro || 0],
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
          profile?.mentions.sans || 0,
          profile?.mentions.ab || 0,
          profile?.mentions.b || 0,
          profile?.mentions.tb || 0,
          profile?.mentions.tbf || 0,
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
        data: [profile?.femmes || 0, 100 - (profile?.femmes || 0)],
        backgroundColor: ['#ec4899', '#3b82f6'],
        borderWidth: 0,
      },
    ],
  };

  if (validData.length === 0) return null;

  return (
    <div className="mt-16 space-y-12 pb-20">
      {/* Header with Note Input */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center shadow-lg shadow-primary-light/20">
            <TrendingUp className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Analyse Statistique Détaillée</h3>
            <p className="text-slate-500 font-medium">Basé sur ton profil et les formations trouvées</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ta moyenne</span>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                min="10" 
                max="20" 
                step="0.1"
                value={localUserNote}
                onChange={(e) => setLocalUserNote(parseFloat(e.target.value) || 10)}
                className="w-16 bg-slate-50 border-none p-1 rounded-lg text-xl font-black text-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-slate-300 font-black">/ 20</span>
            </div>
          </div>
          <div className="w-px h-10 bg-slate-100" />
          <p className="text-[10px] text-slate-400 font-bold leading-tight max-w-[120px]">
            Modifie ta note pour voir l'impact sur les stats
          </p>
        </div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Formations</span>
          </div>
          <div className="text-4xl font-black text-slate-900">{overview.count}</div>
          <p className="text-xs text-slate-400 mt-1 font-bold">Établissements analysés</p>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Places Totales</span>
          </div>
          <div className="text-4xl font-black text-slate-900">{overview.totalPlaces.toLocaleString()}</div>
          <p className="text-xs text-slate-400 mt-1 font-bold">Capacité d'accueil cumulée</p>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
              <Target className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Sélectivité</span>
          </div>
          <div className="flex items-end gap-2">
            <div className="text-4xl font-black text-slate-900">{overview.selectivePct}%</div>
            <div className="text-xs text-slate-400 mb-1 font-black uppercase">Sélectives</div>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-purple-500" style={{ width: `${overview.selectivePct}%` }} />
          </div>
        </div>
      </div>

      {/* Profil des Admis Section */}
      <div className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-indigo-600" />
          </div>
          <h4 className="text-2xl font-black text-slate-900 tracking-tight">Profil des admis</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Bac Types */}
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4">Type de Bac</span>
              <div className="h-[200px] flex items-center justify-center">
                <Pie data={bacChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { weight: 'bold', size: 10 } } } } }} />
              </div>
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4">Répartition Genre</span>
              <div className="h-[200px] flex items-center justify-center">
                <Pie data={genderChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { weight: 'bold', size: 10 } } } } }} />
              </div>
            </div>
          </div>

          {/* Mentions */}
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4">Distribution Mentions</span>
              <div className="h-[200px] flex items-center justify-center">
                <Bar 
                  data={mentionsChartData} 
                  options={{ 
                    indexAxis: 'y',
                    maintainAspectRatio: false, 
                    plugins: { legend: { display: false } },
                    scales: { x: { beginAtZero: true, max: 100, ticks: { font: { size: 9 } } }, y: { ticks: { font: { weight: 'bold', size: 10 } } } }
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Section: Accessibility (Left) & Comparison (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Accessibility Section (Left) */}
        <div className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 className="text-2xl font-black text-slate-900 tracking-tight">Ton Potentiel d'Admission</h4>
            </div>
            <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase block leading-none mb-1">Ta Note</span>
              <span className="text-lg font-black text-primary">{localUserNote.toFixed(1)}/20</span>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Visual Distribution Bar */}
            <div className="relative pt-2 pb-6">
              <div className="flex h-4 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${(segments.accessible.count / overview.count) * 100}%` }}
                />
                <div 
                  className="h-full bg-amber-400 transition-all duration-1000" 
                  style={{ width: `${(segments.level.count / overview.count) * 100}%` }}
                />
                <div 
                  className="h-full bg-rose-500 transition-all duration-1000" 
                  style={{ width: `${(segments.ambitious.count / overview.count) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 px-1">
                <span className="text-[9px] font-black text-emerald-600 uppercase">Sécure</span>
                <span className="text-[9px] font-black text-amber-600 uppercase">Réaliste</span>
                <span className="text-[9px] font-black text-rose-600 uppercase">Ambitieux</span>
              </div>
            </div>

            {/* Detailed Cards */}
            <div className="grid grid-cols-1 gap-4">
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
                <div key={i} className={cn(
                  "p-5 rounded-3xl border transition-all hover:shadow-md flex items-center gap-5",
                  seg.color === 'emerald' ? "bg-emerald-50/30 border-emerald-100" :
                  seg.color === 'amber' ? "bg-amber-50/30 border-amber-100" :
                  "bg-rose-50/30 border-rose-100"
                )}>
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                    seg.color === 'emerald' ? "bg-emerald-500 text-white" :
                    seg.color === 'amber' ? "bg-amber-400 text-white" :
                    "bg-rose-500 text-white"
                  )}>
                    <seg.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("text-xs font-black uppercase tracking-wider", `text-${seg.color}-600`)}>
                        {seg.label}
                      </span>
                      <span className="text-lg font-black text-slate-900">
                        {seg.count} <span className="text-[10px] text-slate-400 uppercase font-bold">formations</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-tight">
                      {seg.desc} <span className="text-slate-400 italic">{seg.advice}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Final Advice */}
            <div className="mt-6 p-5 bg-slate-900 rounded-[2rem] text-white flex items-start gap-4">
              <div className="p-2 bg-white/10 rounded-xl">
                <Lightbulb className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold leading-relaxed">
                  {segments.accessible.count > 0 
                    ? `Tu as ${segments.accessible.count} formations "Sécure". C'est excellent pour garantir ton admission !`
                    : "Attention, tu n'as aucune formation 'Sécure'. Pense à élargir tes vœux pour plus de sécurité."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Section (Right) */}
        <div className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-slate-600" />
              </div>
              <h4 className="text-2xl font-black text-slate-900 tracking-tight">Comparaison</h4>
            </div>
            {selectedDepartment && (
              <div className="px-4 py-1.5 bg-primary-light text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                {selectedDepartment}
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className={cn("grid gap-y-6", selectedDepartment ? "grid-cols-2 gap-x-8" : "grid-cols-1")}>
              <div className={cn("grid text-center pb-4 border-b border-slate-100", selectedDepartment ? "col-span-2 grid-cols-2" : "grid-cols-1")}>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">National</div>
                {selectedDepartment && (
                  <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{selectedDepartment}</div>
                )}
              </div>

              {[
                { label: "Formations", val: validData.length, nat: nationalData.length },
                { label: "Note moyenne admis", val: profile?.meanNote || 0, nat: nationalProfile?.meanNote || 0, isNote: true },
                { label: "Taux d'accès moyen", val: Math.round(profile?.tauxAcces || 0), nat: Math.round(nationalProfile?.tauxAcces || 0), isPct: true },
                { label: "% Bac Général", val: Math.round(profile?.neoGen || 0), nat: Math.round(nationalProfile?.neoGen || 0), isPct: true }
              ].map((item, i) => (
                <React.Fragment key={i}>
                  <div className={cn("text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2", selectedDepartment ? "col-span-2" : "col-span-1")}>{item.label}</div>
                  <div className={cn("text-xl font-black text-center", selectedDepartment ? "text-slate-400" : "text-slate-900")}>
                    {item.isNote ? item.nat.toFixed(1) : item.nat}{item.isPct ? '%' : ''}
                  </div>
                  {selectedDepartment && (
                    <div className="text-xl font-black text-primary text-center">{item.isNote ? item.val.toFixed(1) : item.val}{item.isPct ? '%' : ''}</div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {!selectedDepartment && (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wide">Sélectionnez un département pour comparer</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Points clés Section */}
      <div className="bg-slate-900 p-10 md:p-12 rounded-[4rem] text-white shadow-2xl shadow-slate-900/20">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <Lightbulb className="w-6 h-6 text-primary" />
          </div>
          <h4 className="text-2xl font-black tracking-tight">Points clés à retenir</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: GraduationCap, text: `${Math.round(profile?.neoGen || 0)}% des admis ont un bac général`, color: 'text-blue-400' },
            { icon: Target, text: `Note moyenne requise : ${(profile?.meanNote || 0).toFixed(1)}/20`, color: 'text-primary' },
            { icon: UserCheck, text: `${Math.round(100 - (profile?.mentions.sans || 0))}% des admis ont une mention`, color: 'text-emerald-400' },
            { icon: Users, text: `${Math.round(profile?.boursiers || 0)}% de boursiers parmi les admis`, color: 'text-purple-400' }
          ].map((item, i) => (
            <div key={i} className="flex flex-col gap-4 p-6 bg-white/5 rounded-[2rem] hover:bg-white/10 transition-colors">
              <item.icon className={`w-8 h-8 ${item.color}`} />
              <p className="font-bold text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
