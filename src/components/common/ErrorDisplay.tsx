import React from 'react';
import { Info, Settings, RotateCcw } from 'lucide-react';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  onReset?: () => void;
}

export default function ErrorDisplay({ message, onRetry, onReset }: ErrorDisplayProps) {
  return (
    <div className="text-center py-16 px-6 bg-white rounded-[2.5rem] border border-red-100 shadow-xl shadow-red-50 max-w-2xl mx-auto animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <Info className="w-10 h-10 text-red-500" />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-4">Oups !</h3>
      <p className="text-slate-600 mb-10 leading-relaxed max-w-md mx-auto">
        {message}
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-95"
          >
            <RotateCcw className="w-5 h-5" /> Réessayer
          </button>
        )}
        {onReset && (
          <button 
            onClick={onReset}
            className="w-full sm:w-auto bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Settings className="w-5 h-5" /> Modifier mon profil
          </button>
        )}
      </div>
    </div>
  );
}
