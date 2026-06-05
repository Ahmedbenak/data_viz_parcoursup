import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Search,
  GraduationCap,
  MapPin,
  TrendingUp,
  LayoutGrid,
  Sparkles
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
  allDepartments: string[];
  onBack?: () => void;
}

export interface OnboardingData {
  specialty1: string;
  specialty2: string;
  specialty: string;
  averageBac: string;
  targetFormationTypes: string[];
  department: string;
}

export default function OnboardingQuestionnaire({ 
  onComplete, 
  specialties, 
  individualSpecialties, 
  loadingSpecialties, 
  allFormationTypes,
  allDepartments,
  onBack
}: OnboardingProps) {
  const [step, setStep] = useState<number>(1);
  const [data, setData] = useState<OnboardingData>({
    specialty1: '',
    specialty2: '',
    specialty: '',
    averageBac: '',
    targetFormationTypes: [],
    department: ''
  });
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');
  const [deptSearch, setDeptSearch] = useState('');

  // Filtering lists
  const filtered1 = useMemo(() => {
    return individualSpecialties.filter(s => 
      s.toLowerCase().includes(search1.toLowerCase())
    );
  }, [individualSpecialties, search1]);

  // For specialty 2, we must ensure it's not specialty 1, and that there is a valid combination in specialties database
  const filtered2 = useMemo(() => {
    return individualSpecialties.filter(s => {
      if (s === data.specialty1) return false;
      if (!s.toLowerCase().includes(search2.toLowerCase())) return false;
      // Ensure the combination [specialty1, s] exists somewhere in our specialties array
      return specialties.some(comb => 
        comb.includes(data.specialty1) && comb.includes(s)
      );
    });
  }, [individualSpecialties, data.specialty1, search2, specialties]);

  const filteredDepts = useMemo(() => {
    return allDepartments.filter(d => 
      d.toLowerCase().includes(deptSearch.toLowerCase())
    ).slice(0, 12);
  }, [allDepartments, deptSearch]);

  const isValidCombination = useMemo(() => {
    if (!data.specialty1 || !data.specialty2) return false;
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

  const isAverageValid = useMemo(() => {
    if (!data.averageBac) return false;
    const val = parseFloat(data.averageBac);
    return !isNaN(val) && val >= 10 && val <= 20;
  }, [data.averageBac]);

  const handleNextStep = () => {
    if (step === 1 && data.specialty1) {
      setStep(2);
    } else if (step === 2 && data.specialty2 && isValidCombination) {
      setStep(3);
    } else if (step === 3 && isAverageValid) {
      setStep(4);
    } else if (step === 4 && data.targetFormationTypes.length > 0) {
      setStep(5);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const handleComplete = () => {
    if (!isAverageValid || !data.department) return;
    
    // Find the actual string in the database that contains both
    const actualSpecialty = specialties.find(s => 
      s.includes(data.specialty1) && s.includes(data.specialty2)
    );
    
    if (!actualSpecialty) return;

    onComplete({
      ...data,
      specialty: actualSpecialty
    });
  };

  // Progress percentage
  const progressPercent = (step / 5) * 100;

  return (
    <div className="min-h-screen bg-[#e8f4f8] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      {/* Decorative Brand Accent (Header Block) */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between no-print mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#E30613] rounded-xl flex items-center justify-center text-white font-black shadow-md">
            LÉ
          </div>
          <span className="text-xl font-display font-black text-slate-800 tracking-tight">
            l'Étudiant <span className="text-[#E30613]">Simulateur</span>
          </span>
        </div>
        <div className="bg-white/85 backdrop-blur-xs border border-slate-200/50 rounded-full px-4 py-1.5 text-[11px] font-black text-slate-600 uppercase tracking-widest shadow-xs">
          Parcoursup 2026
        </div>
      </div>

      <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col justify-center">
        {/* Step Indicator Section */}
        <div className="mb-6 mx-auto w-full max-w-xl text-center">
          <div className="flex items-center justify-between mb-2 text-xs font-black text-slate-500 uppercase tracking-widest px-1">
            <span>Étape {step} sur 5</span>
            <span className="text-[#E30613]">{Math.round(progressPercent)}% complété</span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 w-full bg-slate-200/60 rounded-full overflow-hidden p-[1px]">
            <motion.div 
              className="h-full bg-[#E30613] rounded-full"
              initial={{ width: '20%' }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Wizard Main Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-8 md:p-12 rounded-3xl shadow-soft border border-slate-100 flex flex-col justify-between relative min-h-[500px]"
        >
          {/* Step Contents */}
          <div className="flex-1">
            {/* STEP 1: First Specialty */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center max-w-xl mx-auto mb-8">
                  <span className="text-[10px] font-black text-[#E30613] uppercase tracking-[0.2em] bg-[#fbe6e7] px-3 py-1 rounded-full">Spécialité 1</span>
                  <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
                    Ta <span className="text-[#E30613]">première spécialité</span>
                  </h3>
                  <p className="text-slate-500 font-medium text-sm mt-2">
                    Choisis l'un de tes deux enseignements de spécialité.
                  </p>
                </div>

                <div className="relative max-w-md mx-auto mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Rechercher une spécialité..."
                    value={search1}
                    onChange={(e) => setSearch1(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#E30613]/30 focus:bg-white rounded-xl transition-all text-sm font-bold outline-none shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto p-1 custom-scrollbar">
                  {filtered1.map((spec) => {
                    const isSelected = data.specialty1 === spec;
                    return (
                      <button
                        key={spec}
                        onClick={() => {
                          setData({ ...data, specialty1: spec });
                          // Force clear specialty2 if it was selected and becomes identical
                          if (data.specialty2 === spec) {
                            setData(prev => ({ ...prev, specialty1: spec, specialty2: '' }));
                          }
                          // Smooth auto-advance helper
                          setTimeout(() => {
                            setStep(2);
                          }, 250);
                        }}
                        className={cn(
                          "px-5 py-3.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between",
                          isSelected 
                            ? "bg-[#E30613] border-[#E30613] text-white shadow-md shadow-[#E30613]/25" 
                            : "bg-white border-slate-200 text-slate-700 hover:border-[#E30613]/30 hover:bg-slate-50/50"
                        )}
                      >
                        <span className="line-clamp-1">{spec}</span>
                        {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: Second Specialty */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center max-w-xl mx-auto mb-8">
                  <span className="text-[10px] font-black text-[#E30613] uppercase tracking-[0.2em] bg-[#fbe6e7] px-3 py-1 rounded-full">Spécialité 2</span>
                  <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
                    Ta <span className="text-[#E30613]">deuxième spécialité</span>
                  </h3>
                  <p className="text-slate-500 font-medium text-sm mt-3">
                    Choisis ton autre enseignement de spécialité (associé avec <strong className="text-slate-800">{data.specialty1}</strong>).
                  </p>
                </div>

                <div className="relative max-w-md mx-auto mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Rechercher ta seconde spécialité..."
                    value={search2}
                    onChange={(e) => setSearch2(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#E30613]/30 focus:bg-white rounded-xl transition-all text-sm font-bold outline-none shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto p-1 custom-scrollbar">
                  {filtered2.length > 0 ? (
                    filtered2.map((spec) => {
                      const isSelected = data.specialty2 === spec;
                      return (
                        <button
                          key={spec}
                          onClick={() => {
                            setData({ ...data, specialty2: spec });
                            setTimeout(() => {
                              setStep(3);
                            }, 250);
                          }}
                          className={cn(
                            "px-5 py-3.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between",
                            isSelected 
                              ? "bg-[#E30613] border-[#E30613] text-white shadow-md shadow-[#E30613]/25" 
                              : "bg-white border-slate-200 text-slate-700 hover:border-[#E30613]/30 hover:bg-slate-50/50"
                          )}
                        >
                          <span className="line-clamp-1">{spec}</span>
                          {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-2 text-center py-6 text-xs text-slate-400 italic">
                      Aucune spécialité compatible trouvée pour cette recherche ou cette combinaison.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: Average Bac */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center max-w-xl mx-auto mb-10">
                  <span className="text-[10px] font-black text-[#E30613] uppercase tracking-[0.2em] bg-[#fbe6e7] px-3 py-1 rounded-full">Potentiel</span>
                  <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
                    <span className="text-[#E30613]">Moyenne attendue</span> au bac
                  </h3>
                  <p className="text-slate-500 font-medium text-sm mt-3">
                    Saisis ta moyenne attendue sur 20.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center py-6">
                  <div className="flex items-center gap-4 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 px-8 py-5 rounded-2xl relative transition-all group max-w-xs justify-center mx-auto shadow-xs">
                    <input 
                      type="text" 
                      inputMode="decimal"
                      placeholder="14.5"
                      autoFocus
                      value={data.averageBac}
                      onChange={handleAverageChange}
                      className={cn(
                        "w-24 bg-transparent border-none p-0 text-center text-4xl font-black focus:ring-0 outline-none",
                        data.averageBac && !isAverageValid ? "text-[#E30613]" : "text-slate-900 placeholder:text-slate-200"
                      )}
                    />
                    <span className="text-slate-300 font-black text-2xl">/ 20</span>
                  </div>

                  {data.averageBac && !isAverageValid && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 flex items-center gap-2 text-[#E30613] text-[11px] font-black uppercase tracking-wider"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E30613] animate-pulse" />
                      <span>La note doit être comprise entre 10.00 et 20.00</span>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: Target Formations */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center max-w-xl mx-auto mb-6">
                  <span className="text-[10px] font-black text-[#E30613] uppercase tracking-[0.2em] bg-[#fbe6e7] px-3 py-1 rounded-full">Préférences</span>
                  <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
                    <span className="text-[#E30613]">Formations</span> visées
                  </h3>
                  <p className="text-slate-500 font-medium text-sm mt-3">
                    Sélectionne un ou plusieurs types de formations.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[280px] overflow-y-auto p-1 custom-scrollbar">
                  {allFormationTypes.map((type, i) => {
                    const isSelected = data.targetFormationTypes.includes(type);
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setData(prev => ({
                            ...prev,
                            targetFormationTypes: isSelected 
                              ? prev.targetFormationTypes.filter(t => t !== type)
                              : [...prev.targetFormationTypes, type]
                          }));
                        }}
                        className={cn(
                          "p-4 rounded-xl border text-xs font-bold transition-all text-left flex items-start gap-3 relative overflow-hidden group",
                          isSelected 
                            ? "bg-[#E30613]/5 border-[#E30613] text-slate-900 shadow-xs" 
                            : "bg-white border-slate-200 text-slate-700 hover:border-[#E30613]/25 hover:bg-slate-50/30"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center shrink-0 border mt-0.5",
                          isSelected ? "bg-[#E30613] border-[#E30613] text-white" : "bg-slate-50 border-slate-300"
                        )}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="leading-snug">{type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 5: Home Department */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="text-center max-w-xl mx-auto mb-6">
                  <span className="text-[10px] font-black text-[#E30613] uppercase tracking-[0.2em] bg-[#fbe6e7] px-3 py-1 rounded-full">Localisation</span>
                  <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
                    Ton <span className="text-[#E30613]">département</span>
                  </h3>
                  <p className="text-slate-500 font-medium text-sm mt-3">
                    Il servira à localiser tes recherches.
                  </p>
                </div>

                <div className="relative max-w-md mx-auto mb-6">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Saisis ton département ou numéro..."
                    value={deptSearch}
                    onChange={(e) => {
                      setDeptSearch(e.target.value);
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#E30613]/30 focus:bg-white rounded-xl transition-all text-sm font-bold outline-none shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[220px] overflow-y-auto p-1 custom-scrollbar">
                  {filteredDepts.length > 0 ? (
                    filteredDepts.map((dept, i) => {
                      const isSelected = data.department === dept;
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            setData({ ...data, department: dept });
                            setDeptSearch(dept);
                          }}
                          className={cn(
                            "px-4 py-3 rounded-lg border text-xs font-bold transition-all text-center leading-tight truncate",
                            isSelected 
                              ? "bg-[#E30613] border-[#E30613] text-white shadow-xs" 
                              : "bg-white border-slate-200 text-slate-700 hover:border-[#E30613]/30 hover:bg-slate-50/50"
                          )}
                        >
                          {dept}
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-3 text-center py-6 text-xs text-slate-400 italic">
                      Aucun département ne correspond.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Massive CTA Buttons Row */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              onClick={handlePrevStep}
              className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm rounded-xl transition-all duration-200 flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>

            {step < 5 ? (
              <button
                onClick={handleNextStep}
                disabled={
                  (step === 1 && !data.specialty1) ||
                  (step === 2 && (!data.specialty2 || !isValidCombination)) ||
                  (step === 3 && !isAverageValid) ||
                  (step === 4 && data.targetFormationTypes.length === 0)
                }
                className="px-8 py-3.5 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-slate-900/10 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Continuer</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!data.department || !isAverageValid || !isValidCombination}
                className="px-8 py-3.5 bg-slate-900 border border-[#E30613] hover:bg-slate-800 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[#E30613]/10 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed animate-pulse"
              >
                <span>Analyser mon profil</span>
                <Sparkles className="w-4 h-4 text-[#E30613]" />
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Footer Line */}
      <div className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mt-8">
        Simulateur d'Orientation l'Étudiant • Données Nationales sous Licence Ouverte
      </div>
    </div>
  );
}
