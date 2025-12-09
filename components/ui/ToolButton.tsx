import React from 'react';

export const ToolButton = ({ 
    icon: Icon, 
    title, 
    isActive, 
    onClick,
    disabled = false
  }: { 
    icon: any, 
    title: string, 
    isActive: boolean,
    onClick: () => void,
    disabled?: boolean
  }) => (
      <div className={`relative group ${disabled ? 'opacity-40' : ''}`}>
          <button 
          type="button"
          disabled={disabled}
          onPointerDown={(e) => e.stopPropagation()} 
          onMouseDown={(e) => e.stopPropagation()} 
          onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!disabled) onClick();
          }} 
          className={`p-3 rounded-xl transition-all duration-200 relative ${
              isActive
              ? 'bg-nova-primary text-black shadow-glow scale-105 z-10' 
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50 z-0'
          } ${disabled ? 'cursor-not-allowed' : ''}`} 
          >
          <Icon size={20} />
          </button>
          {!disabled && (
            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-700 shadow-xl z-[100]">
                {title}
            </span>
          )}
      </div>
  );