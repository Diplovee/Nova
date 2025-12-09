import React, { useState } from 'react';
import { ArrowRight, Sparkles, Layout, CheckCircle2 } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Nova",
      description: "The premium visual workspace for creative minds.",
      icon: <img src="/icon.png" className="w-32 h-32 rounded-3xl shadow-glow mb-8 animate-float" alt="Nova"/>,
      bg: "from-slate-900 via-[#1E1E28] to-slate-900"
    },
    {
      title: "Infinite Canvas",
      description: "Break free from linear constraints. Map out tasks, ideas, and resources on a boundless board.",
      icon: <Layout className="w-24 h-24 text-nova-primary mb-6 animate-float" />,
      bg: "from-[#1E1E28] via-slate-900 to-[#101015]"
    },
    {
      title: "AI Powered",
      description: "Generate subtasks, expand ideas, and refine content instantly with Gemini AI.",
      icon: <Sparkles className="w-24 h-24 text-yellow-400 mb-6 animate-float" />,
      bg: "from-slate-900 via-[#1E1E28] to-slate-800"
    },
    {
      title: "Stay Organized",
      description: "Seamlessly switch between visual boards, structured task lists, and timelines.",
      icon: <CheckCircle2 className="w-24 h-24 text-nova-accent mb-6 animate-float" />,
      bg: "from-[#1a1a20] via-[#1E1E28] to-slate-900"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center text-white bg-gradient-to-br ${steps[step].bg} transition-all duration-700`}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nova-primary/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg p-8 animate-in fade-in zoom-in duration-500" key={step}>
        <div className="mb-4">
            {steps[step].icon}
        </div>
        
        <h1 className="text-5xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 drop-shadow-sm">
            {steps[step].title}
        </h1>
        
        <p className="text-xl text-slate-400 mb-12 leading-relaxed font-light">
            {steps[step].description}
        </p>

        <div className="flex gap-3 mb-12">
            {steps.map((_, i) => (
                <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-10 bg-nova-primary shadow-glow' : 'w-2 bg-slate-700'}`} 
                />
            ))}
        </div>

        <button 
            onClick={handleNext}
            className="group relative px-10 py-4 bg-white text-black font-bold text-lg rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-nova-primary via-white to-nova-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative flex items-center gap-3">
                {step === steps.length - 1 ? "Get Started" : "Next"} <ArrowRight size={20}/>
            </span>
        </button>
      </div>
      
      {step < steps.length - 1 && (
          <button onClick={onComplete} className="absolute top-8 right-8 text-slate-500 hover:text-white text-sm font-medium transition-colors uppercase tracking-widest z-20">
              Skip
          </button>
      )}
    </div>
  );
};