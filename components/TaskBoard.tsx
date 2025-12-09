
import React, { useState } from 'react';
import { FloatingChip } from './ui/FloatingChip';
import { ConfirmationModal } from './ConfirmationModal';
import {
    MoreHorizontal, Plus, CheckCircle2, Circle, ListChecks,
    CornerDownRight, Trash2, Edit2, Flag, AlertCircle, Calendar, X
} from 'lucide-react';
import { Shape, ShapeType } from '../types';

interface TaskBoardProps {
  shapes: Shape[];
  onUpdateShapes: (shapes: Shape[]) => void;
}

const PRIORITY_COLORS = {
    HIGH: 'bg-red-500/20 text-red-400 border-red-500/30',
    MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    LOW: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
};

const CreateTaskModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string, priority: 'HIGH' | 'MEDIUM' | 'LOW', dueDate: string) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
    const [dueDate, setDueDate] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-nova-card border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Create New Task</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Task Title</label>
                        <input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-nova-primary outline-none"
                            placeholder="What needs to be done?"
                            autoFocus
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priority</label>
                             <select 
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as any)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-nova-primary outline-none appearance-none"
                             >
                                 <option value="HIGH">High Priority</option>
                                 <option value="MEDIUM">Medium Priority</option>
                                 <option value="LOW">Low Priority</option>
                             </select>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date</label>
                             <input 
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-nova-primary outline-none"
                             />
                        </div>
                    </div>
                    <button 
                        disabled={!title.trim()}
                        onClick={() => { onSubmit(title, priority, dueDate); onClose(); setTitle(''); }}
                        className="w-full py-3 bg-nova-primary text-black font-bold rounded-xl mt-4 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Create Task
                    </button>
                </div>
            </div>
        </div>
    )
}

