
import React, { useState } from 'react';
import { Board, Shape, ShapeType } from '../types';
import { Plus, Layout, Clock, Trash2, ArrowRight, Pencil, Check, Search, Filter } from 'lucide-react';
import { FloatingChip } from './ui/FloatingChip';

interface DashboardProps {
  boards: Board[];
  onCreate: () => void;
  onOpen: (board: Board) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onRename: (id: string, newTitle: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ boards, onCreate, onOpen, onDelete, onRename }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'RECENT'>('ALL');

  const startEditing = (e: React.MouseEvent, board: Board) => {
      e.stopPropagation();
      setEditingId(board.id);
      setEditTitle(board.title);
  };

  const saveTitle = (e: React.MouseEvent | React.FormEvent, id: string) => {
      e.stopPropagation();
      e.preventDefault();
      onRename(id, editTitle);
      setEditingId(null);
  };

  const getShapeCounts = (shapes: Shape[]) => {
      const counts: Record<string, number> = {};
      shapes.forEach(s => {
          counts[s.type] = (counts[s.type] || 0) + 1;
      });
      return Object.entries(counts)
          .sort((a, b) => b[1] - a[1]);
  };

  // Filter Logic
  const filteredBoards = boards
    .filter(board => board.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.lastModified - a.lastModified);

  return (
    <div className="p-10 h-full overflow-y-auto animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
           <div>
              <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">My Projects</h1>
              <p className="text-slate-400">Continue where you left off or start something new.</p>
           </div>
           
           <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search projects..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white focus:border-nova-primary/50 focus:bg-slate-800 outline-none transition-all w-64"
                    />
                </div>
                <button 
                    onClick={onCreate}
                    className="flex items-center gap-2 px-6 py-2.5 bg-nova-primary hover:bg-cyan-300 text-black font-bold rounded-xl transition-all shadow-glow hover:scale-105 active:scale-95"
                >
                    <Plus size={20} /> New Board
                </button>
           </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-8">
            <FloatingChip active={filterType === 'ALL'} onClick={() => setFilterType('ALL')}>All Projects</FloatingChip>
            <FloatingChip active={filterType === 'RECENT'} onClick={() => setFilterType('RECENT')} icon={<Clock size={16}/>}>Recent</FloatingChip>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {/* Create New Card */}
           <button 
             onClick={onCreate}
             className="group flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-700 rounded-2xl hover:border-nova-primary/50 hover:bg-slate-800/30 transition-all gap-4"
           >
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-nova-primary/20 group-hover:text-nova-primary text-slate-500">
                <Plus size={32} />
              </div>
              <span className="text-slate-400 font-medium group-hover:text-white">Create New Board</span>
           </button>

           {/* Board Cards */}
           {filteredBoards.map(board => {
             const typeCounts = getShapeCounts(board.shapes);
             const displayCounts = typeCounts.slice(0, 3);
             const remaining = typeCounts.slice(3).reduce((acc, curr) => acc + curr[1], 0);

             return (
               <div 
                 key={board.id}
                 onClick={() => onOpen(board)}
                 className="group bg-nova-card border border-slate-700/50 hover:border-nova-primary/50 rounded-2xl p-6 h-64 flex flex-col cursor-pointer hover:shadow-float transition-all relative overflow-hidden"
               >
                  {/* Actions */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(e, board.id); }}
                        className="p-2 bg-slate-800/80 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg backdrop-blur-sm transition-colors"
                        title="Delete Board"
                      >
                        <Trash2 size={16} />
                      </button>
                  </div>

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center mb-4 shadow-inner group-hover:from-nova-primary/20 group-hover:to-cyan-900/20 transition-all border border-slate-600/30 group-hover:border-nova-primary/30">
                     <Layout size={24} className="text-slate-400 group-hover:text-nova-primary" />
                  </div>
                  
                  {/* Title */}
                  <div className="mb-2 h-8 flex items-center">
                    {editingId === board.id ? (
                        <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                            <input 
                                autoFocus
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                className="bg-slate-800 border border-nova-primary rounded px-2 py-1 text-white text-lg font-bold w-full outline-none"
                                onKeyDown={e => e.key === 'Enter' && saveTitle(e, board.id)}
                            />
                            <button onClick={e => saveTitle(e, board.id)} className="p-1 bg-nova-primary text-black rounded hover:bg-cyan-300"><Check size={16}/></button>
                        </div>
                    ) : (
                        <h3 className="text-xl font-bold text-white line-clamp-1 flex items-center gap-2 group/title">
                            {board.title}
                            <button 
                                onClick={(e) => startEditing(e, board)}
                                className="opacity-0 group-hover/title:opacity-100 text-slate-500 hover:text-white transition-opacity"
                            >
                                <Pencil size={14}/>
                            </button>
                        </h3>
                    )}
                  </div>

                  {/* Stats Chips */}
                  <div className="flex flex-wrap gap-2 mb-auto content-start overflow-hidden h-14">
                     {displayCounts.map(([type, count]) => (
                         <span key={type} className="bg-slate-800 px-2 py-0.5 rounded text-xs text-slate-400 border border-slate-700 capitalize whitespace-nowrap">
                             {count} {type.toLowerCase().replace('_', ' ')}{count > 1 ? 's' : ''}
                         </span>
                     ))}
                     {remaining > 0 && <span className="bg-slate-800 px-2 py-0.5 rounded text-xs text-slate-500">+{remaining} more</span>}
                     {board.shapes.length === 0 && <span className="text-slate-600 text-xs italic">Empty Project</span>}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50 text-xs text-slate-500">
                     <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>{new Date(board.lastModified).toLocaleDateString()}</span>
                     </div>
                     <div className="flex items-center gap-1 text-nova-primary opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all font-medium">
                        Open <ArrowRight size={12} />
                     </div>
                  </div>
               </div>
             );
           })}
           
           {filteredBoards.length === 0 && (
               <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
                   <Search size={48} className="mb-4 opacity-20"/>
                   <p>No projects found matching "{searchQuery}"</p>
               </div>
           )}
        </div>
      </div>
    </div>
  );
};
