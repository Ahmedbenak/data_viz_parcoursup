import React from 'react';

interface LoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export default function Loader({ message = "Chargement...", fullScreen = false }: LoaderProps) {
  const content = (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-slate-100 rounded-[1.5rem]"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-[1.5rem] animate-spin shadow-lg shadow-primary/20"></div>
      </div>
      {message && <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-xl z-[100] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-16">
      {content}
    </div>
  );
}
