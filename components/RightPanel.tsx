import React, { useState, useRef, useCallback } from 'react';
import { ToolButton } from './ui/ToolButton';
import { ShapeType, Shape, ShapeStyling } from '../types';
import { Maximize2, Minimize2, Scan, Crosshair, ZoomIn, ZoomOut, Palette, Square, SquareDashed, CircleDashed, FileText, Table, Database } from 'lucide-react';

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
    <div className="absolute top-full right-0 mt-2 bg-nova-card border border-slate-700 rounded-lg shadow-xl p-3 z-[200] w-64">
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
  const [showColorPicker, setShowColorPicker] = useState<'fill' | 'border' | null>(null);
  const [colorPickerTarget, setColorPickerTarget] = useState<string>('');
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
      </div>
    </div>
  );
};
