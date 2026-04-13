import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Settings } from 'lucide-react';

interface HeaderProps {
  academy?: string;
  onSettingsClick: () => void;
}

export default function Header({ academy, onSettingsClick }: HeaderProps) {
  return (
    <header className="bg-white/80 border-b border-slate-100 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 h-24 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20"
          >
            <GraduationCap className="w-8 h-8 text-white" />
          </motion.div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
              Orientation <span className="text-primary">Post-Bac</span>
            </h1>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Plateforme d'Analyse Parcoursup</span>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          {academy && (
            <div className="hidden md:flex items-center gap-4 px-5 py-2.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                Académie: {academy}
              </span>
            </div>
          )}
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: '#f8fafc' }}
            whileTap={{ scale: 0.95 }}
            onClick={onSettingsClick}
            className="p-3.5 text-slate-400 hover:text-primary rounded-2xl transition-all border border-transparent hover:border-slate-100"
            title="Modifier mon profil"
          >
            <Settings className="w-6 h-6" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}
