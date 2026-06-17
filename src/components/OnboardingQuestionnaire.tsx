import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calculator,
  Check, 
  MapPin,
  Sparkles,
  BookOpen,
  ChevronLeft,
  LayoutGrid,
  X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder,
  disabled = false,
  error
}: { 
  options: string[]; 
  value: string; 
  onChange: (val: string) => void;
  placeholder: string;
  disabled?: boolean;
  error?: boolean;
}) {
  const [search, setSearch] = React.useState(value);
  const [isOpen, setIsOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setSearch(value);
  }, [value]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (!options.includes(search)) {
          setSearch(value);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, search, value, options]);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        disabled={disabled}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={cn(
          "w-full text-base font-bold text-slate-900 bg-slate-50 border rounded-2xl px-6 py-4 outline-none transition-all placeholder:text-slate-400",
          disabled ? "border-slate-100 opacity-60 cursor-not-allowed" : "border-slate-100 focus:ring-4 focus:ring-primary/10 focus:bg-white",
          error ? "border-red-500" : ""
        )}
      />
      {isOpen && !disabled && (
        <ul className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2 custom-scrollbar">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => (
              <li 
                key={opt} 
                className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl transition-all cursor-pointer"
                onClick={() => {
                  onChange(opt);
                  setSearch(opt);
                  setIsOpen(false);
                }}
              >
                {opt}
              </li>
            ))
          ) : (
             <li className="px-4 py-4 text-sm text-slate-400 italic text-center">Aucun résultat</li>
          )}
        </ul>
      )}
    </div>
  )
}

