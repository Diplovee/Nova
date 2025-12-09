import React, { useState, useRef, useCallback } from 'react';
import { ToolButton } from './ui/ToolButton';
import { CustomTooltip } from './ui/CustomTooltip';
import { ShapeType, Shape, ShapeStyling } from '../types';
import { Maximize2, Minimize2, Scan, Crosshair, ZoomIn, ZoomOut, Palette, Square, SquareDashed, CircleDashed, FileText, Table, Database, Copy, Lock, Unlock, Layers, Group, Ungroup, Network, Shrink, ImageIcon, Mic, Sparkles, Plus, MoreVertical, Lightbulb, Zap } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, onClose }) => {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [isDraggingColor, setIsDraggingColor] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);

  const colorRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Convert current color to HSL
    const tempElement = document.createElement('div');
    tempElement.style.color = color;
    document.body.appendChild(tempElement);
    const computedColor = getComputedStyle(tempElement).color;
    document.body.removeChild(tempElement);

    // Parse RGB from computed color
    const rgbMatch = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);

      // Convert RGB to HSL
      const max = Math.max(r, g, b) / 255;
      const min = Math.min(r, g, b) / 255;
      const delta = max - min;

      let h = 0;
      if (delta !== 0) {
        if (max === r / 255) h = ((g / 255 - b / 255) / delta) % 6;
        else if (max === g / 255) h = (b / 255 - r / 255) / delta + 2;
        else h = (r / 255 - g / 255) / delta + 4;
        h *= 60;
        if (h < 0) h += 360;
      }

      const l = (max + min) / 2;
      const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

      setHue(h);
      setSaturation(s * 100);
      setLightness(l * 100);
    }
  }, [color]);

  const hslToHex = useCallback((h: number, s: number, l: number) => {
    const sNorm = s / 100;
    const lNorm = l / 100;
    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = lNorm - c / 2;

    let r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }, []);

  const handleColorMouseDown = (e: React.MouseEvent) => {
    setIsDraggingColor(true);
    updateColorFromMouse(e, colorRef.current, true);
  };

  const handleHueMouseDown = (e: React.MouseEvent) => {
    setIsDraggingHue(true);
    updateHueFromMouse(e, hueRef.current);
  };

  const updateColorFromMouse = (e: React.MouseEvent, ref: HTMLDivElement | null, isColorSquare = false) => {
    if (!ref) return;
    const rect = ref.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    if (isColorSquare) {
      const newSaturation = (x / rect.width) * 100;
      const newLightness = ((rect.height - y) / rect.height) * 100;
      setSaturation(newSaturation);
      setLightness(newLightness);
      onChange(hslToHex(hue, newSaturation, newLightness));
    } else {
      const newHue = (x / rect.width) * 360;
      setHue(newHue);
      onChange(hslToHex(newHue, saturation, lightness));
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingColor) {
      updateColorFromMouse(e as any, colorRef.current, true);
    } else if (isDraggingHue) {
      updateHueFromMouse(e as any, hueRef.current);
    }
  }, [isDraggingColor, isDraggingHue]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingColor(false);
    setIsDraggingHue(false);
  }, []);

  React.useEffect(() => {
    if (isDraggingColor || isDraggingHue) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingColor, isDraggingHue, handleMouseMove, handleMouseUp]);

  const updateHueFromMouse = (e: React.MouseEvent | MouseEvent, ref: HTMLDivElement | null) => {
    if (!ref) return;
    const rect = ref.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, (e as any).clientX - rect.left));
    const newHue = (x / rect.width) * 360;
    setHue(newHue);
    onChange(hslToHex(newHue, saturation, lightness));
  };

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-nova-card border border-slate-700 rounded-lg shadow-xl p-3 z-[200] w-[251px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-white">Color Picker</span>
        <button onClick={onClose} className="text-slate-400 hover:text-white">×</button>
      </div>

      <div className="space-y-3">
        <div>
          <div
            ref={colorRef}
            className="w-full h-32 rounded cursor-crosshair relative overflow-hidden"
            style={{
              background: `hsl(${hue}, 100%, 50%)`,
              backgroundImage: `
                linear-gradient(to right, #fff, rgba(255,255,255,0)),
                linear-gradient(to top, #000, rgba(0,0,0,0))
              `
            }}
            onMouseDown={handleColorMouseDown}
          >
            <div
              className="absolute w-3 h-3 border border-white rounded-full pointer-events-none"
              style={{
                left: `${saturation}%`,
                top: `${100 - lightness}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.5)'
              }}
            />
          </div>
        </div>

        <div>
          <div
            ref={hueRef}
            className="w-full h-4 rounded cursor-crosshair relative"
            style={{
              background: `linear-gradient(to right,
                #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000
              )`
            }}
            onMouseDown={handleHueMouseDown}
          >
            <div
              className="absolute top-0 bottom-0 w-1 bg-white pointer-events-none"
              style={{ left: `${hue / 3.6}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded border border-slate-600 flex-shrink-0"
            style={{ backgroundColor: hslToHex(hue, saturation, lightness) }}
          />
          <span className="text-xs text-slate-400 font-mono">{hslToHex(hue, saturation, lightness)}</span>
        </div>
      </div>
    </div>
  );
};

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
  // Action handlers
  duplicateShape?: () => void;
  bringToFront?: () => void;
  sendToBack?: () => void;
  toggleLock?: () => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  onExpandSubtasks?: (shapeId: string) => void;
  onCollapseSubtasks?: (shapeId: string) => void;
  setShowAiModal?: (show: boolean) => void;
  triggerFileUpload?: () => void;
  addSubtask?: (shapeId: string) => void;
  handleAIBrainstorm?: (mode: 'subtasks' | 'nodes' | 'refine' | 'custom' | 'note' | 'sheet', customPrompt?: string) => void;
}

