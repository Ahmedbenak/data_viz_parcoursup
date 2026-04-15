import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Briefcase, ChevronRight, ArrowRight, LayoutDashboard, Bell, Search, Users, ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { OnboardingData } from './OnboardingQuestionnaire';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TrackSelectionProps {
  onSelect: (track: 'general' | 'pro') => void;
  onboardingData?: OnboardingData | null;
  setOnboardingComplete: (complete: boolean) => void;
}

export default function TrackSelection({ onSelect, onboardingData, setOnboardingComplete }: TrackSelectionProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="bg-primary sticky top-0 z-50 shadow-lg">
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
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-16"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mb-8 mx-auto shadow-soft border border-slate-100"
          >
            <GraduationCap className="w-10 h-10 text-primary" />
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1]">
            Bienvenue sur <span className="text-primary">l'Étudiant</span>
          </h1>
          <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            L'orientation est une étape clé. Choisis ton parcours pour accéder à des outils d'analyse personnalisés.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Bac Général */}
          <motion.button
            whileHover={{ y: -12, shadow: "var(--shadow-hover)" }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            onClick={() => onSelect('general')}
            className="group relative p-10 bg-white border border-slate-100 rounded-[3rem] shadow-soft hover:border-primary/30 transition-all text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <GraduationCap className="w-24 h-24 text-primary" />
            </div>
            
            <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <GraduationCap className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">Bac Général</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 font-medium">
              Spécialités, études longues et universités. Analyse ton profil académique.
            </p>
            <div className="flex items-center gap-2 text-primary font-black text-sm uppercase tracking-wider">
              Continuer <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </div>
          </motion.button>

          {/* Bac Pro */}
          <motion.button
            whileHover={{ y: -12, shadow: "var(--shadow-hover)" }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            onClick={() => onSelect('pro')}
            className="group relative p-10 bg-white border border-slate-100 rounded-[3rem] shadow-soft hover:border-blue-500/30 transition-all text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Briefcase className="w-24 h-24 text-blue-500" />
            </div>

            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <Briefcase className="w-7 h-7 text-blue-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">Bac Pro</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 font-medium">
              Filières professionnelles, BTS et insertion. Calcule ton potentiel d'admission.
            </p>
            <div className="flex items-center gap-2 text-blue-500 font-black text-sm uppercase tracking-wider">
              Continuer <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </div>
          </motion.button>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-20 text-center"
        >
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Plateforme d'aide à l'orientation • Données Officielles Parcoursup
          </p>
        </motion.div>
      </div>
    </div>
  </div>
  );
}
