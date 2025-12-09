import React, { useState } from 'react';
import { ToolButton } from './ui/ToolButton';
import { ShapeType, Shape, ShapeStyling } from '../types';
import { Maximize2, Minimize2, Scan, Crosshair, ZoomIn, ZoomOut, Palette, Square, SquareDashed, CircleDashed, FileText, Table, Database } from 'lucide-react';

interface RightPanelProps {
  scale: number;
  handleFitToScreen: () => void;
  handleResetView: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  selectedIds: Set<string>;
  shapes: Shape[];
  updateStyling: (styling: Partial<ShapeStyling>) => void;
  setActiveTool: (tool: string) => void;
  activeTool: string;
}

type TabType = 'view' | 'tools' | 'properties';

export const RightPanel: React.FC<RightPanelProps> = ({
  scale,
  handleFitToScreen,
  handleResetView,
  handleZoomIn,
  handleZoomOut,
  selectedIds,
  shapes,
  updateStyling,
  setActiveTool,
  activeTool
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('view');
  const selectedShape = selectedIds.size === 1 ? shapes.find(s => s.id === Array.from(selectedIds)[0]) : null;

  // Tab buttons
  const tabs = [
    { id: 'view', label: 'View', icon: Scan },
    { id: 'tools', label: 'Tools', icon: FileText },
    { id: 'properties', label: 'Properties', icon: Palette }
  ] as const;

  return (
    <div className="fixed right-0 top-0 bottom-0 bg-nova-card/90 backdrop-blur-md border-l border-slate-700/50 p-4 z-[101] w-64 overflow-y-auto">
      {/* Tab Navigation */}
      <div className="flex justify-center space-x-2 mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                isActive
                  ? 'bg-nova-primary text-white shadow-lg'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* View Tab */}
        {activeTab === 'view' && (
          <div>
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">View Controls</h3>
            <div className="flex flex-col bg-nova-card/90 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden mb-3">
              <button onClick={handleFitToScreen} className="p-3 hover:bg-slate-700 text-slate-300 hover:text-nova-primary transition-colors border-b border-slate-700/50" title="Fit to Screen">
                <Scan size={20} />
              </button>
              <button onClick={handleResetView} className="p-3 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors" title="Reset View">
                <Crosshair size={20} />
              </button>
            </div>
            <div className="flex flex-col bg-nova-card/90 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden">
              <button onClick={handleZoomIn} className="p-3 hover:bg-slate-700 text-slate-300 hover:text-white border-b border-slate-700/50 transition-colors" title="Zoom In">
                <ZoomIn size={20} />
              </button>
              <div className="py-1 bg-slate-800 text-center text-[10px] font-bold text-slate-400 select-none cursor-default">
                {Math.round(scale * 100)}%
              </div>
              <button onClick={handleZoomOut} className="p-3 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors" title="Zoom Out">
                <ZoomOut size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Tools Tab */}
        {activeTab === 'tools' && (
          <div>
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">Tools</h3>
            <div className="grid grid-cols-3 gap-2">
              <ToolButton icon={FileText} title="Note" isActive={activeTool === ShapeType.NOTE} onClick={() => setActiveTool(ShapeType.NOTE)} />
              <ToolButton icon={Table} title="Sheet" isActive={activeTool === ShapeType.SHEET} onClick={() => setActiveTool(ShapeType.SHEET)} />
              <ToolButton icon={Database} title="Data" isActive={activeTool === ShapeType.DATA} onClick={() => setActiveTool(ShapeType.DATA)} />
            </div>
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          selectedShape ? (
            <div>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Palette size={16}/> Style</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Background</label>
                  <div className="flex flex-wrap gap-2">
                    {['transparent', '#1E1E28', '#272732', '#475569', '#ef4444', '#3b82f6', '#22c55e', '#eab308'].map(c => (
                      <button
                        key={c}
                        onClick={() => updateStyling({ fillColor: c })}
                        className={`w-6 h-6 rounded-full border border-slate-600 ${c === 'transparent' ? 'bg-slash' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Border Color</label>
                  <div className="flex flex-wrap gap-2">
                    {['transparent', '#475569', '#94a3b8', '#ffffff', '#22d3ee'].map(c => (
                      <button
                        key={c}
                        onClick={() => updateStyling({ borderColor: c })}
                        className={`w-6 h-6 rounded-full border border-slate-600 ${c === 'transparent' ? 'bg-slash' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Advanced properties mainly for shapes that support borders well */}
                {selectedShape.type === ShapeType.RECTANGLE && (
                  <>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block flex justify-between">
                        <span>Border Width</span>
                        <span>{selectedShape.styling?.borderWidth}px</span>
                      </label>
                      <input
                        type="range" min="0" max="10"
                        value={selectedShape.styling?.borderWidth || 0}
                        onChange={(e) => updateStyling({ borderWidth: parseInt(e.target.value) })}
                        className="w-full accent-nova-primary h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block flex justify-between">
                        <span>Corner Radius</span>
                        <span>{selectedShape.styling?.borderRadius}px</span>
                      </label>
                      <input
                        type="range" min="0" max="50"
                        value={selectedShape.styling?.borderRadius || 0}
                        onChange={(e) => updateStyling({ borderRadius: parseInt(e.target.value) })}
                        className="w-full accent-nova-primary h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Style</label>
                      <div className="flex gap-2">
                        <button onClick={() => updateStyling({ borderStyle: 'solid' })} className="p-2 hover:bg-slate-700 rounded"><Square size={16}/></button>
                        <button onClick={() => updateStyling({ borderStyle: 'dashed' })} className="p-2 hover:bg-slate-700 rounded"><SquareDashed size={16}/></button>
                        <button onClick={() => updateStyling({ borderStyle: 'dotted' })} className="p-2 hover:bg-slate-700 rounded"><CircleDashed size={16}/></button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-8">
              <Palette size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a shape to edit its properties</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
