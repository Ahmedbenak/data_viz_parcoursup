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
          "w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all text-sm font-semibold text-slate-700",
          disabled ? "bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed" : "focus:border-[#E30613]/50 focus:bg-white focus:ring-2 focus:ring-[#E30613]/10",
          error ? "border-red-500" : "border-slate-200"
        )}
      />
      {isOpen && !disabled && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => (
              <li 
                key={opt} 
                className="px-4 py-2 hover:bg-[#E30613]/5 cursor-pointer text-sm font-medium text-slate-700"
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
             <li className="px-4 py-2 text-sm text-slate-500 italic">Aucun résultat</li>
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
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E30613]/50 focus:bg-white focus:ring-2 focus:ring-[#E30613]/10 outline-none transition-all text-sm font-semibold text-slate-700"
        />
        {isOpen && (
          <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <li 
                  key={opt} 
                  className="px-4 py-2 hover:bg-[#E30613]/5 cursor-pointer text-sm font-medium text-slate-700 flex items-center justify-between"
                  onClick={() => toggleOption(opt)}
                >
                  <span>{opt}</span>
                </li>
              ))
            ) : (
               <li className="px-4 py-2 text-sm text-slate-500 italic">Aucun résultat</li>
            )}
          </ul>
        )}
      </div>

      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedValues.map(val => (
             <div key={val} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E30613]/10 text-[#E30613] rounded-lg text-xs font-bold border border-[#E30613]/20">
               <span>{val}</span>
               <button type="button" onClick={() => toggleOption(val)} className="hover:bg-[#E30613]/20 rounded-full p-0.5">
                 <X className="w-3 h-3" />
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
    <div className="min-h-screen bg-[#e8f4f8] py-8 px-4 sm:px-6 lg:px-8">
      {/* Decorative Brand Accent (Header Block) */}
      <div className="max-w-4xl w-full mx-auto flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#E30613] rounded-xl flex items-center justify-center text-white font-black shadow-md">
            LÉ
          </div>
          <span className="text-xl font-display font-black text-slate-800 tracking-tight">
            l'Étudiant <span className="text-[#E30613]">Simulateur</span>
          </span>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white px-4 py-2 rounded-full shadow-xs border border-slate-200"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour à l'accueil
          </button>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
      >
        <div className="p-8 md:p-10 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            Mon profil <span className="text-[#E30613]">Lycéen</span>
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            Renseigne tes spécialités, tes résultats et tes vœux pour analyser tes chances d'admission.
          </p>
        </div>

        <form onSubmit={handleComplete} className="p-8 md:p-10 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Colonne Gauche */}
            <div className="space-y-8">
              {/* Spécialités */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#E30613]/10 text-[#E30613] flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900">Enseignements de spécialité</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Spécialité 1</label>
                    <SearchableSelect
                      options={individualSpecialties}
                      value={data.specialty1}
                      onChange={(val) => setData({ ...data, specialty1: val })}
                      placeholder="Rechercher une spécialité..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Spécialité 2</label>
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
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#E30613]/10 text-[#E30613] flex items-center justify-center">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900">Moyenne attendue au bac</h3>
                </div>
                <div>
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl focus-within:border-[#E30613]/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#E30613]/10 transition-all max-w-[200px]">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="14.5"
                      value={data.averageBac}
                      onChange={(e) => {
                        const value = e.target.value.replace(',', '.');
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setData({ ...data, averageBac: value });
                        }
                      }}
                      className="w-full bg-transparent border-none p-0 text-xl font-black text-slate-800 placeholder:text-slate-300 focus:ring-0 outline-none text-right"
                    />
                    <span className="text-slate-400 font-bold text-lg">/ 20</span>
                  </div>
                  {data.averageBac && !isAverageValid && (
                    <p className="text-xs text-[#E30613] mt-2 font-medium">La note doit être comprise entre 10 et 20.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Colonne Droite */}
            <div className="space-y-8">
              {/* Formations visées */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#E30613]/10 text-[#E30613] flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900">Formations visées (multiples)</h3>
                </div>

                <div className="pt-2">
                  <MultiSearchableSelect
                    options={allFormationTypes}
                    selectedValues={data.targetFormationTypes}
                    onChange={(vals) => setData({ ...data, targetFormationTypes: vals })}
                    placeholder="Rechercher des formations..."
                  />
                </div>
              </div>

              {/* Département */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#E30613]/10 text-[#E30613] flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900">Département cible</h3>
                </div>
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

          <div className="pt-8 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={!isFormValid}
              className="px-8 py-4 bg-[#E30613] hover:bg-[#c20511] text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center gap-3 shadow-lg shadow-[#E30613]/25 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Analyser mon profil</span>
              <Sparkles className="w-5 h-5" />
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}

