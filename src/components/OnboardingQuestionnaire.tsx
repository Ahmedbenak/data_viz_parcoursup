import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Map as MapIcon, 
  Target, 
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
  specialties: string[];
  loadingSpecialties: boolean;
}

export interface OnboardingData {
  academy: string;
  specialty: string;
  stayInAcademy: boolean;
  averageBac: string;
}

export default function OnboardingQuestionnaire({ onComplete, specialties, loadingSpecialties }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    academy: '',
    specialty: '',
    stayInAcademy: false,
    averageBac: ''
  });
  const [searchAcademy, setSearchAcademy] = useState('');
  const [searchSpecialty, setSearchSpecialty] = useState('');

  const filteredAcademies = ACADEMIES.filter(a => 
    a.toLowerCase().includes(searchAcademy.toLowerCase())
  );

  const filteredSpecialties = specialties.filter(s => 
    s.toLowerCase().includes(searchSpecialty.toLowerCase())
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-200 z-50">
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: '0%' }}
          animate={{ width: `${(step / 3) * 100}%` }}
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
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Commençons par ton profil</h2>
                <p className="text-slate-500">Sélectionne ton académie et tes enseignements de spécialité.</p>
              </div>

              <div className="space-y-6">
                {/* Academy Selection */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Ton Académie</label>
                  <div className="relative mb-3">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Rechercher une académie..."
                      value={searchAcademy}
                      onChange={(e) => setSearchAcademy(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all text-lg"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-1 custom-scrollbar">
                    {filteredAcademies.slice(0, 10).map((academy) => (
                      <button
                        key={academy}
                        onClick={() => setData({ ...data, academy })}
                        className={cn(
                          "px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                          data.academy === academy 
                            ? "bg-primary border-primary text-white shadow-md shadow-primary-light" 
                            : "bg-white border-slate-100 text-slate-600 hover:border-primary/20"
                        )}
                      >
                        {academy}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specialty Selection */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Ta Spécialité</label>
                  <div className="relative mb-3">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text"
                      placeholder={loadingSpecialties ? "Chargement..." : "Rechercher une spécialité..."}
                      disabled={loadingSpecialties}
                      value={searchSpecialty}
                      onChange={(e) => setSearchSpecialty(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all text-lg"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto p-1 custom-scrollbar">
                    {filteredSpecialties.map((spec) => (
                      <button
                        key={spec}
                        onClick={() => setData({ ...data, specialty: spec })}
                        className={cn(
                          "px-4 py-2 rounded-xl border text-sm font-medium transition-all text-left",
                          data.specialty === spec 
                            ? "bg-primary border-primary text-white shadow-md shadow-primary-light" 
                            : "bg-white border-slate-100 text-slate-600 hover:border-primary/20"
                        )}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-end">
                <button 
                  disabled={!data.academy || !data.specialty}
                  onClick={nextStep}
                  className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuer <ChevronRight className="w-4 h-4" />
                </button>
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
                  onClick={handleComplete}
                  disabled={!data.averageBac}
                  className="bg-primary text-white px-10 py-4 rounded-2xl font-bold hover:bg-primary-hover transition-all flex items-center gap-3 shadow-xl shadow-primary-light active:scale-95"
                >
                  Découvrir mon profil <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
