import React from 'react';

interface CustomTooltipProps {
  children: React.ReactNode;
  content: string;
  shortcut?: string;
  disabled?: boolean;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  children,
  content,
  shortcut,
  disabled = false
}) => {
  if (disabled) return <>{children}</>;

  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-700 shadow-xl z-[100] max-w-xs">
        <div className="text-center leading-tight">
          <div>{content}</div>
          {shortcut && (
            <div className="mt-1 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">
              {shortcut}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