type TabType = 'view' | 'tools' | 'properties' | 'actions';

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
  activeTool,
  // Action handlers
  duplicateShape,
  bringToFront,
  sendToBack,
  toggleLock,
  onGroup,
  onUngroup,
  onExpandSubtasks,
  onCollapseSubtasks,
  setShowAiModal,
  triggerFileUpload,
  addSubtask,
  handleAIBrainstorm
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('view');
  const [showColorPicker, setShowColorPicker] = useState<'fill' | 'border' | null>(null);
  const [colorPickerTarget, setColorPickerTarget] = useState<string>('');
  const selectedShape = selectedIds.size === 1 ? shapes.find(s => s.id === Array.from(selectedIds)[0]) : null;

  // Tab buttons
  const tabs = [
    { id: 'view', label: 'View', icon: Scan },
    { id: 'tools', label: 'Tools', icon: FileText },
    { id: 'properties', label: 'Prop', icon: Palette },
    { id: 'actions', label: 'Actions', icon: Zap }
  ] as const;

  return (
    <div className="fixed right-0 top-0 bottom-0 bg-nova-card/90 backdrop-blur-md border-l border-slate-700/50 p-4 z-[101] w-64 overflow-y-auto">
      {/* Tab Navigation */}
      <div className="flex justify-center space-x-1 mb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex flex-col items-center gap-0.5 ${
          isActive
            ? 'bg-nova-primary text-black shadow-lg'
            : 'bg-slate-800/50 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
        }`}
            >
              <Icon size={14} />
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
              <CustomTooltip content="Fit to Screen">
                <button onClick={handleFitToScreen} className="w-full p-3 hover:bg-slate-700 text-slate-300 hover:text-nova-primary transition-colors border-b border-slate-700/50 flex items-center gap-2">
                  <Scan size={20} />
                  <span className="text-sm">Fit to Screen</span>
                </button>
              </CustomTooltip>
              <CustomTooltip content="Reset View">
                <button onClick={handleResetView} className="w-full p-3 hover:bg-slate-700 text-slate-300 hover:text-nova-primary transition-colors flex items-center gap-2">
                  <Crosshair size={20} />
                  <span className="text-sm">Reset View</span>
                </button>
              </CustomTooltip>
            </div>
            <div className="flex flex-col bg-nova-card/90 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden">
              <CustomTooltip content="Zoom In">
                <button onClick={handleZoomIn} className="w-full p-3 hover:bg-slate-700 text-slate-300 hover:text-nova-primary border-b border-slate-700/50 transition-colors flex items-center gap-2">
                  <ZoomIn size={20} />
                  <span className="text-sm">Zoom In</span>
                </button>
              </CustomTooltip>
              <div className="py-1 bg-slate-800 text-center text-[10px] font-bold text-slate-400 select-none cursor-default">
                {Math.round(scale * 100)}%
              </div>
              <CustomTooltip content="Zoom Out">
                <button onClick={handleZoomOut} className="w-full p-3 hover:bg-slate-700 text-slate-300 hover:text-nova-primary transition-colors flex items-center gap-2">
                  <ZoomOut size={20} />
                  <span className="text-sm">Zoom Out</span>
                </button>
              </CustomTooltip>
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
                <div className="relative">
                  <label className="text-xs text-slate-500 mb-1 block">Background</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {['transparent', '#1E1E28', '#272732', '#475569', '#ef4444', '#3b82f6', '#22c55e', '#eab308'].map(c => (
                      <button
                        key={c}
                        onClick={() => updateStyling({ fillColor: c })}
                        className={`w-6 h-6 rounded-full border border-slate-600 ${c === 'transparent' ? 'bg-slash' : ''}`}
                        style={{ backgroundColor: c }}
                        title={c === 'transparent' ? 'Transparent' : c}
                      />
                    ))}
                    <button
                      onClick={() => {
                        setShowColorPicker('fill');
                        setColorPickerTarget(selectedShape?.styling?.fillColor || '#000000');
                      }}
                      className="w-6 h-6 rounded-full border border-slate-600 cursor-pointer"
                      style={{
                        background: `conic-gradient(#ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)`
                      }}
                      title="Custom Color Picker"
                    />
                  </div>
                  {showColorPicker === 'fill' && (
                    <ColorPicker
                      color={colorPickerTarget}
                      onChange={(color) => {
                        updateStyling({ fillColor: color });
                        setColorPickerTarget(color);
                      }}
                      onClose={() => setShowColorPicker(null)}
                    />
                  )}
                </div>
                <div className="relative">
                  <label className="text-xs text-slate-500 mb-1 block">Border Color</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {['transparent', '#475569', '#94a3b8', '#ffffff', '#22d3ee'].map(c => (
                      <button
                        key={c}
                        onClick={() => updateStyling({ borderColor: c })}
                        className={`w-6 h-6 rounded-full border border-slate-600 ${c === 'transparent' ? 'bg-slash' : ''}`}
                        style={{ backgroundColor: c }}
                        title={c === 'transparent' ? 'Transparent' : c}
                      />
                    ))}
                    <button
                      onClick={() => {
                        setShowColorPicker('border');
                        setColorPickerTarget(selectedShape?.styling?.borderColor || '#000000');
                      }}
                      className="w-6 h-6 rounded-full border border-slate-600 cursor-pointer"
                      style={{
                        background: `conic-gradient(#ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)`
                      }}
                      title="Custom Color Picker"
                    />
                  </div>
                  {showColorPicker === 'border' && (
                    <ColorPicker
                      color={colorPickerTarget}
                      onChange={(color) => {
                        updateStyling({ borderColor: color });
                        setColorPickerTarget(color);
                      }}
                      onClose={() => setShowColorPicker(null)}
                    />
                  )}
                </div>

                {/* Advanced properties for all shape types */}
                <div>
                  <label className="text-xs text-slate-500 mb-1 block flex justify-between">
                    <span>Border Width</span>
                    <span>{selectedShape.styling?.borderWidth || 0}px</span>
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
                    <span>{selectedShape.styling?.borderRadius || 0}px</span>
                  </label>
                  <input
                    type="range" min="0" max="50"
                    value={selectedShape.styling?.borderRadius || 0}
                    onChange={(e) => updateStyling({ borderRadius: parseInt(e.target.value) })}
                    className="w-full accent-nova-primary h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Border Style</label>
                  <div className="flex gap-2">
                    <button onClick={() => updateStyling({ borderStyle: 'solid' })} className="p-2 hover:bg-slate-700 rounded"><Square size={16}/></button>
                    <button onClick={() => updateStyling({ borderStyle: 'dashed' })} className="p-2 hover:bg-slate-700 rounded"><SquareDashed size={16}/></button>
                    <button onClick={() => updateStyling({ borderStyle: 'dotted' })} className="p-2 hover:bg-slate-700 rounded"><CircleDashed size={16}/></button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-8">
              <Palette size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a shape to edit its properties</p>
            </div>
          )
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          selectedShape ? (
            <div>
              <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Zap size={16}/> Actions</h3>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-1 mb-4">
              {duplicateShape && (
                <CustomTooltip content="Duplicate selected shape(s)" shortcut="Ctrl+D">
                  <button
                    onClick={duplicateShape}
                    className="flex-shrink-0 p-2 bg-slate-800/50 hover:bg-slate-700 rounded text-xs text-center transition-colors group"
                  >
                    <Copy size={14} className="mx-auto mb-1 text-slate-400 group-hover:text-white" />
                    <span className="text-[10px] text-slate-400 group-hover:text-white">Copy</span>
                  </button>
                </CustomTooltip>
              )}
              {selectedShape?.locked !== undefined && toggleLock && (
                <CustomTooltip content={selectedShape.locked ? "Unlock shape" : "Lock shape"} shortcut="Ctrl+L">
                  <button
                    onClick={toggleLock}
                    className={`flex-shrink-0 p-2 bg-slate-800/50 hover:bg-slate-700 rounded text-xs text-center transition-colors group ${selectedShape.locked ? 'bg-red-500/10' : ''}`}
                  >
                    {selectedShape.locked ? <Lock size={14} className="mx-auto mb-1 text-red-400 group-hover:text-red-300" /> : <Unlock size={14} className="mx-auto mb-1 text-slate-400 group-hover:text-white" />}
                    <span className="text-[10px] text-slate-400 group-hover:text-white">{selectedShape.locked ? 'Unlock' : 'Lock'}</span>
                  </button>
                </CustomTooltip>
              )}
              {bringToFront && (
                <CustomTooltip content="Bring to front" shortcut="Ctrl+F">
                  <button
                    onClick={bringToFront}
                    className="flex-shrink-0 p-2 bg-slate-800/50 hover:bg-slate-700 rounded text-xs text-center transition-colors group"
                  >
                    <Layers size={14} className="mx-auto mb-1 text-slate-400 group-hover:text-white" />
                    <span className="text-[10px] text-slate-400 group-hover:text-white">Front</span>
                  </button>
                </CustomTooltip>
              )}
              {sendToBack && (
                <CustomTooltip content="Send to back" shortcut="Ctrl+B">
                  <button
                    onClick={sendToBack}
                    className="flex-shrink-0 p-2 bg-slate-800/50 hover:bg-slate-700 rounded text-xs text-center transition-colors group"
                  >
                    <Layers size={14} className="mx-auto mb-1 text-slate-400 group-hover:text-white opacity-50" />
                    <span className="text-[10px] text-slate-400 group-hover:text-white">Back</span>
                  </button>
                </CustomTooltip>
              )}
              {selectedIds.size > 1 && onGroup && (
                <CustomTooltip content="Group selected shapes" shortcut="Ctrl+G">
                  <button
                    onClick={onGroup}
                    className="flex-shrink-0 p-2 bg-slate-800/50 hover:bg-slate-700 rounded text-xs text-center transition-colors group"
                  >
                    <Group size={14} className="mx-auto mb-1 text-slate-400 group-hover:text-white" />
                    <span className="text-[10px] text-slate-400 group-hover:text-white">Group</span>
                  </button>
                </CustomTooltip>
              )}
              {selectedShape?.groupId && selectedIds.size === 1 && onUngroup && (
                <CustomTooltip content="Ungroup shapes" shortcut="Ctrl+Shift+G">
                  <button
                    onClick={onUngroup}
                    className="flex-shrink-0 p-2 bg-slate-800/50 hover:bg-slate-700 rounded text-xs text-center transition-colors group"
                  >
                    <Ungroup size={14} className="mx-auto mb-1 text-slate-400 group-hover:text-white" />
                    <span className="text-[10px] text-slate-400 group-hover:text-white">Ungroup</span>
                  </button>
                </CustomTooltip>
              )}
              {(selectedShape?.subtasks?.length || selectedShape?.expandedNodeIds) && (
                <CustomTooltip content={selectedShape.expandedNodeIds ? "Collapse expanded nodes" : "Expand to subtasks on canvas"}>
                  <button
                    onClick={() => selectedShape.expandedNodeIds ? onCollapseSubtasks?.(selectedShape.id) : onExpandSubtasks?.(selectedShape.id)}
                    className="flex-shrink-0 p-2 bg-slate-800/50 hover:bg-slate-700 rounded text-xs text-center transition-colors group"
                  >
                    {selectedShape.expandedNodeIds ? <Shrink size={14} className="mx-auto mb-1 text-slate-400 group-hover:text-white" /> : <Network size={14} className="mx-auto mb-1 text-slate-400 group-hover:text-white" />}
                    <span className="text-[10px] text-slate-400 group-hover:text-white">{selectedShape.expandedNodeIds ? 'Collapse' : 'Expand'}</span>
                  </button>
                </CustomTooltip>
              )}
              {selectedShape?.type === ShapeType.TASK && !selectedShape?.expandedNodeIds && addSubtask && (
                <CustomTooltip content="Add a new subtask">
                  <button
                    onClick={() => addSubtask(selectedShape.id)}
                    className="flex-shrink-0 p-2 bg-slate-800/50 hover:bg-slate-700 rounded text-xs text-center transition-colors group"
                  >
                    <Plus size={14} className="mx-auto mb-1 text-slate-400 group-hover:text-white" />
                    <span className="text-[10px] text-slate-400 group-hover:text-white">Subtask</span>
                  </button>
                </CustomTooltip>
              )}
              {triggerFileUpload && (
                <CustomTooltip content="Attach image or audio to shape">
                  <button
                    onClick={triggerFileUpload}
                    className="flex-shrink-0 p-2 bg-slate-800/50 hover:bg-slate-700 rounded text-xs text-center transition-colors group"
                  >
                    <ImageIcon size={14} className="mx-auto mb-1 text-slate-400 group-hover:text-white" />
                    <span className="text-[10px] text-slate-400 group-hover:text-white">Attach</span>
                  </button>
                </CustomTooltip>
              )}
            </div>

            {/* AI Actions */}
            {setShowAiModal && handleAIBrainstorm && selectedIds.size > 0 && (
              <div>
                <h4 className="text-slate-400 text-xs font-semibold mb-2 flex items-center gap-1">
                  <Sparkles size={12} />
                  AI Actions
                </h4>
                <div className="grid grid-cols-2 gap-1">
                  <CustomTooltip content="Generate subtasks from this content">
                    <button
                      onClick={() => handleAIBrainstorm('subtasks')}
                      className="flex-shrink-0 p-2 bg-slate-800/50 hover:bg-nova-primary/20 hover:border-nova-primary/30 border border-transparent rounded text-xs text-center transition-colors group"
                    >
                      <FileText size={12} className="mx-auto mb-1 text-slate-400 group-hover:text-nova-primary" />
                      <span className="text-[9px] text-slate-400 group-hover:text-nova-primary">Break Down</span>
                    </button>
                  </CustomTooltip>
                  <CustomTooltip content="Generate related idea nodes">
                    <button
                      onClick={() => handleAIBrainstorm('nodes')}
                      className="flex-shrink-0 p-2 bg-slate-800/50 hover:bg-nova-primary/20 hover:border-nova-primary/30 border border-transparent rounded text-xs text-center transition-colors group"
                    >
                      <Lightbulb size={12} className="mx-auto mb-1 text-slate-400 group-hover:text-nova-primary" />
                      <span className="text-[9px] text-slate-400 group-hover:text-nova-primary">Brainstorm</span>
                    </button>
                  </CustomTooltip>
                  <CustomTooltip content="Draft a note with AI suggestions">
                    <button
                      onClick={() => handleAIBrainstorm('note')}
                      className="flex-shrink-0 p-2 bg-slate-800/50 hover:bg-nova-primary/20 hover:border-nova-primary/30 border border-transparent rounded text-xs text-center transition-colors group"
                    >
                      <FileText size={12} className="mx-auto mb-1 text-slate-400 group-hover:text-nova-primary" />
                      <span className="text-[9px] text-slate-400 group-hover:text-nova-primary">Draft Note</span>
                    </button>
                  </CustomTooltip>
                  <CustomTooltip content="Create a data sheet with AI">
                    <button
                      onClick={() => handleAIBrainstorm('sheet')}
                      className="flex-shrink-0 p-2 bg-slate-800/50 hover:bg-nova-primary/20 hover:border-nova-primary/30 border border-transparent rounded text-xs text-center transition-colors group"
                    >
                      <Table size={12} className="mx-auto mb-1 text-slate-400 group-hover:text-nova-primary" />
                      <span className="text-[9px] text-slate-400 group-hover:text-nova-primary">Create Sheet</span>
                    </button>
                  </CustomTooltip>
                </div>
              </div>
            )}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-8">
              <Zap size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a shape to see actions</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
