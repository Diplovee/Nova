
import React, { useRef, useEffect } from 'react';
import { Shape, ShapeType, Attachment, ShapeStyling, Side } from '../../types';
import { SimpleMarkdown } from '../ui/SimpleMarkdown';
import { ContextMenu } from '../ContextMenu';
import {
  LayoutTemplate, Lightbulb, Database, Type, Square, Circle, FileText, Table, Image as ImageIcon, Mic,
  Lock, PlayCircle, CheckCircle2, Sparkles, Plus, Network, Shrink, Copy, MoreVertical,
  ArrowUpCircle, ArrowDownCircle, Unlock, Minus, PauseCircle, Group, Ungroup, Layers, CornerDownRight, Trash2
} from 'lucide-react';

interface ShapeLayerProps {
  shapes: Shape[];
  selectedIds: Set<string>;
  editingId: string | null;
  isEditing: boolean;
  loadingIds: Set<string>;
  hoveredShapeId: string | null;
  activeTool: string;
  isRecording: boolean;
  recordingPos: any;
  onShapeMouseDown: (e: React.MouseEvent, shape: Shape) => void;
  onShapeDoubleClick: (e: React.MouseEvent, shape: Shape) => void;
  onMouseEnter: (id: string) => void;
  onMouseLeave: () => void;
  onResizeMouseDown: (e: React.MouseEvent, handle: string, shape: Shape) => void;
  onConnectionStart: (e: React.MouseEvent, shapeId: string, side: Side) => void;
  onUpdateShapes: (shapes: Shape[], saveHistory?: boolean) => void;
  setShapesDirectly: (shapes: Shape[]) => void;
  setIsEditing: (is: boolean) => void;
  setEditingId: (id: string | null) => void;
  onOpenEditor: (shape: Shape) => void;
  onOpenImageModal: (attachment: Attachment) => void;

  // Actions
  setShowAiModal: (show: boolean) => void;
  triggerFileUpload: () => void;
  triggerRecording: () => void;
  stopRecording: () => void;
  duplicateShape: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  toggleLock: () => void;
  updateOpacity: (opacity: number) => void;
  updateStyling: (styling: Partial<ShapeStyling>) => void;
  onGroup: () => void;
  onUngroup: () => void;
  onExpandSubtasks: (shapeId: string) => void;
  onCollapseSubtasks: (shapeId: string) => void;
  addSubtask: (shapeId: string) => void;

  // Helpers
  setSelectedIds: (ids: Set<string>) => void;
  playAudio: (url: string) => void;
  autoSizeShape: (shape: Shape) => Shape;
  generateId: () => string;

  // Context menu
  onCloseContextMenu?: (closeFn: () => void) => void;
  onSetContextMenuTriggerId?: (id: string | null) => void;
  contextMenuTriggerId?: string | null;
}

const SHAPE_ICONS: Record<ShapeType, React.ElementType> = {
  [ShapeType.TASK]: LayoutTemplate,
  [ShapeType.IDEA]: Lightbulb,
  [ShapeType.DATA]: Database,
  [ShapeType.TEXT]: Type,
  [ShapeType.RECTANGLE]: Square,
  [ShapeType.CIRCLE]: Circle,
  [ShapeType.NOTE]: FileText,
  [ShapeType.SHEET]: Table,
  [ShapeType.IMAGE]: ImageIcon,
  [ShapeType.VOICE]: Mic,
};

