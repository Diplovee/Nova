import React from 'react';
import { ToolButton } from '../ui/ToolButton';
import { CustomTooltip } from '../ui/CustomTooltip';
import { ShapeType, Shape, ConnectionStyle, Point, Side, ShapeStyling, Connection } from '../../types';
import {
  LayoutTemplate, Lightbulb, Square, Type, Image as ImageIcon, Mic, Link as LinkIcon, Minus, MoreHorizontal, MoreVertical, GitCommitHorizontal, FileText, Table, Database, Maximize2, Minimize2, Sparkles, XCircle, Loader2, ArrowUp, ArrowRight, ArrowDown, ArrowLeft, Trash2, MousePointer2, Hand, Undo2, Redo2, PanelLeft, PanelRight
} from 'lucide-react';
import { RightPanel } from '../RightPanel';

interface BoardUIProps {
  activeTool: string;
  setActiveTool: (tool: any) => void;
  scale: number;
  handleFitToScreen: () => void;
  handleResetView: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  isToolbarCollapsed: boolean;
  setIsToolbarCollapsed: (collapsed: boolean) => void;
  defaultConnectionStyle: ConnectionStyle;
  setDefaultConnectionStyle: (style: ConnectionStyle) => void;
  triggerImageToolUpload: () => void;

  // Panel Toggles
  toggleSidebar: () => void;
  toggleRightPanel: () => void;

  // Selection Context
  selectedConnection: { from: string, to: string, midPoint?: Point } | null;
  selectedIds: Set<string>;
  shapes: Shape[];

  // Actions
  updateConnection: (targetId: string, updates: Partial<Connection>) => void;
  deleteConnection: () => void;
  updateStyling: (styling: Partial<ShapeStyling>) => void;

  // Undo/Redo
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // AI
  showAiModal: boolean;
  setShowAiModal: (show: boolean) => void;
  loadingIds: Set<string>;
  handleAIBrainstorm: (mode: 'subtasks' | 'nodes' | 'refine' | 'custom' | 'note' | 'sheet') => void;
}

