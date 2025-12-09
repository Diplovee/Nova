
import React, { useMemo, useState } from 'react';
import { Shape, ShapeType } from '../types';
import { CalendarClock, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface TimelineViewProps {
    shapes: Shape[];
    onUpdateShapes: (shapes: Shape[]) => void;
}

const DAY_WIDTH_MAP = {
    compact: 40,
    normal: 80,
    wide: 120
};

export const TimelineView: React.FC<TimelineViewProps> = ({ shapes, onUpdateShapes }) => {
    const [viewMode, setViewMode] = useState<'compact' | 'normal' | 'wide'>('normal');
    const [scrollOffset, setScrollOffset] = useState(0);

    const tasks = useMemo(() => 
        shapes.filter(s => s.type === ShapeType.TASK).sort((a, b) => (a.startDate || 0) - (b.startDate || 0)), 
    [shapes]);

    // Calculate overall timeline range
    const { minDate, maxDate, totalDays } = useMemo(() => {
        if (tasks.length === 0) {
            const now = new Date();
            return { minDate: now, maxDate: new Date(now.getTime() + 86400000 * 14), totalDays: 14 };
        }
        
        let min = Infinity;
        let max = -Infinity;

        tasks.forEach(t => {
            const start = t.startDate || Date.now();
            const end = t.dueDate || (start + 86400000);
            if (start < min) min = start;
            if (end > max) max = end;
        });

        // Add padding
        min -= 86400000 * 2;
        max += 86400000 * 5;

        const total = Math.ceil((max - min) / 86400000);
        return { minDate: new Date(min), maxDate: new Date(max), totalDays: total };
    }, [tasks]);

    const dayWidth = DAY_WIDTH_MAP[viewMode];
    
    const getPosition = (date: number) => {
        const diff = date - minDate.getTime();
        const days = diff / 86400000;
        return days * dayWidth;
    };

    const days = Array.from({ length: totalDays }, (_, i) => {
        const d = new Date(minDate.getTime() + i * 86400000);
        return {
            date: d,
            label: d.getDate(),
            dayName: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
            isWeekend: d.getDay() === 0 || d.getDay() === 6,
            isToday: d.toDateString() === new Date().toDateString()
        };
    });

    return (
        <div className="h-full flex flex-col bg-[#1E1E28] overflow-hidden">
            {/* Header / Toolbar */}
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-nova-bg">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CalendarClock className="text-nova-primary"/> Project Timeline
                    </h2>
                    <p className="text-slate-400 text-sm">Visual schedule of your tasks</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1 border border-slate-700">
                    <button onClick={() => setViewMode('compact')} className={`p-2 rounded ${viewMode === 'compact' ? 'bg-nova-primary text-black' : 'text-slate-400 hover:text-white'}`}><ZoomOut size={16}/></button>
                    <button onClick={() => setViewMode('normal')} className={`px-3 py-1 rounded text-xs font-bold ${viewMode === 'normal' ? 'bg-nova-primary text-black' : 'text-slate-400 hover:text-white'}`}>Default</button>
                    <button onClick={() => setViewMode('wide')} className={`p-2 rounded ${viewMode === 'wide' ? 'bg-nova-primary text-black' : 'text-slate-400 hover:text-white'}`}><ZoomIn size={16}/></button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar (Task Names) */}
                <div className="w-64 bg-nova-card border-r border-slate-700 flex flex-col shrink-0 z-20 shadow-xl">
                    <div className="h-12 border-b border-slate-700 bg-slate-800/50 flex items-center px-4 font-bold text-slate-400 text-xs uppercase tracking-wider">
                        Task Name
                    </div>
                    <div className="flex-1 overflow-y-hidden"> {/* Synced scroll would go here ideally */}
                         <div className="py-2">
                            {tasks.map(task => (
                                <div key={task.id} className="h-12 flex items-center px-4 border-b border-slate-700/30 hover:bg-slate-700/30 transition-colors group">
                                    <div className={`w-2 h-2 rounded-full mr-3 ${task.status === 'DONE' ? 'bg-nova-accent' : task.status === 'IN_PROGRESS' ? 'bg-nova-primary' : 'bg-slate-500'}`} />
                                    <span className="text-sm text-slate-200 truncate">{task.text}</span>
                                </div>
                            ))}
                         </div>
                         {tasks.length === 0 && (
                             <div className="p-8 text-center text-slate-500 text-sm">
                                 No tasks found. Add tasks to see them on the timeline.
                             </div>
                         )}
                    </div>
                </div>

                {/* Timeline Grid */}
                <div className="flex-1 overflow-auto relative custom-scrollbar bg-[#1a1a23]">
                    <div style={{ width: totalDays * dayWidth, minWidth: '100%' }}>
                        
                        {/* Date Header */}
                        <div className="h-12 border-b border-slate-700 flex sticky top-0 bg-[#1a1a23] z-10">
                            {days.map((day, i) => (
                                <div 
                                    key={i} 
                                    className={`flex flex-col items-center justify-center border-r border-slate-700/30 ${day.isWeekend ? 'bg-black/20' : ''} ${day.isToday ? 'bg-nova-primary/10' : ''}`}
                                    style={{ width: dayWidth, minWidth: dayWidth }}
                                >
                                    <span className={`text-[10px] font-bold uppercase ${day.isToday ? 'text-nova-primary' : 'text-slate-500'}`}>{day.dayName}</span>
                                    <span className={`text-sm ${day.isToday ? 'font-bold text-white' : 'text-slate-300'}`}>{day.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Chart Area */}
                        <div className="relative py-2">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 pointer-events-none flex">
                                {days.map((day, i) => (
                                    <div 
                                        key={i} 
                                        className={`border-r border-slate-700/10 h-full ${day.isWeekend ? 'bg-black/10' : ''} ${day.isToday ? 'bg-nova-primary/5 border-l border-l-nova-primary/20' : ''}`}
                                        style={{ width: dayWidth, minWidth: dayWidth }}
                                    />
                                ))}
                            </div>

                            {/* Task Bars */}
                            {tasks.map(task => {
                                const start = task.startDate || Date.now();
                                const end = task.dueDate || (start + 86400000); // Default 1 day
                                const left = getPosition(start);
                                const width = Math.max(dayWidth, getPosition(end) - left);

                                return (
                                    <div key={task.id} className="h-12 relative flex items-center mb-0 group">
                                        <div 
                                            className={`absolute h-8 rounded-lg shadow-sm border border-white/10 flex items-center px-3 truncate text-xs font-medium text-black cursor-pointer hover:brightness-110 transition-all ${
                                                task.status === 'DONE' ? 'bg-nova-accent' : 
                                                task.status === 'IN_PROGRESS' ? 'bg-nova-primary' : 'bg-slate-400'
                                            }`}
                                            style={{ 
                                                left: Math.max(0, left), 
                                                width: width
                                            }}
                                            title={`${task.text} (${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()})`}
                                        >
                                           {width > 40 && <span className="drop-shadow-md">{task.text}</span>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
