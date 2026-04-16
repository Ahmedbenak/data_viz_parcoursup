import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Briefcase, ChevronRight, ArrowRight, LayoutDashboard, Bell, Search, Users, ChevronDown, Target } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { OnboardingData } from './OnboardingQuestionnaire';
import Header from './Header';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TrackSelectionProps {
  onSelect: (track: 'general' | 'pro' | 'techno') => void;
  onboardingData?: OnboardingData | null;
  setOnboardingComplete: (complete: boolean) => void;
}

export default function TrackSelection({ onSelect, onboardingData, setOnboardingComplete }: TrackSelectionProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      <Header onboardingData={onboardingData} setOnboardingComplete={setOnboardingComplete} />

      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl w-full">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Bac Général */}
          <motion.button
            whileHover={{ y: -12, shadow: "var(--shadow-hover)" }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            onClick={() => onSelect('general')}
            className="group relative p-8 bg-white border border-slate-100 rounded-[3rem] shadow-soft hover:border-primary/30 transition-all text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <GraduationCap className="w-20 h-20 text-primary" />
            </div>
            
            <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <GraduationCap className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">Bac Général</h3>
            <p className="text-slate-500 text-xs leading-relaxed mb-8 font-medium">
              Spécialités, études longues et universités. Analyse ton profil académique.
            </p>
            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider mt-auto">
              Continuer <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </div>
          </motion.button>

          {/* Bac Technologique */}
          <motion.button
            whileHover={{ y: -12, shadow: "var(--shadow-hover)" }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            onClick={() => onSelect('techno')}
            className="group relative p-8 bg-white border border-slate-100 rounded-[3rem] shadow-soft hover:border-emerald-500/30 transition-all text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Target className="w-20 h-20 text-emerald-500" />
            </div>

            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <Target className="w-7 h-7 text-emerald-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">Bac Techno</h3>
            <p className="text-slate-500 text-xs leading-relaxed mb-8 font-medium">
              Séries technologiques, BUT et écoles spécialisées. Découvre tes opportunités.
            </p>
            <div className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-wider mt-auto">
              Continuer <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </div>
          </motion.button>

          {/* Bac Pro */}
          <motion.button
            whileHover={{ y: -12, shadow: "var(--shadow-hover)" }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            onClick={() => onSelect('pro')}
            className="group relative p-8 bg-white border border-slate-100 rounded-[3rem] shadow-soft hover:border-blue-500/30 transition-all text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Briefcase className="w-20 h-20 text-blue-500" />
            </div>

            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <Briefcase className="w-7 h-7 text-blue-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">Bac Pro</h3>
            <p className="text-slate-500 text-xs leading-relaxed mb-8 font-medium">
              Filières professionnelles, BTS et insertion. Calcule ton potentiel d'admission.
            </p>
            <div className="flex items-center gap-2 text-blue-500 font-black text-xs uppercase tracking-wider mt-auto">
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
