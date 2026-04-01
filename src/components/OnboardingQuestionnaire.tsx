import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Check, 
  ChevronRight, 
  Target, 
  Search,
  GraduationCap
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
  specialties: string[];
  loadingSpecialties: boolean;
}

export interface OnboardingData {
  specialty1: string;
  specialty2: string;
  specialty: string;
  averageBac: string;
}

const UNIQUE_SPECIALTIES = [
  "Art",
  "Biologie/Ecologie",
  "Histoire-Géographie, Géopolitique et Sciences politiques",
  "Humanités, Littérature et Philosophie",
  "Langues, littératures et cultures étrangères et régionales",
  "Littérature et langues et cultures de l'Antiquité",
  "Mathématiques",
  "Numérique et Sciences Informatiques",
  "Physique-Chimie",
  "Sciences Economiques et Sociales",
  "Sciences de l'ingénieur",
  "Sciences de la vie et de la Terre",
  "Éducation physique, pratiques et culture sportives"
];

export default function OnboardingQuestionnaire({ onComplete, specialties, loadingSpecialties }: OnboardingProps) {
  const [data, setData] = useState<OnboardingData>({
    specialty1: '',
    specialty2: '',
    specialty: '',
    averageBac: ''
  });
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');

  const filtered1 = UNIQUE_SPECIALTIES.filter(s => 
    s.toLowerCase().includes(search1.toLowerCase())
  );

  const filtered2 = UNIQUE_SPECIALTIES.filter(s => 
    s.toLowerCase().includes(search2.toLowerCase()) && s !== data.specialty1
  );

  const isValidCombination = React.useMemo(() => {
    if (!data.specialty1 || !data.specialty2) return false;
    if (specialties.length === 0) return true; // Fallback if data hasn't loaded yet to avoid blocking UI
    
    // Check if any string in the database contains both selected specialties
    // We use a more flexible match (lowercase and partial)
    return specialties.some(s => {
      const lowerS = s.toLowerCase();
      const spec1 = data.specialty1.toLowerCase();
      const spec2 = data.specialty2.toLowerCase();
      return lowerS.includes(spec1) && lowerS.includes(spec2);
    });
  }, [data.specialty1, data.specialty2, specialties]);

  const handleAverageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(',', '.');
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setData({ ...data, averageBac: value });
    }
  };

  const isAverageValid = React.useMemo(() => {
    if (!data.averageBac) return false;
    const val = parseFloat(data.averageBac);
    return !isNaN(val) && val >= 10 && val <= 20;
  }, [data.averageBac]);

  const handleComplete = () => {
    if (!isAverageValid) return;
    
    // Find the actual string in the database that contains both
    const actualSpecialty = specialties.find(s => {
      const lowerS = s.toLowerCase();
      const spec1 = data.specialty1.toLowerCase();
      const spec2 = data.specialty2.toLowerCase();
      return lowerS.includes(spec1) && lowerS.includes(spec2);
    }) || `${data.specialty1}, ${data.specialty2}`; // Fallback string if not found in DB
    
    // We pass back a structure that App.tsx expects
    onComplete({
      ...data,
      specialty: actualSpecialty
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Progress Bar - Removed as it's now a single page */}
      
      <div className="max-w-5xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 sm:p-10 rounded-[3rem] shadow-2xl shadow-primary-light/30 border border-slate-100"
        >
          <div className="mb-8 text-center">
            <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <GraduationCap className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Configure ton profil</h2>
            <p className="text-slate-500 font-medium">Sélectionne tes deux spécialités et ta moyenne.</p>
          </div>

          <div className="space-y-8">
            {/* Specialties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Specialty 1 */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">1</div>
                  Première Spécialité
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Rechercher..."
                    value={search1}
                    onChange={(e) => setSearch1(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-primary focus:bg-white transition-all text-sm font-bold"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-[280px] overflow-y-auto p-1 custom-scrollbar">
                  {filtered1.map((spec) => (
                    <button
                      key={spec}
                      onClick={() => {
                        setData({ ...data, specialty1: spec });
                        if (data.specialty2 === spec) setData(prev => ({ ...prev, specialty1: spec, specialty2: '' }));
                      }}
                      className={cn(
                        "px-4 py-3 rounded-xl border-2 text-xs font-bold transition-all text-left flex items-center justify-between group",
                        data.specialty1 === spec 
                          ? "bg-primary border-primary text-white shadow-md shadow-primary-light" 
                          : "bg-white border-slate-100 text-slate-600 hover:border-primary/20"
                      )}
                    >
                      <span className="line-clamp-1">{spec}</span>
                      {data.specialty1 === spec && <Check className="w-3 h-3 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specialty 2 */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">2</div>
                  Deuxième Spécialité
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Rechercher..."
                    value={search2}
                    onChange={(e) => setSearch2(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-primary focus:bg-white transition-all text-sm font-bold"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-[280px] overflow-y-auto p-1 custom-scrollbar">
                  {filtered2.map((spec) => (
                    <button
                      key={spec}
                      onClick={() => setData({ ...data, specialty2: spec })}
                      className={cn(
                        "px-4 py-3 rounded-xl border-2 text-xs font-bold transition-all text-left flex items-center justify-between group",
                        data.specialty2 === spec 
                          ? "bg-primary border-primary text-white shadow-md shadow-primary-light" 
                          : "bg-white border-slate-100 text-slate-600 hover:border-primary/20"
                      )}
                    >
                      <span className="line-clamp-1">{spec}</span>
                      {data.specialty2 === spec && <Check className="w-3 h-3 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Section: Average & Action */}
            <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">3</div>
                  Ta moyenne attendue au bac
                </label>
                <div className="flex items-center gap-6 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 relative">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        inputMode="decimal"
                        placeholder="14.5"
                        value={data.averageBac}
                        onChange={handleAverageChange}
                        className={cn(
                          "w-20 bg-transparent border-none p-0 focus:ring-0 text-2xl font-black transition-colors",
                          data.averageBac && !isAverageValid ? "text-rose-500" : "text-primary placeholder:text-slate-300"
                        )}
                      />
                      <span className="text-slate-300 font-black text-lg">/ 20</span>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-slate-200" />
                  <div className="hidden sm:block">
                    <p className="text-[10px] text-slate-400 font-bold leading-tight max-w-[150px]">
                      Utilisée pour trouver les formations qui te correspondent le mieux.
                    </p>
                  </div>
                  
                  {data.averageBac && !isAverageValid && (
                    <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-rose-500 text-[9px] font-black uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
                      <span>La moyenne doit être entre 10 et 20</span>
                    </div>
                  )}
                </div>
                
                {data.specialty1 && data.specialty2 && !isValidCombination && (
                  <p className="text-rose-500 text-[10px] font-bold animate-pulse">
                    ⚠️ Cette combinaison de spécialités n'est pas disponible.
                  </p>
                )}
              </div>

              <button 
                onClick={handleComplete}
                disabled={!isValidCombination || !isAverageValid}
                className="w-full md:w-auto bg-primary text-white px-12 py-5 rounded-2xl font-black text-lg hover:bg-primary-hover transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary-light active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
              >
                Analyser mon profil <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
