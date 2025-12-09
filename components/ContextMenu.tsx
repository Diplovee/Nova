import React from 'react';
import { Shape, ShapeType, ShapeStyling } from '../types';
import { Copy, Layers, Lock, Unlock, Group, Ungroup, Sparkles, Network, Shrink, Plus, Trash2, Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { CustomTooltip } from './ui/CustomTooltip';

interface ContextMenuProps {
  triggerShape: Shape;
  selectedIds: Set<string>;
  x: number;
  y: number;
  onClose: () => void;
  onDuplicate: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onToggleLock: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onAIActions: () => void;
  onUpdateStyling?: (styling: Partial<ShapeStyling>) => void;
  onExpandSubtasks?: (shapeId: string) => void;
  onCollapseSubtasks?: (shapeId: string) => void;
  onAddSubtask?: (shapeId: string) => void;
  onClearAllSubtasks?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  triggerShape,
  selectedIds,
  x,
  y,
  onClose,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onToggleLock,
  onGroup,
  onUngroup,
  onAIActions,
  onUpdateStyling,
  onExpandSubtasks,
  onCollapseSubtasks,
  onAddSubtask,
  onClearAllSubtasks
}) => {
  return (
    <>
      {/* Backdrop to close menu when clicking outside */}
      <div
        className="fixed inset-0 z-[999] animate-in fade-in duration-100"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />

      {/* Menu */}
      <div
        className="absolute z-[1000] bg-nova-card border border-slate-700/50 rounded-lg shadow-xl p-1 animate-in fade-in zoom-in-95 duration-150 max-w-[200px]"
        style={{
          left: x,
          top: y
        }}
        onClick={(e) => e.stopPropagation()} // Prevent backdrop close when clicking menu
      >
        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-0.5 min-w-[160px]">
          <CustomTooltip content="Duplicate selected shape(s)" shortcut="Ctrl+D">
            <button
              onClick={() => {
                onDuplicate();
                onClose();
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-700/50 rounded text-slate-300 hover:text-white transition-colors w-full text-left"
            >
              <Copy size={16} />
              <span>Duplicate</span>
            </button>
          </CustomTooltip>

          <CustomTooltip content="Bring to front" shortcut="Ctrl+F">
            <button
              onClick={() => {
                onBringToFront();
                onClose();
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-700/50 rounded text-slate-300 hover:text-white transition-colors w-full text-left"
            >
              <Layers size={16} />
              <span>Bring to Front</span>
            </button>
          </CustomTooltip>

          <CustomTooltip content="Send to back" shortcut="Ctrl+B">
            <button
              onClick={() => {
                onSendToBack();
                onClose();
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-700/50 rounded text-slate-300 hover:text-white transition-colors w-full text-left"
            >
              <Layers size={16} className="opacity-50" />
              <span>Send to Back</span>
            </button>
          </CustomTooltip>

          <CustomTooltip content={triggerShape.locked ? "Unlock shape" : "Lock shape"} shortcut="Ctrl+L">
            <button
              onClick={() => {
                onToggleLock();
                onClose();
              }}
              className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-700/50 rounded transition-colors w-full text-left ${
                triggerShape.locked
                  ? 'text-red-400 hover:text-red-300'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {triggerShape.locked ? <Lock size={16} /> : <Unlock size={16} />}
              <span>{triggerShape.locked ? 'Unlock' : 'Lock'}</span>
            </button>
          </CustomTooltip>

          {selectedIds.size > 1 && (
            <CustomTooltip content="Group selected shapes" shortcut="Ctrl+G">
              <button
                onClick={() => {
                  onGroup();
                  onClose();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-700/50 rounded text-slate-300 hover:text-white transition-colors w-full text-left"
              >
                <Group size={16} />
                <span>Group</span>
              </button>
            </CustomTooltip>
          )}

          {Array.from(selectedIds).some(id => id !== triggerShape.id) && (
            <CustomTooltip content="Ungroup shapes" shortcut="Ctrl+Shift+G">
              <button
                onClick={() => {
                  onUngroup();
                  onClose();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-700/50 rounded text-slate-300 hover:text-white transition-colors w-full text-left"
              >
                <Ungroup size={16} />
                <span>Ungroup</span>
              </button>
            </CustomTooltip>
          )}
        </div>

        {/* Task Actions - only show for tasks */}
        {(triggerShape.type === ShapeType.TASK || triggerShape.type === ShapeType.IDEA) && (
          <>
            <div className="h-px bg-slate-700/50 my-1" />

            {/* Subtask Expansion/Collapse */}
            {(triggerShape.subtasks?.length || triggerShape.expandedNodeIds) && onExpandSubtasks && onCollapseSubtasks && (
              <CustomTooltip content={triggerShape.expandedNodeIds ? "Collapse expanded nodes" : "Expand to subtasks on canvas"}>
                <button
                  onClick={() => {
                    if (triggerShape.expandedNodeIds) {
                      onCollapseSubtasks(triggerShape.id);
                    } else {
                      onExpandSubtasks(triggerShape.id);
                    }
                    onClose();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-700/50 rounded text-slate-300 hover:text-white transition-colors w-full text-left"
                >
                  {triggerShape.expandedNodeIds ? <Shrink size={16} /> : <Network size={16} />}
                  <span>{triggerShape.expandedNodeIds ? 'Collapse' : 'Expand'}</span>
                </button>
              </CustomTooltip>
            )}

            {/* Add Subtask - only for tasks without expanded nodes */}
            {triggerShape.type === ShapeType.TASK && !triggerShape.expandedNodeIds && onAddSubtask && (
              <CustomTooltip content="Add a new subtask">
                <button
                  onClick={() => {
                    onAddSubtask(triggerShape.id);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-700/50 rounded text-slate-300 hover:text-white transition-colors w-full text-left"
                >
                  <Plus size={16} />
                  <span>Add Subtask</span>
                </button>
              </CustomTooltip>
            )}

            {/* Clear All Subtasks - only if subtasks exist */}
            {triggerShape.subtasks && triggerShape.subtasks.length > 0 && onClearAllSubtasks && (
              <CustomTooltip content="Remove all subtasks">
                <button
                  onClick={() => {
                    onClearAllSubtasks();
                    onClose();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-500/20 rounded text-slate-300 hover:text-red-400 transition-colors w-full text-left"
                >
                  <Trash2 size={16} />
                  <span>Clear All Subtasks</span>
                </button>
              </CustomTooltip>
            )}
          </>
        )}

        {/* Text Formatting - only for text shapes */}
        {triggerShape.type === ShapeType.TEXT && (
          <>
            <div className="h-px bg-slate-700/50 my-1" />

            {/* Quick Text Format */}
            <div className="grid grid-cols-4 gap-0.5">
              <CustomTooltip content="Bold">
                <button
                  onClick={() => {
                    const newStyling = {
                      fontWeight: triggerShape.styling?.fontWeight === 'bold' ? 'normal' : 'bold'
                    };
                    onUpdateStyling(newStyling);
                    onClose();
                  }}
                  className={`flex items-center justify-center px-3 py-2 text-sm hover:bg-slate-700/50 rounded transition-colors ${
                    triggerShape.styling?.fontWeight === 'bold' ? 'bg-nova-primary text-black' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Bold size={16} />
                </button>
              </CustomTooltip>

              <CustomTooltip content="Italic">
                <button
                  onClick={() => {
                    const newStyling = {
                      fontStyle: triggerShape.styling?.fontStyle === 'italic' ? 'normal' : 'italic'
                    };
                    onUpdateStyling(newStyling);
                    onClose();
                  }}
                  className={`flex items-center justify-center px-3 py-2 text-sm hover:bg-slate-700/50 rounded transition-colors ${
                    triggerShape.styling?.fontStyle === 'italic' ? 'bg-nova-primary text-black' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Italic size={16} />
                </button>
              </CustomTooltip>

              <CustomTooltip content="Underline">
                <button
                  onClick={() => {
                    const newStyling = {
                      textDecoration: triggerShape.styling?.textDecoration === 'underline' ? 'none' : 'underline'
                    };
                    onUpdateStyling(newStyling);
                    onClose();
                  }}
                  className={`flex items-center justify-center px-3 py-2 text-sm hover:bg-slate-700/50 rounded transition-colors ${
                    triggerShape.styling?.textDecoration === 'underline' ? 'bg-nova-primary text-black' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Underline size={16} />
                </button>
              </CustomTooltip>

              <CustomTooltip content="Bullet List">
                <button
                  onClick={() => {
                    const newStyling = {
                      listStyle: triggerShape.styling?.listStyle === 'bullet' ? 'none' : 'bullet'
                    };
                    onUpdateStyling(newStyling);
                    onClose();
                  }}
                  className={`flex items-center justify-center px-3 py-2 text-sm hover:bg-slate-700/50 rounded transition-colors ${
                    triggerShape.styling?.listStyle === 'bullet' ? 'bg-nova-primary text-black' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <List size={16} />
                </button>
              </CustomTooltip>
            </div>

            {/* Text Alignment */}
            <div className="grid grid-cols-4 gap-0.5 mt-1">
              <CustomTooltip content="Align Left">
                <button
                  onClick={() => {
                    onUpdateStyling({ textAlign: 'left' });
                    onClose();
                  }}
                  className={`flex items-center justify-center px-3 py-2 text-sm hover:bg-slate-700/50 rounded transition-colors ${
                    triggerShape.styling?.textAlign === 'left' ? 'bg-nova-primary text-black' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <AlignLeft size={16} />
                </button>
              </CustomTooltip>

              <CustomTooltip content="Align Center">
                <button
                  onClick={() => {
                    onUpdateStyling({ textAlign: 'center' });
                    onClose();
                  }}
                  className={`flex items-center justify-center px-3 py-2 text-sm hover:bg-slate-700/50 rounded transition-colors ${
                    triggerShape.styling?.textAlign === 'center' ? 'bg-nova-primary text-black' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <AlignCenter size={16} />
                </button>
              </CustomTooltip>

              <CustomTooltip content="Align Right">
                <button
                  onClick={() => {
                    onUpdateStyling({ textAlign: 'right' });
                    onClose();
                  }}
                  className={`flex items-center justify-center px-3 py-2 text-sm hover:bg-slate-700/50 rounded transition-colors ${
                    triggerShape.styling?.textAlign === 'right' ? 'bg-nova-primary text-black' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <AlignRight size={16} />
                </button>
              </CustomTooltip>

              <CustomTooltip content="Numbered List">
                <button
                  onClick={() => {
                    const newStyling = {
                      listStyle: triggerShape.styling?.listStyle === 'numbered' ? 'none' : 'numbered'
                    };
                    onUpdateStyling(newStyling);
                    onClose();
                  }}
                  className={`flex items-center justify-center px-3 py-2 text-sm hover:bg-slate-700/50 rounded transition-colors ${
                    triggerShape.styling?.listStyle === 'numbered' ? 'bg-nova-primary text-black' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <ListOrdered size={16} />
                </button>
              </CustomTooltip>
            </div>
          </>
        )}

        {/* Separator and AI Actions */}
        <div className="h-px bg-slate-700/50 my-1" />
        <CustomTooltip content="Use AI to enhance your content">
          <button
            onClick={() => {
              onAIActions();
              onClose();
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-nova-primary/20 rounded text-nova-primary hover:text-white transition-colors w-full text-left border border-transparent hover:border-nova-primary/30"
          >
            <Sparkles size={16} />
            <span>AI Actions</span>
          </button>
        </CustomTooltip>
      </div>
    </>
  );
};