const TaskCard: React.FC<{
    task: Shape;
    onUpdate: (updates: Partial<Shape>) => void;
    onDelete: () => void;
}> = ({ task, onUpdate, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false);

    const toggleSubtask = (subtaskId: string) => {
        const newSubtasks = task.subtasks?.map(st => 
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        onUpdate({ subtasks: newSubtasks });
    };

    return (
        <div 
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', task.id);
                e.dataTransfer.effectAllowed = 'move';
            }}
            className="bg-nova-bg p-5 rounded-2xl border border-slate-800 hover:border-slate-600 transition-all cursor-grab active:cursor-grabbing group shadow-sm hover:shadow-float transform hover:-translate-y-1 relative"
        >
            <div className="flex justify-between items-start mb-3">
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded border ${PRIORITY_COLORS[task.priority || 'MEDIUM']}`}>
                    {task.priority || 'MEDIUM'}
                </div>
                <div className="relative">
                    <button onClick={() => setShowMenu(!showMenu)} className="text-slate-500 hover:text-white transition-colors p-1 rounded hover:bg-slate-800">
                        <MoreHorizontal size={16} />
                    </button>
                    {showMenu && (
                         <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 top-full mt-1 bg-nova-card border border-slate-700 rounded-xl shadow-xl py-1 z-20 w-32 flex flex-col">
                                <button onClick={() => onUpdate({ priority: 'HIGH' })} className="px-4 py-2 text-xs text-left text-red-400 hover:bg-slate-700">Set High Priority</button>
                                <button onClick={() => onUpdate({ priority: 'MEDIUM' })} className="px-4 py-2 text-xs text-left text-yellow-400 hover:bg-slate-700">Set Medium Priority</button>
                                <button onClick={() => onUpdate({ priority: 'LOW' })} className="px-4 py-2 text-xs text-left text-blue-400 hover:bg-slate-700">Set Low Priority</button>
                                <div className="h-px bg-slate-700 my-1"/>
                                <button onClick={onDelete} className="px-4 py-2 text-xs text-left text-slate-300 hover:bg-red-500/20 hover:text-red-400 flex items-center gap-2">
                                    <Trash2 size={12}/> Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <h4 className="text-slate-200 font-medium mb-3 leading-snug">{task.text}</h4>

            {/* Tree View Subtasks */}
            {task.subtasks && task.subtasks.length > 0 && (
                <div className="mb-4 space-y-1">
                    {task.subtasks.map((st, idx) => (
                        <div key={st.id} className="flex items-start gap-2 text-sm text-slate-400 group/st">
                            <CornerDownRight size={14} className="mt-1 text-slate-600 shrink-0"/>
                            <button 
                                onClick={(e) => { e.stopPropagation(); toggleSubtask(st.id); }}
                                className={`mt-0.5 w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${st.completed ? 'bg-nova-primary border-nova-primary' : 'border-slate-600 hover:border-nova-primary'}`}
                            >
                                {st.completed && <CheckCircle2 size={10} className="text-black"/>}
                            </button>
                            <span className={`leading-tight transition-all ${st.completed ? 'line-through opacity-50' : ''}`}>{st.title}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-800">
                {task.dueDate && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar size={12}/>
                        <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                )}
                <div className="ml-auto w-6 h-6 rounded-full bg-slate-700 border-2 border-nova-bg flex items-center justify-center text-[10px] text-white font-bold">
                    {task.assignee ? task.assignee.charAt(0) : 'U'}
                </div>
            </div>
        </div>
    );
};

const Column: React.FC<{ 
  title: string; 
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  shapes: Shape[]; 
  color: string;
  onDropTask: (taskId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => void;
  onUpdateShape: (id: string, updates: Partial<Shape>) => void;
  onDeleteShape: (id: string) => void;
  onAddTask: () => void;
}> = ({ title, status, shapes, color, onDropTask, onUpdateShape, onDeleteShape, onAddTask }) => {
  
  const tasks = shapes.filter(s => s.type === ShapeType.TASK && (s.status || 'TODO') === status);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onDropTask(taskId, status);
    }
  };

  return (
    <div 
      className="flex-1 min-w-[320px] bg-[#22222d] rounded-2xl p-4 border border-slate-800/50 flex flex-col gap-4 h-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          <h3 className="text-slate-200 font-semibold tracking-wide">{title}</h3>
          <span className="text-slate-500 text-sm bg-slate-800 px-2 py-0.5 rounded-full">{tasks.length}</span>
        </div>
        <button className="text-slate-500 hover:text-white transition-colors">
          <MoreHorizontal size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-20">
        {tasks.map(task => (
            <TaskCard 
                key={task.id} 
                task={task} 
                onUpdate={(updates) => onUpdateShape(task.id, updates)}
                onDelete={() => onDeleteShape(task.id)}
            />
        ))}
        <button 
            onClick={onAddTask}
            className="w-full py-3 rounded-xl border border-dashed border-slate-700 text-slate-500 hover:text-nova-primary hover:border-nova-primary/50 hover:bg-nova-primary/5 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          <span>Add Task</span>
        </button>
      </div>
    </div>
  );
};

export const TaskBoard: React.FC<TaskBoardProps> = ({ shapes, onUpdateShapes }) => {
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetColumnStatus, setTargetColumnStatus] = useState<'TODO' | 'IN_PROGRESS' | 'DONE'>('TODO');
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const filteredShapes = shapes.filter(s => {
      if (s.type !== ShapeType.TASK) return true; // Keep other shapes in array, filter visually in column
      if (filterPriority && s.priority !== filterPriority) return false;
      return true;
  });
  
  const handleDropTask = (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    const updatedShapes = shapes.map(s => 
      s.id === taskId ? { ...s, status: newStatus } : s
    );
    onUpdateShapes(updatedShapes);
  };

  const handleUpdateShape = (id: string, updates: Partial<Shape>) => {
      const updatedShapes = shapes.map(s => s.id === id ? { ...s, ...updates } : s);
      onUpdateShapes(updatedShapes);
  };

  const handleDeleteShape = (id: string) => {
      setDeleteTaskId(id);
      setShowDeleteConfirmation(true);
  };

  const confirmDeleteTask = () => {
      if (deleteTaskId) {
          onUpdateShapes(shapes.filter(s => s.id !== deleteTaskId));
          setDeleteTaskId(null);
      }
      setShowDeleteConfirmation(false);
  };

  const cancelDeleteTask = () => {
      setDeleteTaskId(null);
      setShowDeleteConfirmation(false);
  };

  const getTaskTitle = (id: string) => {
      const task = shapes.find(s => s.id === id);
      return task?.text || 'this task';
  };

  const handleCreateTask = (title: string, priority: 'HIGH' | 'MEDIUM' | 'LOW', dueDateStr: string) => {
      const newTask: Shape = {
          id: Math.random().toString(36).substr(2, 9),
          type: ShapeType.TASK,
          x: 100, // Default positions for board view compatibility
          y: 100,
          width: 200,
          height: 120,
          text: title,
          status: targetColumnStatus,
          priority: priority,
          dueDate: dueDateStr ? new Date(dueDateStr).getTime() : undefined,
          startDate: Date.now(),
          subtasks: [],
          connections: []
      };
      onUpdateShapes([...shapes, newTask]);
  };

  const openCreateModal = (status: 'TODO' | 'IN_PROGRESS' | 'DONE' = 'TODO') => {
      setTargetColumnStatus(status);
      setIsModalOpen(true);
  };

  return (
    <div className="p-8 h-full flex flex-col gap-8 relative">
      <CreateTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateTask}
      />

      <header className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-bold text-white mb-2">Project Tasks</h2>
           <p className="text-slate-400">Drag and drop tasks to manage progress.</p>
        </div>
        <div className="flex gap-3 items-center">
            <div className="bg-slate-800 rounded-xl p-1 flex border border-slate-700">
                <button onClick={() => setFilterPriority(null)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!filterPriority ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>All</button>
                <button onClick={() => setFilterPriority('HIGH')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterPriority === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white'}`}>High</button>
                <button onClick={() => setFilterPriority('MEDIUM')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterPriority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' : 'text-slate-400 hover:text-white'}`}>Medium</button>
            </div>
            <FloatingChip variant="primary" icon={<Plus size={18}/>} onClick={() => openCreateModal('TODO')}>New Task</FloatingChip>
        </div>
      </header>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        <Column 
            title="To Do" 
            status="TODO" 
            shapes={filteredShapes} 
            color="bg-slate-500" 
            onDropTask={handleDropTask} 
            onUpdateShape={handleUpdateShape}
            onDeleteShape={handleDeleteShape}
            onAddTask={() => openCreateModal('TODO')}
        />
        <Column 
            title="In Progress" 
            status="IN_PROGRESS" 
            shapes={filteredShapes} 
            color="bg-nova-primary" 
            onDropTask={handleDropTask} 
            onUpdateShape={handleUpdateShape}
            onDeleteShape={handleDeleteShape}
            onAddTask={() => openCreateModal('IN_PROGRESS')}
        />
        <Column 
            title="Done" 
            status="DONE" 
            shapes={filteredShapes} 
            color="bg-nova-accent" 
            onDropTask={handleDropTask} 
            onUpdateShape={handleUpdateShape}
            onDeleteShape={handleDeleteShape}
            onAddTask={() => openCreateModal('DONE')}
        />
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        title="Delete Task"
        message={`Are you sure you want to delete "${getTaskTitle(deleteTaskId || '')}"? This action cannot be undone.`}
        confirmText="Delete Task"
        cancelText="Cancel"
        onConfirm={confirmDeleteTask}
        onCancel={cancelDeleteTask}
        variant="danger"
      />
    </div>
  );
};
