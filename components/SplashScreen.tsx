
import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1E1E28] text-white transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="relative mb-8">
         <div className="absolute inset-0 bg-nova-primary/20 blur-3xl rounded-full animate-pulse"/>
         <img 
            src="/icon.png" 
            className="w-32 h-32 rounded-3xl shadow-glow relative z-10 animate-float" 
            alt="Nova Logo" 
         />
      </div>
      
      <h1 className="text-4xl font-bold tracking-tight mb-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
        Nova Project Manager
      </h1>
      
      <div className="flex items-center gap-2 text-slate-400 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
         <Sparkles size={16} className="text-nova-primary animate-spin-slow" />
         <span className="text-sm font-medium tracking-wide">POWERED BY XALO SOFTWARE</span>
      </div>

      <div className="mt-12 w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-nova-primary animate-[shimmer_2s_infinite] w-full origin-left" />
      </div>
    </div>
  );
};
