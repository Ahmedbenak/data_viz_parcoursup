import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Map as MapIcon, 
  Target, 
  Sparkles,
  Search,
  GraduationCap
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ACADEMIES = [
  "Aix-Marseille", "Amiens", "Besançon", "Bordeaux", "Clermont-Ferrand", 
  "Corse", "Créteil", "Dijon", "Grenoble", "Lille", "Limoges", "Lyon", 
  "Montpellier", "Nancy-Metz", "Nantes", "Nice", "Normandie", 
  "Orléans-Tours", "Paris", "Poitiers", "Reims", "Rennes", 
  "Strasbourg", "Toulouse", "Versailles", "Guyane", "La Réunion", 
  "Martinique", "Mayotte"
];

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
}

export interface OnboardingData {
  academy: string;
  stayInAcademy: boolean;
  selectedDepartments: string[];
  showLikelyAccepted: boolean;
  averageBac: string;
}

export default function OnboardingQuestionnaire({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    academy: '',
    stayInAcademy: false,
    selectedDepartments: [],
    showLikelyAccepted: true,
    averageBac: ''
  });
  const [searchAcademy, setSearchAcademy] = useState('');

  const filteredAcademies = ACADEMIES.filter(a => 
    a.toLowerCase().includes(searchAcademy.toLowerCase())
  );

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleComplete = () => {
    onComplete(data);
  };

  const handleAverageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(',', '.');
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setData({ ...data, averageBac: value });
    }
  };

  const toggleDepartment = (dept: string) => {
    setData(prev => ({
      ...prev,
      selectedDepartments: prev.selectedDepartments.includes(dept)
        ? prev.selectedDepartments.filter(d => d !== dept)
        : [...prev.selectedDepartments, dept]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-200 z-50">
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: '0%' }}
          animate={{ width: `${(step / 5) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="max-w-2xl w-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-primary-light/50 border border-slate-100"
            >
              <div className="mb-8">
                <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center mb-6">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Quelle est ton académie ?</h2>
                <p className="text-slate-500">Cela nous aide à personnaliser les résultats selon ta zone géographique.</p>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Rechercher une académie..."
                  value={searchAcademy}
                  onChange={(e) => setSearchAcademy(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all text-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredAcademies.map((academy) => (
                  <button
                    key={academy}
                    onClick={() => {
                      setData({ ...data, academy });
                      nextStep();
                    }}
                    className={cn(
                      "text-left px-5 py-4 rounded-2xl border transition-all duration-200 group",
                      data.academy === academy 
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary-light" 
                        : "bg-white border-slate-100 text-slate-700 hover:border-primary/20 hover:bg-primary-light/30"
                    )}
                  >
                    <span className="font-medium">{academy}</span>
                    {data.academy === academy && <Check className="w-4 h-4 float-right mt-1" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-primary-light/50 border border-slate-100"
            >
              <div className="mb-8">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                  <Target className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Tes préférences de mobilité</h2>
                <p className="text-slate-500">Souhaites-tu rester dans ton académie actuelle ({data.academy}) ?</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10">
                <button
                  onClick={() => setData({ ...data, stayInAcademy: true })}
                  className={cn(
                    "p-6 rounded-3xl border-2 transition-all text-center group",
                    data.stayInAcademy 
                      ? "border-primary bg-primary-light/50" 
                      : "border-slate-100 hover:border-primary/20"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center transition-colors",
                    data.stayInAcademy ? "bg-primary text-white" : "bg-slate-100 text-slate-400 group-hover:bg-primary-light"
                  )}>
                    <Check className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-lg block">Oui</span>
                  <span className="text-sm text-slate-500">Je préfère rester proche</span>
                </button>

                <button
                  onClick={() => setData({ ...data, stayInAcademy: false })}
                  className={cn(
                    "p-6 rounded-3xl border-2 transition-all text-center group",
                    !data.stayInAcademy 
                      ? "border-primary bg-primary-light/50" 
                      : "border-slate-100 hover:border-primary/20"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center transition-colors",
                    !data.stayInAcademy ? "bg-primary text-white" : "bg-slate-100 text-slate-400 group-hover:bg-primary-light"
                  )}>
                    <ChevronRight className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-lg block">Non</span>
                  <span className="text-sm text-slate-500">Je suis prêt à bouger</span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={prevStep} className="text-slate-400 hover:text-slate-600 font-medium flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Retour
                </button>
                <button 
                  onClick={nextStep}
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  Continuer <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-primary-light/50 border border-slate-100"
            >
              <div className="mb-6">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
                  <MapIcon className="w-6 h-6 text-amber-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Zones d'intérêt</h2>
                <p className="text-slate-500">Sélectionne les départements qui t'intéressent sur la carte.</p>
              </div>

              <div className="bg-slate-50 rounded-3xl p-6 mb-8 flex flex-col items-center">
                {/* Simplified Interactive Map Representation */}
                <div className="relative w-full aspect-square max-w-[350px] bg-white rounded-2xl border border-slate-100 p-4 shadow-inner overflow-hidden">
                  <div className="grid grid-cols-5 gap-2 h-full">
                    {Array.from({ length: 25 }).map((_, i) => {
                      const deptId = `Dept-${i + 1}`;
                      const isSelected = data.selectedDepartments.includes(deptId);
                      return (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleDepartment(deptId)}
                          className={cn(
                            "rounded-lg border transition-all flex items-center justify-center text-[10px] font-bold",
                            isSelected 
                              ? "bg-primary border-primary text-white shadow-md shadow-primary-light" 
                              : "bg-slate-50 border-slate-100 text-slate-300 hover:bg-primary-light hover:text-primary"
                          )}
                        >
                          {i + 1}
                        </motion.button>
                      );
                    })}
                  </div>
                  <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 font-medium italic">
                    Carte interactive simplifiée
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {data.selectedDepartments.length === 0 ? (
                    <span className="text-sm text-slate-400 italic">Aucun département sélectionné</span>
                  ) : (
                    data.selectedDepartments.map(dept => (
                      <span key={dept} className="px-3 py-1 bg-primary-light text-primary rounded-full text-xs font-bold flex items-center gap-1">
                        {dept} <button onClick={() => toggleDepartment(dept)} className="hover:text-primary-hover">×</button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={prevStep} className="text-slate-400 hover:text-slate-600 font-medium flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Retour
                </button>
                <button 
                  onClick={nextStep}
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  Continuer <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-primary-light/50 border border-slate-100"
            >
              <div className="mb-8">
                <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center mb-6">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Moyenne au bac attendue</h2>
                <p className="text-slate-500">Indique ta moyenne prévisionnelle pour affiner nos conseils.</p>
              </div>

              <div className="relative mb-10">
                <input 
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 14.5"
                  value={data.averageBac}
                  onChange={handleAverageChange}
                  className="w-full px-6 py-8 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-4xl font-bold text-center text-primary"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xl">
                  / 20
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={prevStep} className="text-slate-400 hover:text-slate-600 font-medium flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Retour
                </button>
                <button 
                  onClick={nextStep}
                  disabled={!data.averageBac}
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuer <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-primary-light/50 border border-slate-100"
            >
              <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-primary rounded-[2rem] flex items-center justify-center mb-6 mx-auto shadow-xl shadow-primary-light">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Dernière étape !</h2>
                <p className="text-slate-500">Optimisons tes chances de réussite.</p>
              </div>

              <div 
                onClick={() => setData({ ...data, showLikelyAccepted: !data.showLikelyAccepted })}
                className={cn(
                  "p-8 rounded-[2rem] border-2 cursor-pointer transition-all mb-10 group",
                  data.showLikelyAccepted 
                    ? "border-primary bg-primary-light/30 shadow-lg shadow-primary-light" 
                    : "border-slate-100 hover:border-primary/20"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center transition-colors",
                    data.showLikelyAccepted ? "bg-primary text-white" : "bg-slate-100 text-slate-400 group-hover:bg-primary-light"
                  )}>
                    {data.showLikelyAccepted && <Check className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 mb-1">Algorithme de prédiction</h3>
                    <p className="text-slate-500 leading-relaxed">
                      Je souhaite voir en priorité les établissements en France où je suis susceptible d'être accepté selon mon profil.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={prevStep} className="text-slate-400 hover:text-slate-600 font-medium flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Retour
                </button>
                <button 
                  onClick={handleComplete}
                  className="bg-primary text-white px-10 py-5 rounded-[1.5rem] font-bold hover:bg-primary-hover transition-all flex items-center gap-3 shadow-xl shadow-primary-light active:scale-95"
                >
                  Découvrir mon profil <Sparkles className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
