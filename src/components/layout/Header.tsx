import React from 'react';
import { GraduationCap, Settings } from 'lucide-react';

interface HeaderProps {
  academy?: string;
  onSettingsClick: () => void;
}

export default function Header({ academy, onSettingsClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50 backdrop-blur-md bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-200">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
              Orientation <span className="text-indigo-600">Post-Bac</span>
            </h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Plateforme d'Analyse Parcoursup</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {academy && (
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                Académe: {academy}
              </span>
            </div>
          )}
          <button 
            onClick={onSettingsClick}
            className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all active:scale-95"
            title="Modifier mon profil"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
