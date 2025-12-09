
import React, { useState, useEffect } from 'react';
import { Shape } from '../types';
import { X, Sparkles, Save, Table, Plus } from 'lucide-react';
import { generateSheetData } from '../services/geminiService';

interface SheetEditorProps {
  shape: Shape;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Shape>) => void;
}

const ROWS = 20;
const COLS = 10;
const COL_HEADERS = Array.from({ length: COLS }, (_, i) => String.fromCharCode(65 + i));

export const SheetEditor: React.FC<SheetEditorProps> = ({ shape, onClose, onUpdate }) => {
  const [data, setData] = useState<Record<string, string>>(shape.content?.cells || {});
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize some basic data if empty
  useEffect(() => {
    if (!shape.content?.cells && Object.keys(data).length === 0) {
        // Optional: Pre-fill A1
    }
  }, []);

  const handleCellChange = (cellId: string, value: string) => {
    setData(prev => ({ ...prev, [cellId]: value }));
  };

  const handleSave = () => {
    onUpdate(shape.id, { 
        content: { ...shape.content, cells: data },
        text: Object.values(data)[0] || 'Sheet' // Update display text to first cell value
    });
  };

  const handleAiGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    const newData = await generateSheetData(prompt);
    setData(prev => ({ ...prev, ...newData }));
    setIsGenerating(false);
    setPrompt('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-6xl h-[85vh] bg-[#1E1E28] rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3">
             <div className="bg-green-500/20 p-2 rounded-lg text-green-400">
                <Table size={20} />
             </div>
             <h2 className="text-xl font-bold text-white">Nova Sheet</h2>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-700 flex-1 max-w-xl mx-4">
             <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask AI to fill data (e.g., 'Plan a weekly content calendar')"
                className="bg-transparent border-none outline-none text-sm px-3 text-white flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
             />
             <button 
                onClick={handleAiGenerate}
                disabled={isGenerating || !prompt}
                className="p-1.5 bg-nova-primary/20 text-nova-primary rounded hover:bg-nova-primary/30 transition-colors disabled:opacity-30"
             >
                {isGenerating ? <Sparkles size={14} className="animate-spin"/> : <Sparkles size={14}/>}
             </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
                onClick={() => { handleSave(); onClose(); }}
                className="flex items-center gap-2 px-4 py-2 bg-nova-primary text-black font-semibold rounded-lg hover:bg-cyan-300 transition-colors"
            >
                <Save size={16} /> Save
            </button>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
                <X size={20} />
            </button>
          </div>
        </div>

        {/* Grid Area */}
        <div className="flex-1 overflow-auto bg-[#1a1a23] relative">
            <div className="inline-block min-w-full">
                {/* Headers */}
                <div className="flex sticky top-0 z-10">
                    <div className="w-10 h-8 bg-slate-800 border-r border-b border-slate-700 sticky left-0 z-20" />
                    {COL_HEADERS.map(col => (
                        <div key={col} className="w-32 h-8 bg-slate-800 border-r border-b border-slate-700 flex items-center justify-center text-xs text-slate-400 font-medium shrink-0">
                            {col}
                        </div>
                    ))}
                </div>

                {/* Rows */}
                {Array.from({ length: ROWS }, (_, r) => {
                    const rowNum = r + 1;
                    return (
                        <div key={rowNum} className="flex">
                            <div className="w-10 h-8 bg-slate-800 border-r border-b border-slate-700 flex items-center justify-center text-xs text-slate-500 sticky left-0 z-10 shrink-0">
                                {rowNum}
                            </div>
                            {COL_HEADERS.map(col => {
                                const cellId = `${col}${rowNum}`;
                                return (
                                    <input
                                        key={cellId}
                                        type="text"
                                        value={data[cellId] || ''}
                                        onChange={(e) => handleCellChange(cellId, e.target.value)}
                                        className="w-32 h-8 bg-transparent border-r border-b border-slate-700/50 text-sm text-slate-200 px-2 outline-none focus:bg-slate-700/30 focus:border-nova-primary/50 shrink-0 truncate"
                                    />
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};