function MultiSearchableSelect({
  options,
  selectedValues,
  onChange,
  placeholder
}: {
  options: string[];
  selectedValues: string[];
  onChange: (vals: string[]) => void;
  placeholder: string;
}) {
  const [search, setSearch] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch(''); // clear search on close
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const availableOptions = options.filter(opt => !selectedValues.includes(opt));
  const filteredOptions = availableOptions.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  const toggleOption = (opt: string) => {
    if (selectedValues.includes(opt)) {
      onChange(selectedValues.filter(v => v !== opt));
    } else {
      onChange([...selectedValues, opt]);
    }
    setSearch('');
  };

  return (
    <div className="space-y-3 relative" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full text-base font-bold text-slate-900 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all placeholder:text-slate-400"
        />
        {isOpen && (
          <ul className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <li 
                  key={opt} 
                  className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl transition-all cursor-pointer flex items-center justify-between"
                  onClick={() => toggleOption(opt)}
                >
                  <span>{opt}</span>
                </li>
              ))
            ) : (
               <li className="px-4 py-4 text-sm text-slate-400 italic text-center">Aucun résultat</li>
            )}
          </ul>
        )}
      </div>

      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedValues.map(val => (
             <div key={val} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-bold border border-primary/20">
               <span>{val}</span>
               <button type="button" onClick={() => toggleOption(val)} className="hover:bg-primary/20 rounded-full p-0.5">
                 <X className="w-3.5 h-3.5" />
               </button>
             </div>
          ))}
        </div>
      )}
    </div>
  );
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
  allFormationTypes,
  allDepartments,
  loadingSpecialties,
  onBack
}: OnboardingProps) {
  const [data, setData] = useState<OnboardingData>({
    specialty1: '',
    specialty2: '',
    specialty: '',
    averageBac: '',
    targetFormationTypes: [],
    department: ''
  });

  // Derived combo compatibility (only allow specialty 2 if it forms a valid combo with specialty 1)
  const validSpec2Options = useMemo(() => {
    if (!data.specialty1) return individualSpecialties; // show all if spec1 not selected
    
    return individualSpecialties.filter(s => {
      if (s === data.specialty1) return false;
      return specialties.some(comb => comb.includes(data.specialty1) && comb.includes(s));
    });
  }, [data.specialty1, individualSpecialties, specialties]);

  // If specialty1 changes, ensure specialty2 is still valid. If not, reset it.
  useEffect(() => {
    if (data.specialty1 && data.specialty2) {
      const stillValid = validSpec2Options.includes(data.specialty2);
      if (!stillValid) {
        setData(prev => ({ ...prev, specialty2: '' }));
      }
    }
  }, [data.specialty1, validSpec2Options, data.specialty2]);

  const isValidCombination = useMemo(() => {
    if (!data.specialty1 || !data.specialty2) return false;
    return specialties.some(s => 
      s.includes(data.specialty1) && s.includes(data.specialty2)
    );
  }, [data.specialty1, data.specialty2, specialties]);

  const isAverageValid = useMemo(() => {
    if (!data.averageBac) return false;
    const val = parseFloat(data.averageBac);
    return !isNaN(val) && val >= 10 && val <= 20;
  }, [data.averageBac]);

  const isFormValid = !!data.specialty1 && !!data.specialty2 && isValidCombination && isAverageValid && data.targetFormationTypes.length > 0 && !!data.department;

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
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

  const toggleFormation = (type: string) => {
    setData((prev) => {
      const isSelected = prev.targetFormationTypes.includes(type);
      return {
        ...prev,
        targetFormationTypes: isSelected 
          ? prev.targetFormationTypes.filter(t => t !== type)
          : [...prev.targetFormationTypes, type]
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 sm:p-12 relative">
      {/* Floating Back Button in Onboarding */}
      {onBack && (
        <div className="absolute top-8 left-8 z-[100]">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900/90 backdrop-blur-sm text-white rounded-full font-bold shadow-xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 group border border-white/20 text-sm"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Retour à l'accueil</span>
          </button>
        </div>
      )}

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
              <BookOpen className="w-10 h-10 text-primary" />
            </motion.div>
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter">Votre profil Générale / Techno</h2>
            <p className="text-slate-500 font-medium text-lg">Renseignez vos spécialités et votre parcours pour analyser vos chances.</p>
          </div>

          <form onSubmit={handleComplete} className="space-y-8 relative z-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Colonne Gauche */}
              <div className="space-y-8">
                {/* Spécialités */}
                <div className="space-y-3 relative">
                  <label className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                    <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[11px] shadow-lg shadow-primary/25 font-black">1</span>
                    Spécialités
                  </label>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500 mb-2">Spécialité 1</p>
                      <SearchableSelect
                        options={individualSpecialties}
                        value={data.specialty1}
                        onChange={(val) => setData({ ...data, specialty1: val })}
                        placeholder="Rechercher une spécialité..."
                      />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-500 mb-2">Spécialité 2</p>
                      <SearchableSelect
                        options={validSpec2Options}
                        value={data.specialty2}
                        onChange={(val) => setData({ ...data, specialty2: val })}
                        placeholder="Rechercher la 2ème spécialité..."
                        disabled={!data.specialty1 || validSpec2Options.length === 0}
                      />
                      {data.specialty1 && validSpec2Options.length === 0 && (
                        <p className="text-xs text-orange-500 mt-2 font-medium">Aucune spécialité 2 compatible en base.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Note au bac */}
                <div className="space-y-3 relative">
                  <label className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 mt-6">
                    <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[11px] shadow-lg shadow-primary/25 font-black">3</span>
                    Moyenne au bac
                  </label>
                  <div>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ex: 14.5 (De 10 à 20)"
                      value={data.averageBac}
                      onChange={(e) => {
                        const value = e.target.value.replace(',', '.');
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setData({ ...data, averageBac: value });
                        }
                      }}
                      className="w-full text-base font-bold text-slate-900 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all placeholder:text-slate-400"
                    />
                    {data.averageBac && !isAverageValid && (
                      <p className="text-xs text-[#E30613] mt-2 font-medium">La note doit être comprise entre 10 et 20.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Colonne Droite */}
              <div className="space-y-8">
                {/* Formations visées */}
                <div className="space-y-3 relative">
                  <label className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                    <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[11px] shadow-lg shadow-primary/25 font-black">2</span>
                    Filières visées
                  </label>

                  <div>
                    <MultiSearchableSelect
                      options={allFormationTypes}
                      selectedValues={data.targetFormationTypes}
                      onChange={(vals) => setData({ ...data, targetFormationTypes: vals })}
                      placeholder="Rechercher des formations..."
                    />
                  </div>
                </div>

                {/* Département */}
                <div className="space-y-3 relative">
                  <label className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 mt-6">
                    <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[11px] shadow-lg shadow-primary/25 font-black">4</span>
                    Département d'intérêt
                  </label>
                  <div>
                    <SearchableSelect
                      options={allDepartments}
                      value={data.department}
                      onChange={(val) => setData({ ...data, department: val })}
                      placeholder="Rechercher un département..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 mt-8">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="w-full sm:w-auto px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  Retour
                </button>
              )}
              <div className="flex items-center justify-end gap-4 w-full sm:w-auto ml-auto">
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className={cn(
                    "w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all",
                    isFormValid 
                      ? "bg-primary text-white hover:bg-primary-dark hover:-translate-y-0.5 active:translate-y-0" 
                      : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                  )}
                >
                  <span>Valider & Analyser</span>
                  <Sparkles className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>

          </form>
        </motion.div>
      </div>
    </div>
  );
}

