import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, Search, Users, ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HeaderProps {
  onboardingData?: any;
  setOnboardingComplete: (complete: boolean) => void;
}

export default function Header({ onboardingData, setOnboardingComplete }: HeaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // If scrolling down and past 100px, hide header
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        // If scrolling up, show header
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* Red line that stays at the top when header is hidden */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-primary z-[100]" />
      
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : -160 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="bg-primary sticky top-0 z-[90] shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* --- LIGNE HAUT : Logo et Actions --- */}
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img 
                src="/Logo.png" 
                alt="Logo l'Étudiant" 
                className="h-8 w-auto object-contain brightness-0 invert" 
              />
            </div>
            
            {/* Actions Droite */}
            <div className="flex items-center gap-5">
              <button className="text-white hover:text-white/80 transition-colors">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button className="text-white hover:text-white/80 transition-colors">
                <Search className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <div className="hidden sm:block w-px h-6 bg-white/30"></div> {/* Séparateur vertical */}

              {/* Vos données onboarding (conservées) */}
              {onboardingData && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full border border-white/30 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">
                    {onboardingData.specialty}
                  </span>
                </div>
              )}
              
              {/* Votre bouton profil (adapté pour ressembler à un avatar/bouton d'action) */}
              <button 
                onClick={() => setOnboardingComplete(false)}
                className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-full sm:rounded-xl border border-white/20 transition-all text-sm font-bold shadow-sm"
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Profil</span>
              </button>
            </div>
          </div>

          {/* --- LIGNE BAS : Navigation --- */}
          <nav className="flex items-center gap-6 pb-3 overflow-x-auto no-scrollbar">
            <a href="#" className="text-white font-bold text-[14px] sm:text-[15px] hover:underline whitespace-nowrap">Salons</a>
            
            <button className="flex items-center gap-1 text-white font-bold text-[14px] sm:text-[15px] hover:underline whitespace-nowrap">
              Orientation <ChevronDown className="w-4 h-4" />
            </button>
            
            <button className="flex items-center gap-1 text-white font-bold text-[14px] sm:text-[15px] hover:underline whitespace-nowrap">
              Révisions / Examens <ChevronDown className="w-4 h-4" />
            </button>
            
            <button className="flex items-center gap-1 text-white font-bold text-[14px] sm:text-[15px] hover:underline whitespace-nowrap">
              Métiers <ChevronDown className="w-4 h-4" />
            </button>
            
            <button className="flex items-center gap-1 text-white font-bold text-[14px] sm:text-[15px] hover:underline whitespace-nowrap">
              Vie étudiante <ChevronDown className="w-4 h-4" />
            </button>
            
            <button className="flex items-center gap-1 text-white font-bold text-[14px] sm:text-[15px] hover:underline whitespace-nowrap">
              Jobs, stages, alternance <ChevronDown className="w-4 h-4" />
            </button>
            
            <a href="#" className="text-white font-bold text-[14px] sm:text-[15px] hover:underline whitespace-nowrap">EducPros</a>
          </nav>
        </div>

        {/* --- LIGNE MULTICOLORE (Design signature l'Étudiant) --- */}
        <div className="h-1 w-full flex">
          <div className="h-full flex-1 bg-pink-500"></div>
          <div className="h-full flex-1 bg-yellow-400"></div>
          <div className="h-full flex-1 bg-green-500"></div>
          <div className="h-full flex-1 bg-blue-500"></div>
          <div className="h-full flex-1 bg-orange-500"></div>
        </div>
      </motion.header>
    </>
  );
}
