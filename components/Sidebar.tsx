
import React from 'react';
import { Page } from '../types';
import { Layout, Map, CheckSquare, Users, Settings, ChevronLeft, ChevronRight, FileText, Table, CalendarClock } from 'lucide-react';

interface SidebarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage, isCollapsed, toggleSidebar }) => {
  const navItems = [
    { id: Page.DASHBOARD, label: 'Dashboard', icon: <Layout size={20} /> },
    { id: Page.NOVA_BOARD, label: 'Nova Board', icon: <Map size={20} /> },
    { id: Page.TASKS, label: 'Tasks', icon: <CheckSquare size={20} /> },
    { id: Page.TIMELINE, label: 'Timeline', icon: <CalendarClock size={20} /> },
    { id: Page.NOTES, label: 'Notes', icon: <FileText size={20} /> },
    { id: Page.SHEETS, label: 'Sheets', icon: <Table size={20} /> },
    { id: Page.RESOURCES, label: 'Resources', icon: <Users size={20} /> },
  ];

  return (
    <aside 
      className={`${isCollapsed ? 'w-20' : 'w-64'} h-screen bg-nova-bg border-r border-slate-800/50 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out`}
    >
      <div className={`flex items-center gap-3 mb-8 px-6 pt-6 ${isCollapsed ? 'justify-center' : ''}`}>
        <img 
          src="/icon.png" 
          alt="Nova Logo" 
          className="w-8 h-8 min-w-[32px] rounded-lg shadow-glow object-cover" 
        />
        <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
          <h1 className="text-xl font-bold tracking-tight text-white whitespace-nowrap">Nova</h1>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
              currentPage === item.id
                ? 'bg-nova-card text-nova-primary shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-slate-700/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            } ${isCollapsed ? 'justify-center' : ''}`}
          >
            <span className={`${currentPage === item.id ? 'text-nova-primary' : 'text-slate-500 group-hover:text-slate-300'}`}>
              {item.icon}
            </span>
            <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
               <span className="font-medium whitespace-nowrap">{item.label}</span>
            </div>
            {currentPage === item.id && !isCollapsed && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-nova-primary shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            )}
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700 transition-opacity">
                {item.label}
              </div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-800 space-y-2">
        <button 
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full p-2 text-slate-500 hover:text-white hover:bg-slate-800/30 rounded-xl transition-colors"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <button 
          onClick={() => setPage(Page.SETTINGS)}
          className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors w-full ${
            currentPage === Page.SETTINGS 
             ? 'bg-nova-card text-white border border-slate-700/50'
             : 'text-slate-500 hover:text-white hover:bg-slate-800/30'
          } ${isCollapsed ? 'justify-center' : ''}`}
          title="Settings"
        >
          <Settings size={20} />
          <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <span>Settings</span>
          </div>
        </button>
      </div>
    </aside>
  );
};