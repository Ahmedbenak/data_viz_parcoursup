import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Check, 
  ChevronRight, 
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
  individualSpecialties: string[];
  loadingSpecialties: boolean;
  allFormationTypes: string[];
}

export interface OnboardingData {
  specialty1: string;
  specialty2: string;
  specialty: string;
  averageBac: string;
  targetFormationTypes: string[];
}

export default function OnboardingQuestionnaire({ onComplete, specialties, individualSpecialties, loadingSpecialties, allFormationTypes }: OnboardingProps) {
  const [data, setData] = useState<OnboardingData>({
    specialty1: '',
    specialty2: '',
    specialty: '',
    averageBac: '',
    targetFormationTypes: []
  });
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');
  const [showFormationSuggestions, setShowFormationSuggestions] = useState(false);

  const filtered1 = individualSpecialties.filter(s => 
    s.toLowerCase().includes(search1.toLowerCase())
  );

  const filtered2 = individualSpecialties.filter(s => 
    s.toLowerCase().includes(search2.toLowerCase()) && s !== data.specialty1
  );

  const isValidCombination = React.useMemo(() => {
    if (!data.specialty1 || !data.specialty2) return false;
    
    // Check if any string in the database contains both selected specialties
    return specialties.some(s => 
      s.includes(data.specialty1) && s.includes(data.specialty2)
    );
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
    const actualSpecialty = specialties.find(s => 
      s.includes(data.specialty1) && s.includes(data.specialty2)
    );
    
    if (!actualSpecialty) return;

    // We pass back a structure that App.tsx expects
    onComplete({
      ...data,
      specialty: actualSpecialty
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 sm:p-12">
      <div className="max-w-6xl w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white p-10 sm:p-16 rounded-[4rem] shadow-soft border border-slate-100 relative overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full -ml-32 -mb-32 blur-3xl" />

          <div className="mb-16 text-center relative z-10">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="w-20 h-20 bg-primary-light rounded-[2rem] flex items-center justify-center mb-6 mx-auto shadow-lg shadow-primary/10"
            >
              <GraduationCap className="w-10 h-10 text-primary" />
            </motion.div>
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter">Configure ton profil</h2>
            <p className="text-slate-500 font-medium text-lg">Sélectionne tes deux spécialités et ta moyenne attendue.</p>
          </div>

          <div className="space-y-12 relative z-10">
            {/* Specialties Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Specialty 1 */}
              <div className="space-y-6">
                <label className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[11px] shadow-lg shadow-primary/20">1</div>
                  Première Spécialité
                </label>
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text"
                    placeholder="Rechercher une spécialité..."
                    value={search1}
                    onChange={(e) => setSearch1(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-primary/20 focus:bg-white transition-all text-base font-bold outline-none shadow-sm"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 max-h-[320px] overflow-y-auto p-2 custom-scrollbar bg-slate-50/50 rounded-[2rem] border border-slate-100">
                  {filtered1.map((spec) => (
                    <motion.button
                      key={spec}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setData({ ...data, specialty1: spec });
                        if (data.specialty2 === spec) setData(prev => ({ ...prev, specialty1: spec, specialty2: '' }));
                      }}
                      className={cn(
                        "px-6 py-4 rounded-2xl border-2 text-sm font-black transition-all text-left flex items-center justify-between group",
                        data.specialty1 === spec 
                          ? "bg-primary border-primary text-white shadow-xl shadow-primary/20" 
                          : "bg-white border-transparent text-slate-600 hover:border-primary/10 hover:shadow-md"
                      )}
                    >
                      <span className="line-clamp-1">{spec}</span>
                      {data.specialty1 === spec && <Check className="w-4 h-4 flex-shrink-0" />}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Specialty 2 */}
              <div className="space-y-6">
                <label className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[11px] shadow-lg shadow-primary/20">2</div>
                  Deuxième Spécialité
                </label>
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text"
                    placeholder="Rechercher une spécialité..."
                    value={search2}
                    onChange={(e) => setSearch2(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-primary/20 focus:bg-white transition-all text-base font-bold outline-none shadow-sm"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 max-h-[320px] overflow-y-auto p-2 custom-scrollbar bg-slate-50/50 rounded-[2rem] border border-slate-100">
                  {filtered2.map((spec) => (
                    <motion.button
                      key={spec}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setData({ ...data, specialty2: spec })}
                      className={cn(
                        "px-6 py-4 rounded-2xl border-2 text-sm font-black transition-all text-left flex items-center justify-between group",
                        data.specialty2 === spec 
                          ? "bg-primary border-primary text-white shadow-xl shadow-primary/20" 
                          : "bg-white border-transparent text-slate-600 hover:border-primary/10 hover:shadow-md"
                      )}
                    >
                      <span className="line-clamp-1">{spec}</span>
                      {data.specialty2 === spec && <Check className="w-4 h-4 flex-shrink-0" />}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Section: Average, Formation & Action */}
            <div className="pt-12 border-t border-slate-100 flex flex-col gap-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Average Bac */}
                <div className="flex flex-col gap-4">
                  <label className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[11px] shadow-lg shadow-primary/20">3</div>
                    Ta moyenne attendue au bac
                  </label>
                  <div className="flex items-center gap-8 bg-slate-50 px-8 py-5 rounded-[2rem] border border-slate-100 relative group focus-within:border-primary/20 transition-all">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        <input 
                          type="text"
                          inputMode="decimal"
                          placeholder="14.5"
                          value={data.averageBac}
                          onChange={handleAverageChange}
                          className={cn(
                            "w-24 bg-transparent border-none p-0 focus:ring-0 text-4xl font-black transition-colors outline-none",
                            data.averageBac && !isAverageValid ? "text-rose-500" : "text-primary placeholder:text-slate-200"
                          )}
                        />
                        <span className="text-slate-300 font-black text-2xl">/ 20</span>
                      </div>
                    </div>
                    <div className="w-px h-12 bg-slate-200" />
                    <div className="hidden sm:block">
                      <p className="text-[11px] text-slate-400 font-bold leading-relaxed max-w-[180px] uppercase tracking-wider">
                        Utilisée pour trouver les formations qui te correspondent le mieux.
                      </p>
                    </div>
                    
                    {data.averageBac && !isAverageValid && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-8 left-0 flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        <span>La moyenne doit être entre 10 et 20</span>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Target Formation Type */}
                <div className="flex flex-col gap-4">
                  <label className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[11px] shadow-lg shadow-primary/20">4</div>
                    Type de formation visé
                  </label>
                  <div className="relative">
                    <button 
                      onClick={() => setShowFormationSuggestions(!showFormationSuggestions)}
                      className="w-full text-lg font-bold text-slate-900 bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all flex items-center justify-between shadow-sm"
                    >
                      <span className="truncate">
                        {data.targetFormationTypes.length === 0 
                          ? "Sélectionne tes préférences" 
                          : `${data.targetFormationTypes.length} sélectionnée(s)`}
                      </span>
                      <ChevronRight className={cn("w-6 h-6 transition-transform", showFormationSuggestions && "rotate-90")} />
                    </button>
                    
                    {showFormationSuggestions && (
                      <>
                        <div className="fixed inset-0 z-[100]" onClick={() => setShowFormationSuggestions(false)} />
                        <div className="absolute bottom-full mb-4 left-0 right-0 bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-[110] max-h-64 overflow-y-auto custom-scrollbar p-4 space-y-2">
                          {allFormationTypes.map((type, i) => {
                            const isSelected = data.targetFormationTypes.includes(type);
                            return (
                              <label 
                                key={i} 
                                className={cn(
                                  "flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors",
                                  isSelected ? "bg-primary-light" : "hover:bg-slate-50"
                                )}
                              >
                                <input 
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    setData(prev => ({
                                      ...prev,
                                      targetFormationTypes: isSelected 
                                        ? prev.targetFormationTypes.filter(t => t !== type)
                                        : [...prev.targetFormationTypes, type]
                                    }));
                                  }}
                                  className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                                />
                                <span className={cn("text-sm font-bold", isSelected ? "text-primary" : "text-slate-600")}>{type}</span>
                              </label>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
                <div className="flex flex-col gap-4 w-full lg:w-auto">
                  {data.specialty1 && data.specialty2 && !isValidCombination && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-rose-500 text-[11px] font-black uppercase tracking-widest flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      ⚠️ Cette combinaison de spécialités n'est pas disponible.
                    </motion.p>
                  )}
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleComplete}
                  disabled={!isValidCombination || !isAverageValid || data.targetFormationTypes.length === 0}
                  className="w-full lg:w-auto bg-primary text-white px-16 py-6 rounded-[2rem] font-black text-xl hover:bg-primary-hover transition-all flex items-center justify-center gap-4 shadow-2xl shadow-primary/30 active:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale disabled:shadow-none"
                >
                  Analyser mon profil <ChevronRight className="w-6 h-6" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
