import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Check, X } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function SearchableSelect({ 
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
        <ul className="absolute z-[100] w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2 custom-scrollbar">
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
  );
}

export function MultiSearchableSelect({
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
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  const toggleOption = (opt: string) => {
    if (selectedValues.includes(opt)) {
      onChange(selectedValues.filter(v => v !== opt));
    } else {
      onChange([...selectedValues, opt]);
    }
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
          <ul className="absolute z-[100] w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => {
                const isSelected = selectedValues.includes(opt);
                return (
                  <li 
                    key={opt} 
                    className={cn(
                      "w-full text-left px-4 py-3 text-sm font-bold hover:bg-slate-50 hover:text-primary rounded-xl transition-all cursor-pointer flex items-center gap-3",
                      isSelected ? "text-primary bg-primary/5" : "text-slate-700"
                    )}
                    onClick={() => toggleOption(opt)}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-colors shadow-sm",
                      isSelected ? "bg-primary border-primary" : "border-slate-300 bg-white"
                    )}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="flex-1">{opt}</span>
                  </li>
                );
              })
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
               <button type="button" onClick={() => toggleOption(val)} className="hover:bg-primary/20 rounded-full p-0.5 transition-colors">
                 <X className="w-3.5 h-3.5" />
               </button>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
