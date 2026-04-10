import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Briefcase, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TrackSelectionProps {
  onSelect: (track: 'general' | 'pro') => void;
}

export default function TrackSelection({ onSelect }: TrackSelectionProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 sm:p-12 rounded-[3rem] shadow-2xl shadow-primary-light/30 border border-slate-100 text-center"
        >
          <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
            Bienvenue sur <span className="text-primary italic">l'Étudiant</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium mb-12 max-w-2xl mx-auto">
            Pour t'aider au mieux dans ton orientation, dis-nous quel type de bac tu prépares.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bac Général */}
            <button
              onClick={() => onSelect('general')}
              className="group relative p-8 bg-white border-2 border-slate-100 rounded-[2rem] hover:border-primary hover:shadow-xl hover:shadow-primary-light/20 transition-all duration-300 text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <GraduationCap className="w-24 h-24 text-primary" />
              </div>
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Bac Général</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  Tu suis des enseignements de spécialité et tu envisages des études supérieures longues ou courtes.
                </p>
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  Continuer <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            {/* Bac Pro */}
            <button
              onClick={() => onSelect('pro')}
              className="group relative p-8 bg-white border-2 border-slate-100 rounded-[2rem] hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Briefcase className="w-24 h-24 text-blue-500" />
              </div>
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Bac Pro</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  Tu prépares un baccalauréat professionnel pour entrer dans la vie active ou poursuivre en BTS.
                </p>
                <div className="flex items-center gap-2 text-blue-500 font-bold text-sm">
                  Continuer <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