export const ShapeLayer: React.FC<ShapeLayerProps> = ({
  shapes,
  selectedIds,
  editingId,
  isEditing,
  loadingIds,
  hoveredShapeId,
  activeTool,
  isRecording,
  recordingPos,
  onShapeMouseDown,
  onShapeDoubleClick,
  onMouseEnter,
  onMouseLeave,
  onResizeMouseDown,
  onConnectionStart,
  onUpdateShapes,
  setShapesDirectly,
  setIsEditing,
  setEditingId,
  onOpenEditor,
  onOpenImageModal,
  setShowAiModal,
  triggerFileUpload,
  triggerRecording,
  stopRecording,
  duplicateShape,
  bringToFront,
  sendToBack,
  toggleLock,
  updateOpacity,
  updateStyling,
  onGroup,
  onUngroup,
  onExpandSubtasks,
  onCollapseSubtasks,
  addSubtask,
  setSelectedIds,
  playAudio,
  autoSizeShape,
  generateId,
  onCloseContextMenu,
  onSetContextMenuTriggerId,
  contextMenuTriggerId
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [contextMenu, setContextMenu] = React.useState<{triggerShapeId: string, x: number, y: number} | null>(null);

  // Expose close function to parent
  React.useEffect(() => {
    if (onCloseContextMenu) {
      onCloseContextMenu(() => setContextMenu(null));
    }
  }, [onCloseContextMenu]);

  // Context menu closing is now handled by the ContextMenu component itself

  // Auto Resize Textarea
  useEffect(() => {
    if (isEditing && textAreaRef.current && editingId) {
        const shape = shapes.find(s => s.id === editingId);
        if (shape) {
            textAreaRef.current.style.height = 'auto';
            const newHeight = Math.max(shape.type === ShapeType.TEXT ? 40 : 100, textAreaRef.current.scrollHeight);
            textAreaRef.current.style.height = `${newHeight}px`;
            
            if (newHeight > shape.height && shape.type !== ShapeType.RECTANGLE) {
                 const updatedShapes = shapes.map(s => s.id === editingId ? { ...s, height: newHeight + 20 } : s);
                 setShapesDirectly(updatedShapes); // Use directly to avoid history spam
            }
        }
    }
  }, [isEditing, shapes, editingId]);

  // Subtask Helpers
  const toggleSubtaskComplete = (shapeId: string, subtaskId: string) => {
    const shape = shapes.find(s => s.id === shapeId);
    if(!shape || !shape.subtasks) return;
    const updatedSubtasks = shape.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st);
    onUpdateShapes(shapes.map(s => s.id === shapeId ? { ...shape, subtasks: updatedSubtasks } : s));
  };

  const updateSubtaskTitle = (shapeId: string, subtaskId: string, newTitle: string) => {
    const shape = shapes.find(s => s.id === shapeId);
    if(!shape || !shape.subtasks) return;
    const updatedSubtasks = shape.subtasks.map(st => st.id === subtaskId ? { ...st, title: newTitle } : st);
    setShapesDirectly(shapes.map(s => s.id === shapeId ? { ...shape, subtasks: updatedSubtasks } : s));
  };

  const removeSubtask = (shapeId: string, subtaskId: string) => {
    const shape = shapes.find(s => s.id === shapeId);
    if(!shape || !shape.subtasks) return;
    const updatedSubtasks = shape.subtasks.filter(st => st.id !== subtaskId);
    onUpdateShapes(shapes.map(s => s.id === shapeId ? { ...shape, subtasks: updatedSubtasks } : s));
  };

  const clearAllSubtasks = (shapeId: string) => {
    const shape = shapes.find(s => s.id === shapeId);
    if(!shape) return;
    onUpdateShapes(shapes.map(s => s.id === shapeId ? { ...shape, subtasks: [] } : s));
  };



  const getShapeStyle = (shape: Shape, isSelected: boolean) => {
    const baseStyle: React.CSSProperties = {};

    // Apply background color from styling if present, or legacy color
    if (shape.styling?.fillColor) {
        baseStyle.backgroundColor = shape.styling.fillColor;
    } else if (shape.color) {
        baseStyle.backgroundColor = shape.color;
    } else if (!shape.styling?.fillColor && !shape.color && shape.type !== ShapeType.RECTANGLE && shape.type !== ShapeType.IMAGE) {
        baseStyle.backgroundColor = '#272732'; // Default Nova Card
    }

    // Border handling - skip default borders for images, but allow user-set borders
    if (shape.styling?.borderColor && shape.styling.borderColor !== 'transparent') {
        baseStyle.borderColor = shape.styling.borderColor;
        baseStyle.borderWidth = shape.styling.borderWidth ?? 1;
        baseStyle.borderStyle = shape.styling.borderStyle ?? 'solid';
        if (shape.styling.borderRadius !== undefined) {
             baseStyle.borderRadius = shape.styling.borderRadius;
        }
    } else if (shape.type === ShapeType.RECTANGLE) {
         // Default Rect Styles
         baseStyle.borderWidth = 2;
         baseStyle.borderColor = '#475569';
         baseStyle.borderRadius = 16;
    }
    // Images get no default border, only user-selected borders

    if (isSelected && shape.type === ShapeType.RECTANGLE) {
        baseStyle.borderColor = '#22d3ee';
    }

    return baseStyle;
  };

  return (
    <>
      {shapes.map((shape, index) => {
          const isSelected = selectedIds.has(shape.id);
          const Icon = SHAPE_ICONS[shape.type] || LayoutTemplate;
          const isLoading = loadingIds.has(shape.id);
          const hasAttachments = shape.attachments && shape.attachments.length > 0;
          const hasSubtasks = shape.subtasks && shape.subtasks.length > 0;
          const isImageShape = shape.type === ShapeType.IMAGE;
          const isRect = shape.type === ShapeType.RECTANGLE;
          const isVoice = shape.type === ShapeType.VOICE;

          return (
            <div
              key={shape.id}
              data-shape
              className={`absolute group transition-shadow duration-200 select-none ${
                  isSelected && !isRect ? 'z-[90]' : 'z-10'
              }`}
              style={{
                left: shape.x,
                top: shape.y,
                width: shape.width,
                height: shape.height,
                zIndex: isSelected && !isRect ? 90 : index,
                opacity: shape.opacity ?? 1
              }}
              onMouseDown={(e) => onShapeMouseDown(e, shape)}
              onMouseEnter={() => onMouseEnter(shape.id)}
              onMouseLeave={onMouseLeave}
              onDoubleClick={(e) => onShapeDoubleClick(e, shape)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Select this shape (deselecting any others)
                setSelectedIds(new Set([shape.id]));
                // Update triggerId in parent
                if (onSetContextMenuTriggerId) {
                  onSetContextMenuTriggerId(shape.id);
                }
                setContextMenu({
                  triggerShapeId: shape.id,
                  x: e.clientX,
                  y: e.clientY
                });
              }}
            >


              <div 
                className={`w-full h-full relative overflow-hidden transition-all duration-200 flex flex-col ${
                 isSelected && !isRect ? 'ring-2 ring-nova-primary shadow-[0_0_20px_rgba(34,211,238,0.3)]' : isRect ? '' : 'shadow-lg hover:shadow-xl border border-slate-700/50'
                } ${!isRect ? 'rounded-2xl' : ''}`}
                style={getShapeStyle(shape, isSelected)}
              >
                 
                 {isLoading && <div className="absolute inset-0 skeleton-loader z-50 opacity-50" />}
                 {shape.locked && <div className="absolute top-2 right-2 z-20 text-slate-500"><Lock size={14}/></div>}

                 {isRect && (
                     <div className="w-full h-full p-4">
                         {isEditing && editingId === shape.id ? (
                             <textarea
                                ref={textAreaRef}
                                autoFocus
                                className="w-full h-full bg-transparent resize-none outline-none text-slate-200 font-bold placeholder:text-slate-500/50 leading-snug text-center flex items-center justify-center"
                                value={shape.text}
                                onChange={(e) => setShapesDirectly(shapes.map(s => s.id === shape.id ? { ...s, text: e.target.value } : s))}
                                onBlur={() => { setIsEditing(false); setEditingId(null); onUpdateShapes(shapes); }}
                                onKeyDown={(e) => e.stopPropagation()}
                                placeholder="Group Label"
                            />
                         ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-200/80 font-bold pointer-events-none">
                                 {shape.text}
                             </div>
                         )}
                     </div>
                 )}

                 {isImageShape ? (
                     <div className="w-full h-full flex items-center justify-center overflow-hidden">
                         {shape.attachments && shape.attachments[0] ? (
                             <img
                                 src={shape.attachments[0].url}
                                 alt={shape.attachments[0].name}
                                 className="w-full h-full object-contain"
                                 draggable={false}
                                 onDragStart={(e) => e.preventDefault()}
                             />
                         ) : (
                             <div className="text-slate-500 flex flex-col items-center">
                                 <ImageIcon size={32} />
                                 <span className="text-xs mt-2">No Image</span>
                             </div>
                         )}
                     </div>
                 ) : shape.type === ShapeType.NOTE ? (
                     <div className="flex flex-col h-full">
                         {/* Header */}
                         <div className="p-4 pb-2 flex items-start gap-3 shrink-0">
                             <div className="p-2 rounded-xl bg-slate-700/50 text-slate-400">
                                 <Icon size={20} />
                             </div>
                             <div className="flex-1 min-w-0">
                                 {isEditing && editingId === shape.id ? (
                                     <textarea
                                         ref={textAreaRef}
                                         autoFocus
                                         className="w-full bg-transparent resize-none outline-none text-slate-200 font-semibold leading-snug"
                                         value={shape.text}
                                         onChange={(e) => setShapesDirectly(shapes.map(s => s.id === shape.id ? { ...s, text: e.target.value } : s))}
                                         onBlur={() => { setIsEditing(false); setEditingId(null); onUpdateShapes(shapes); }}
                                         onKeyDown={(e) => e.stopPropagation()}
                                         placeholder="Type something..."
                                     />
                                 ) : (
                                     <div className="text-slate-200 font-semibold leading-snug whitespace-pre-wrap break-words">
                                         {shape.text?.split('\n')[0]?.trim() || 'Untitled Note'}
                                     </div>
                                 )}
                             </div>
                         </div>

                         {/* Content Preview */}
                         <div className="px-4 pb-4 flex-1 overflow-hidden">
                             {(() => {
                                 const fullText = shape.text || '';
                                 const lines = fullText.split('\n');
                                 const titleLine = lines[0] || '';
                                 const contentLines = lines.slice(1);

                                 // Calculate how many lines to show based on shape height
                                 const availableHeight = shape.height - 120; // Header height approx
                                 const lineHeight = 20; // Approximate line height in pixels
                                 const maxLines = Math.max(1, Math.floor(availableHeight / lineHeight));

                                 // Include title + content preview
                                 const previewLines = lines.length > 1 ? lines.slice(1, 1 + maxLines) : [];
                                 const previewText = previewLines.join('\n').trim();

                                 return previewText ? (
                                     <div className="text-slate-400 text-sm leading-relaxed overflow-hidden">
                                         <SimpleMarkdown text={previewText} />
                                         {contentLines.length > maxLines && (
                                             <span className="text-slate-500 text-xs">...</span>
                                         )}
                                     </div>
                                 ) : (
                                     <div className="text-slate-500 text-sm italic">
                                         Double-click to edit...
                                     </div>
                                 );
                             })()}
                         </div>
                     </div>
                 ) : !isRect && (
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="p-4 pb-2 flex items-start gap-3 shrink-0">
                            <div className={`p-2 rounded-xl ${
                                shape.type === ShapeType.TASK ? 'bg-nova-primary/10 text-nova-primary' : 
                                shape.type === ShapeType.IDEA ? 'bg-yellow-400/10 text-yellow-400' : 
                                shape.type === ShapeType.VOICE ? 'bg-red-500/10 text-red-400' :
                                'bg-slate-700/50 text-slate-400'
                            }`}>
                                <Icon size={20} />
                            </div>
                            
                            {/* Title Editor */}
                            <div className="flex-1 min-w-0">
                                {isEditing && editingId === shape.id ? (
                                    <textarea
                                        ref={textAreaRef}
                                        autoFocus
                                        className="w-full bg-transparent resize-none outline-none text-slate-200 font-semibold leading-snug"
                                        value={shape.text}
                                        onChange={(e) => setShapesDirectly(shapes.map(s => s.id === shape.id ? { ...s, text: e.target.value } : s))}
                                        onBlur={() => { setIsEditing(false); setEditingId(null); onUpdateShapes(shapes); }}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        placeholder="Type something..."
                                    />
                                ) : (
                                    <div className="text-slate-200 font-semibold leading-snug whitespace-pre-wrap break-words">
                                        {shape.text || (isVoice ? 'Voice Note' : 'Untitled')}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="px-4 pb-2 flex-1 overflow-y-auto custom-scrollbar">
                            {/* Voice Player */}
                            {isVoice && shape.attachments?.[0] && (
                                <div className="mt-2 bg-black/20 rounded-xl p-3 flex items-center gap-3 border border-slate-700/50">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); playAudio(shape.attachments![0].url); }}
                                        className="w-8 h-8 rounded-full bg-nova-primary text-black flex items-center justify-center hover:scale-110 transition-transform"
                                    >
                                        <PlayCircle size={16} fill="black" />
                                    </button>
                                    <div className="flex-1 h-8 flex items-center gap-0.5">
                                        {Array.from({length: 12}).map((_,i) => (
                                            <div key={i} className="w-1 bg-nova-primary/40 rounded-full animate-pulse" style={{ height: Math.random() * 16 + 8, animationDelay: `${i * 0.1}s` }} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Subtasks */}
                            {hasSubtasks && !shape.hideSubtasks && (
                                <div className="mt-2 space-y-1">
                                    {shape.subtasks!.map(st => (
                                        <div key={st.id} className="group/st flex items-start gap-2 text-sm text-slate-400">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleSubtaskComplete(shape.id, st.id); }}
                                                className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${st.completed ? 'bg-nova-primary border-nova-primary' : 'border-slate-600 hover:border-nova-primary'}`}
                                            >
                                                {st.completed && <CheckCircle2 size={10} className="text-black" strokeWidth={3}/>}
                                            </button>
                                            <input
                                                value={st.title}
                                                onChange={(e) => updateSubtaskTitle(shape.id, st.id, e.target.value)}
                                                className={`bg-transparent outline-none flex-1 ${st.completed ? 'line-through opacity-50' : ''}`}
                                            />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeSubtask(shape.id, st.id); }}
                                                className="opacity-0 group-hover/st:opacity-100 text-slate-500 hover:text-red-400 transition-opacity p-0.5 rounded hover:bg-red-500/10"
                                                title="Remove subtask"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* Attachment Chips */}
                            {hasAttachments && !isImageShape && !isVoice && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {shape.attachments!.map((attachment, idx) => (
                                        <div key={attachment.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 flex items-center gap-2 text-xs">
                                            {attachment.type === 'image' ? (
                                                <button
                                                    className="relative cursor-pointer hover:scale-105 transition-transform"
                                                    onClick={(e) => { e.stopPropagation(); onOpenImageModal(attachment); }}
                                                >
                                                    <img
                                                        src={attachment.url}
                                                        alt={attachment.name}
                                                        className="w-8 h-8 rounded object-cover border border-slate-600 hover:border-nova-primary transition-colors"
                                                    />
                                                    <ImageIcon size={12} className="absolute -bottom-1 -right-1 bg-slate-800 rounded-full p-0.5 text-slate-400" />
                                                </button>
                                            ) : attachment.type === 'audio' ? (
                                                <>
                                                    <Mic size={14} className="text-red-400" />
                                                    <span className="text-slate-300 truncate max-w-24">{attachment.name}</span>
                                                </>
                                            ) : (
                                                <>
                                                    {attachment.type === 'video' ? <FileText size={14} className="text-blue-400" /> : <FileText size={14} className="text-slate-400" />}
                                                    <span className="text-slate-300 truncate max-w-24">{attachment.name}</span>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Expanded Indicator */}
                            {shape.expandedNodeIds && (
                                <div className="mt-2 p-2 bg-nova-primary/10 border border-nova-primary/20 rounded-lg flex items-center gap-2 text-xs text-nova-primary">
                                    <Network size={12}/>
                                    <span>Expanded into {shape.expandedNodeIds.length} nodes</span>
                                </div>
                            )}
                        </div>


                    </div>
                 )}

                 {/* Resize Handles */}
                 {isSelected && !shape.locked && (
                     <>
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-nova-primary rounded-full cursor-nwse-resize z-50" onMouseDown={(e) => onResizeMouseDown(e, 'nw', shape)}/>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-nova-primary rounded-full cursor-nesw-resize z-50" onMouseDown={(e) => onResizeMouseDown(e, 'ne', shape)}/>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-nova-primary rounded-full cursor-nesw-resize z-50" onMouseDown={(e) => onResizeMouseDown(e, 'sw', shape)}/>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-nova-primary rounded-full cursor-nwse-resize z-50" onMouseDown={(e) => onResizeMouseDown(e, 'se', shape)}/>
                     </>
                 )}
              </div>
            </div>
          );
      })}

      {/* Right-click Context Menu */}
      {contextMenu && (() => {
        const menuShape = shapes.find(s => s.id === contextMenu.triggerShapeId);
        if (!menuShape) return null;

        return (
          <ContextMenu
            triggerShape={menuShape}
            selectedIds={selectedIds}
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => {
              setContextMenu(null);
              if (onSetContextMenuTriggerId) onSetContextMenuTriggerId(null);
            }}
            onDuplicate={duplicateShape}
            onBringToFront={bringToFront}
            onSendToBack={sendToBack}
            onToggleLock={toggleLock}
            onGroup={onGroup}
            onUngroup={onUngroup}
            onAIActions={() => setShowAiModal(true)}
            onExpandSubtasks={onExpandSubtasks}
            onCollapseSubtasks={onCollapseSubtasks}
            onAddSubtask={addSubtask}
            onClearAllSubtasks={() => clearAllSubtasks(menuShape.id)}
          />
        );
      })()}
    </>
  );
};
