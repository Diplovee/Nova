import React from 'react';

interface FloatingChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  icon?: React.ReactNode;
}

export const FloatingChip: React.FC<FloatingChipProps> = ({ 
  children, 
  active = false, 
  variant = 'secondary', 
  icon,
  className = '',
  ...props 
}) => {
  const baseStyles = "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform select-none";
  
  const variants = {
    primary: active 
      ? "bg-nova-primary text-black shadow-glow translate-y-[-2px]" 
      : "bg-nova-card text-nova-primary hover:bg-opacity-80 hover:translate-y-[-1px] border border-nova-primary/20",
    secondary: active 
      ? "bg-slate-700 text-white shadow-lg translate-y-[-2px]" 
      : "bg-nova-card text-slate-300 hover:bg-slate-800 hover:text-white hover:translate-y-[-1px] border border-slate-700",
    accent: "bg-nova-accent/20 text-nova-accent border border-nova-accent/50 hover:bg-nova-accent/30 hover:shadow-glow",
    danger: "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {children}
    </button>
  );
};