export const BoardUI: React.FC<BoardUIProps> = ({
  activeTool,
  setActiveTool,
  scale,
  handleFitToScreen,
  handleResetView,
  handleZoomIn,
  handleZoomOut,
  isToolbarCollapsed,
  setIsToolbarCollapsed,
  defaultConnectionStyle,
  setDefaultConnectionStyle,
  triggerImageToolUpload,
  toggleSidebar,
  toggleRightPanel,
  selectedConnection,
  selectedIds,
  shapes,
  updateConnection,
  deleteConnection,
  updateStyling,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  showAiModal,
  setShowAiModal,
  loadingIds,
  handleAIBrainstorm
}) => {
  return (
    <>
      {/* Toolbar */}
      <div className={`absolute bg-nova-card/90 backdrop-blur-md border border-slate-700/50 rounded-2xl p-2 shadow-float flex items-center gap-2 transition-all duration-300 z-[102]`}
        style={{
          left: `calc((100vw - 256px) / 2 - 300px)`, /* Center on board area with 300px left offset */
          bottom: '8px',
          transform: 'none'
        }}>
         <div className="flex items-center gap-1 pr-2 border-r border-slate-700/50">
             <CustomTooltip content="Undo last action" shortcut="Ctrl+Z">
               <ToolButton icon={Undo2} title="Undo" isActive={false} onClick={onUndo} disabled={!canUndo} />
             </CustomTooltip>
             <CustomTooltip content="Redo last undone action" shortcut="Ctrl+Y">
               <ToolButton icon={Redo2} title="Redo" isActive={false} onClick={onRedo} disabled={!canRedo} />
             </CustomTooltip>
         </div>
         <div className="flex items-center gap-1 pr-2 border-r border-slate-700/50">
             <CustomTooltip content="Select and move shapes">
               <ToolButton icon={MousePointer2} title="Select" isActive={activeTool === 'SELECT'} onClick={() => setActiveTool('SELECT')} />
             </CustomTooltip>
             <CustomTooltip content="Pan the board" shortcut="Space">
               <ToolButton icon={Hand} title="Pan" isActive={activeTool === 'HAND'} onClick={() => setActiveTool('HAND')} />
             </CustomTooltip>
         </div>
         <div className="flex items-center gap-1 pr-2 border-r border-slate-700/50">
             <CustomTooltip content="Create task shapes">
               <ToolButton icon={LayoutTemplate} title="Task" isActive={activeTool === ShapeType.TASK} onClick={() => setActiveTool(ShapeType.TASK)} />
             </CustomTooltip>
             <CustomTooltip content="Create idea shapes">
               <ToolButton icon={Lightbulb} title="Idea" isActive={activeTool === ShapeType.IDEA} onClick={() => setActiveTool(ShapeType.IDEA)} />
             </CustomTooltip>
             <CustomTooltip content="Create rectangle shapes">
               <ToolButton icon={Square} title="Rectangle" isActive={activeTool === ShapeType.RECTANGLE} onClick={() => setActiveTool(ShapeType.RECTANGLE)} />
             </CustomTooltip>
             <CustomTooltip content="Create text shapes">
               <ToolButton icon={Type} title="Text" isActive={activeTool === ShapeType.TEXT} onClick={() => setActiveTool(ShapeType.TEXT)} />
             </CustomTooltip>
             <CustomTooltip content="Upload and add images">
               <ToolButton icon={ImageIcon} title="Image" isActive={activeTool === ShapeType.IMAGE} onClick={triggerImageToolUpload} />
             </CustomTooltip>
             <CustomTooltip content="Record voice notes">
               <ToolButton icon={Mic} title="Voice Note" isActive={activeTool === ShapeType.VOICE} onClick={() => setActiveTool(ShapeType.VOICE)} />
             </CustomTooltip>
             <div className="relative flex items-center">
               <CustomTooltip content="Connect shapes with arrows">
                 <ToolButton icon={LinkIcon} title="Connect" isActive={activeTool === 'CONNECTOR'} onClick={() => setActiveTool('CONNECTOR')} />
               </CustomTooltip>
                {activeTool === 'CONNECTOR' && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-nova-card border border-slate-700 p-1.5 rounded-lg flex gap-1 shadow-xl animate-in fade-in slide-in-from-bottom-2">
                        <button onClick={() => setDefaultConnectionStyle('solid')} className={`p-1.5 rounded hover:bg-slate-700 ${defaultConnectionStyle === 'solid' ? 'bg-nova-primary text-black' : 'text-slate-400'}`} title="Solid"><Minus size={14}/></button>
                        <button onClick={() => setDefaultConnectionStyle('dashed')} className={`p-1.5 rounded hover:bg-slate-700 ${defaultConnectionStyle === 'dashed' ? 'bg-nova-primary text-black' : 'text-slate-400'}`} title="Dashed"><MoreHorizontal size={14}/></button>
                        <button onClick={() => setDefaultConnectionStyle('dotted')} className={`p-1.5 rounded hover:bg-slate-700 ${defaultConnectionStyle === 'dotted' ? 'bg-nova-primary text-black' : 'text-slate-400'}`} title="Dotted"><MoreVertical size={14}/></button>
                        <button onClick={() => setDefaultConnectionStyle('double')} className={`p-1.5 rounded hover:bg-slate-700 ${defaultConnectionStyle === 'double' ? 'bg-nova-primary text-black' : 'text-slate-400'}`} title="Double"><GitCommitHorizontal size={14}/></button>
                    </div>
                )}
             </div>
         </div>
         <div className="flex items-center gap-1">
             <CustomTooltip content="Toggle left sidebar">
               <ToolButton icon={PanelLeft} title="Sidebar" isActive={false} onClick={toggleSidebar} />
             </CustomTooltip>
             <CustomTooltip content="Toggle right panel">
               <ToolButton icon={PanelRight} title="Right Panel" isActive={false} onClick={toggleRightPanel} />
             </CustomTooltip>
         </div>
      </div>
      
      {/* Connection Context Menu */}
      {selectedConnection && selectedConnection.midPoint && (
            <div 
                className="absolute z-[100] bg-nova-card border border-slate-700 rounded-xl shadow-float p-2 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200"
                style={{
                    left: selectedConnection.midPoint.x,
                    top: selectedConnection.midPoint.y,
                    transform: 'translate(-50%, -100%) translateY(-10px)'
                }}
            >
                <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg">
                    <button onClick={() => updateConnection(selectedConnection.to, { style: 'solid' })} title="Solid" className="p-2 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white"><Minus size={16}/></button>
                    <button onClick={() => updateConnection(selectedConnection.to, { style: 'dashed' })} title="Dashed" className="p-2 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white"><MoreHorizontal size={16}/></button>
                    <button onClick={() => updateConnection(selectedConnection.to, { style: 'dotted' })} title="Dotted" className="p-2 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white"><MoreVertical size={16}/></button>
                    <button onClick={() => updateConnection(selectedConnection.to, { style: 'double' })} title="Double" className="p-2 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white"><GitCommitHorizontal size={16}/></button>
                </div>
                <div className="h-px bg-slate-700/50 w-full" />
                <div className="flex justify-between items-center gap-2 px-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">From</span>
                    <div className="flex gap-0.5">
                         {['top', 'right', 'bottom', 'left'].map(side => {
                             const isActive = shapes.find(s => s.id === selectedConnection.from)?.connections.find(c => c.targetId === selectedConnection.to)?.sourceSide === side;
                             return (
                                 <button key={side} onClick={() => updateConnection(selectedConnection.to, { sourceSide: side as Side })} className={`p-1 rounded hover:bg-slate-700 ${isActive ? 'text-nova-primary bg-nova-primary/10' : 'text-slate-400'}`}>
                                     {side === 'top' && <ArrowUp size={12}/>}
                                     {side === 'right' && <ArrowRight size={12}/>}
                                     {side === 'bottom' && <ArrowDown size={12}/>}
                                     {side === 'left' && <ArrowLeft size={12}/>}
                                 </button>
                             )
                         })}
                    </div>
                </div>
                <div className="flex justify-between items-center gap-2 px-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">To</span>
                    <div className="flex gap-0.5">
                        {['top', 'right', 'bottom', 'left'].map(side => {
                             const isActive = shapes.find(s => s.id === selectedConnection.from)?.connections.find(c => c.targetId === selectedConnection.to)?.targetSide === side;
                             return (
                                 <button key={side} onClick={() => updateConnection(selectedConnection.to, { targetSide: side as Side })} className={`p-1 rounded hover:bg-slate-700 ${isActive ? 'text-nova-primary bg-nova-primary/10' : 'text-slate-400'}`}>
                                     {side === 'top' && <ArrowUp size={12}/>}
                                     {side === 'right' && <ArrowRight size={12}/>}
                                     {side === 'bottom' && <ArrowDown size={12}/>}
                                     {side === 'left' && <ArrowLeft size={12}/>}
                                 </button>
                             )
                         })}
                    </div>
                </div>
                <div className="h-px bg-slate-700/50 w-full" />
                <button 
                    onClick={deleteConnection}
                    className="flex items-center gap-2 p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-xs font-medium"
                >
                    <Trash2 size={14}/> Delete Connection
                </button>
            </div>
      )}

      {/* AI Modal */}
      {showAiModal && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-nova-card border border-nova-primary/30 rounded-2xl shadow-glow p-6 z-[100] w-96 animate-in slide-in-from-top-4 fade-in">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles className="text-nova-primary" size={20}/> AI Assistant</h3>
                  <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-white"><XCircle size={20}/></button>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                  {loadingIds.size > 0 ? "Analyzing attachments and generating..." : "What should we do with the selected items?"}
              </p>
              
              {loadingIds.size === 0 && (
                <div className="space-y-2">
                    <button onClick={() => handleAIBrainstorm('subtasks')} className="w-full text-left px-4 py-3 rounded-xl bg-slate-800 hover:bg-nova-primary/10 hover:border-nova-primary/50 border border-transparent transition-all group">
                        <span className="font-semibold text-white group-hover:text-nova-primary block">Break Down</span>
                        <span className="text-xs text-slate-500">Generate subtasks from text/media</span>
                    </button>
                    <button onClick={() => handleAIBrainstorm('nodes')} className="w-full text-left px-4 py-3 rounded-xl bg-slate-800 hover:bg-nova-primary/10 hover:border-nova-primary/50 border border-transparent transition-all group">
                        <span className="font-semibold text-white group-hover:text-nova-primary block">Brainstorm</span>
                        <span className="text-xs text-slate-500">Create related idea nodes</span>
                    </button>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                         <button onClick={() => handleAIBrainstorm('note')} className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-nova-primary/10 hover:border-nova-primary/50 border border-transparent transition-all group flex flex-col items-center justify-center gap-1">
                            <FileText size={20} className="text-slate-400 group-hover:text-nova-primary"/>
                            <span className="text-xs font-semibold text-white">Draft Note</span>
                        </button>
                        <button onClick={() => handleAIBrainstorm('sheet')} className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-nova-primary/10 hover:border-nova-primary/50 border border-transparent transition-all group flex flex-col items-center justify-center gap-1">
                            <Table size={20} className="text-slate-400 group-hover:text-nova-primary"/>
                            <span className="text-xs font-semibold text-white">Create Sheet</span>
                        </button>
                    </div>
                </div>
              )}
              
              {loadingIds.size > 0 && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-nova-primary" size={32}/></div>}
          </div>
      )}
    </>
  );
};
