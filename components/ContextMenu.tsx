import React from 'react';
import { Shape } from '../types';
import { Copy, Layers, Lock, Unlock, Group, Ungroup, Sparkles } from 'lucide-react';

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
  onAIActions
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
          top: y,
          transform: 'translate(-50%, -100%) translateY(-8px)'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent backdrop close when clicking menu
      >
        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-0.5 min-w-[160px]">
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

          {selectedIds.size > 1 && (
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
          )}

          {Array.from(selectedIds).some(id => id !== triggerShape.id) && (
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
          )}
        </div>

        {/* Separator and AI Actions */}
        <div className="h-px bg-slate-700/50 my-1" />
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
      </div>
    </>
  );
};
