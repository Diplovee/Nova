import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Shape, ShapeType, Point, ToolType, Side, Connection, Subtask, Attachment, ConnectionStyle, ShapeStyling } from '../types';
import { XCircle } from 'lucide-react';
import { generateSubtasks, refineText, generateProjectNote, generateSheetData } from '../services/geminiService';
import { getNearestSide, autoSizeShape } from '../utils/boardUtils';
import { Mic } from 'lucide-react';
import { ConnectionLayer } from './board/ConnectionLayer';
import { ShapeLayer } from './board/ShapeLayer';
import { BoardUI } from './board/BoardUI';
import { RightPanel } from './RightPanel';

const GRID_SIZE = 24;

interface NovaBoardProps {
  shapes: Shape[];
  onUpdateShapes: (shapes: Shape[], saveHistory?: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenEditor: (shape: Shape) => void;
  isRightPanelCollapsed: boolean;
  toggleRightPanel: () => void;
  toggleSidebar: () => void;
}

export const NovaBoard: React.FC<NovaBoardProps> = ({
  shapes,
  onUpdateShapes,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenEditor,
  isRightPanelCollapsed,
  toggleRightPanel,
  toggleSidebar
}) => {
  // --- View State ---
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  
  // --- Interaction State ---
  const [activeTool, setActiveTool] = useState<ToolType>('SELECT');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedConnection, setSelectedConnection] = useState<{from: string, to: string, midPoint?: Point} | null>(null);
  const [hoveredShapeId, setHoveredShapeId] = useState<string | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ start: Point, end: Point } | null>(null);

  // --- Connector Settings ---
  const [defaultConnectionStyle, setDefaultConnectionStyle] = useState<ConnectionStyle>('solid');

  // --- Dragging & Resizing ---
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [initialShapeStates, setInitialShapeStates] = useState<Record<string, Shape>>({});
  
  // --- AI & Editing ---
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [showAiModal, setShowAiModal] = useState(false);

  // --- Image Modal ---
  const [imageModalAttachment, setImageModalAttachment] = useState<Attachment | null>(null);
  
  // --- Connector State ---
  const [connectionDraft, setConnectionDraft] = useState<{ sourceId: string, sourceSide?: Side } | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });

  // --- Media State ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordingPos, setRecordingPos] = useState<Point | null>(null); // For Voice Tool
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageToolInputRef = useRef<HTMLInputElement>(null);

  // --- Toolbar State ---
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helpers
  const generateId = () => Math.random().toString(36).substr(2, 9);
  
  const isCreationTool = (tool: ToolType) => {
      return tool !== 'SELECT' && tool !== 'HAND' && tool !== 'CONNECTOR';
  };

  // --- Coordinate Conversions ---
  const toCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / scale,
      y: (clientY - rect.top - pan.y) / scale
    };
  }, [pan, scale]);

  // --- Zoom & Pan Logic ---
  const handleZoomIn = () => setScale(s => Math.min(s * 1.2, 5));
  const handleZoomOut = () => setScale(s => Math.max(s / 1.2, 0.1));
  
  const handleFitToScreen = () => {
    if (shapes.length === 0) {
        setPan({ x: 0, y: 0 });
        setScale(1);
        return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    shapes.forEach(s => {
        minX = Math.min(minX, s.x);
        minY = Math.min(minY, s.y);
        maxX = Math.max(maxX, s.x + s.width);
        maxY = Math.max(maxY, s.y + s.height);
    });

    const padding = 100;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;
    
    if (!containerRef.current) return;
    const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();

    const scaleX = containerWidth / contentWidth;
    const scaleY = containerHeight / contentHeight;
    const newScale = Math.min(Math.min(scaleX, scaleY), 1);

    const contentCenterX = minX - padding + contentWidth / 2;
    const contentCenterY = minY - padding + contentHeight / 2;
    
    const newPanX = (containerWidth / 2) - (contentCenterX * newScale);
    const newPanY = (containerHeight / 2) - (contentCenterY * newScale);

    setScale(newScale);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleResetView = () => {
      setScale(1);
      setPan({ x: 0, y: 0 });
  };

  // --- Media Handlers ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || selectedIds.size !== 1) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
          const url = ev.target?.result as string;
          const shapeId = Array.from(selectedIds)[0];
          const shape = shapes.find(s => s.id === shapeId);
          if (shape) {
              const newAttachment: Attachment = {
                  id: generateId(),
                  type: 'image',
                  url,
                  mimeType: file.type,
                  name: file.name
              };
              let updatedShape: Shape = { ...shape, attachments: [...(shape.attachments || []), newAttachment] };
              updatedShape = autoSizeShape(updatedShape);
              onUpdateShapes(shapes.map(s => s.id === shapeId ? updatedShape : s));
          }
      };
      reader.readAsDataURL(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageToolUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
          const url = ev.target?.result as string;
          let x = 0, y = 0;
          if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                x = (-pan.x + rect.width / 2) / scale - 150;
                y = (-pan.y + rect.height / 2) / scale - 150;
          }

          const newShape: Shape = {
              id: generateId(),
              type: ShapeType.IMAGE,
              x,
              y,
              width: 300,
              height: 300,
              text: file.name,
              connections: [],
              attachments: [{
                  id: generateId(),
                  type: 'image',
                  url,
                  mimeType: file.type,
                  name: file.name
              }]
          };
          onUpdateShapes([...shapes, newShape]);
          setActiveTool('SELECT');
      };
      reader.readAsDataURL(file);
      if (imageToolInputRef.current) imageToolInputRef.current.value = '';
  };

  const playAudio = (url: string) => {
      const audio = new Audio(url);
      audio.play().catch(e => console.error("Audio play failed", e));
  };

  const startRecording = async (e?: React.MouseEvent, pos?: Point) => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        // Two modes: Recording attached to shape OR Recording new Voice Tool
        if (pos) {
            setRecordingPos(pos); // Mode: New Voice Tool
        }

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                const base64data = reader.result as string;

                if (pos) {
                    // Create new Voice Shape
                    const newShape: Shape = {
                        id: generateId(),
                        type: ShapeType.VOICE,
                        x: pos.x,
                        y: pos.y,
                        width: 200,
                        height: 100,
                        text: `Voice Note ${new Date().toLocaleTimeString()}`,
                        connections: [],
                        attachments: [{
                            id: generateId(),
                            type: 'audio',
                            url: base64data,
                            mimeType: 'audio/webm',
                            name: `Audio ${new Date().toLocaleTimeString()}`
                        }]
                    };
                    onUpdateShapes([...shapes, newShape]);
                    setRecordingPos(null);
                    setActiveTool('SELECT');
                } else if (selectedIds.size === 1) {
                    // Attach to existing
                    const shapeId = Array.from(selectedIds)[0];
                    const shape = shapes.find(s => s.id === shapeId);
                    if (shape) {
                        const newAttachment: Attachment = {
                            id: generateId(),
                            type: 'audio',
                            url: base64data,
                            mimeType: 'audio/webm',
                            name: `Voice Note`
                        };
                        let updatedShape: Shape = { ...shape, attachments: [...(shape.attachments || []), newAttachment] };
                        updatedShape = autoSizeShape(updatedShape);
                        onUpdateShapes(shapes.map(s => s.id === shapeId ? updatedShape : s));
                    }
                }
            };
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Mic access denied", err);
        alert("Microphone permission is needed to record voice notes.");
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  // --- Connection Actions ---
  const updateConnection = (targetId: string, updates: Partial<Connection>) => {
    if (!selectedConnection) return;
    const shape = shapes.find(s => s.id === selectedConnection.from);
    if (!shape) return;

    const newConnections = shape.connections.map(c => 
        c.targetId === selectedConnection.to ? { ...c, ...updates } : c
    );
    
    onUpdateShapes(shapes.map(s => s.id === selectedConnection.from ? { ...shape, connections: newConnections } : s));
  };

  const deleteConnection = () => {
      if (!selectedConnection) return;
      const shape = shapes.find(s => s.id === selectedConnection.from);
      if (!shape) return;
      
      const newConnections = shape.connections.filter(c => c.targetId !== selectedConnection.to);
      onUpdateShapes(shapes.map(s => s.id === selectedConnection.from ? { ...shape, connections: newConnections } : s));
      setSelectedConnection(null);
  };

  // --- Shape Manipulations ---
  const duplicateShape = () => {
      if (selectedIds.size === 0) return;
      const newShapes = [...shapes];
      const newSelected = new Set<string>();

      selectedIds.forEach(id => {
          const original = shapes.find(s => s.id === id);
          if (original) {
              const newId = generateId();
              const copy = {
                  ...original,
                  id: newId,
                  x: original.x + 20,
                  y: original.y + 20,
                  connections: [] // Don't copy connections for now
              };
              newShapes.push(copy);
              newSelected.add(newId);
          }
      });
      onUpdateShapes(newShapes);
      setSelectedIds(newSelected);
  };

  const toggleLock = () => {
      const newShapes = shapes.map(s => selectedIds.has(s.id) ? { ...s, locked: !s.locked } : s);
      onUpdateShapes(newShapes);
  };

  const bringToFront = () => {
      const selected = shapes.filter(s => selectedIds.has(s.id));
      const unselected = shapes.filter(s => !selectedIds.has(s.id));
      onUpdateShapes([...unselected, ...selected]);
  };

  const sendToBack = () => {
      const selected = shapes.filter(s => selectedIds.has(s.id));
      const unselected = shapes.filter(s => !selectedIds.has(s.id));
      onUpdateShapes([...selected, ...unselected]);
  };

  const deleteSelected = () => {
      onUpdateShapes(shapes.filter(s => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
  };

  const updateStyling = (styling: Partial<ShapeStyling>) => {
      const newShapes = shapes.map(s => {
          if (selectedIds.has(s.id)) {
             return { ...s, styling: { ...s.styling, ...styling } };
          }
          return s;
      });
      onUpdateShapes(newShapes);
  };

  const updateOpacity = (opacity: number) => {
    const newShapes = shapes.map(s => selectedIds.has(s.id) ? { ...s, opacity } : s);
    onUpdateShapes(newShapes);
  };

  const handleGroup = () => {
      if (selectedIds.size < 2) return;
      const groupId = generateId();
      const newShapes = shapes.map(s => selectedIds.has(s.id) ? { ...s, groupId } : s);
      onUpdateShapes(newShapes);
  };

  const handleUngroup = () => {
      const newShapes = shapes.map(s => selectedIds.has(s.id) ? { ...s, groupId: undefined } : s);
      onUpdateShapes(newShapes);
  };

  const handleExpandSubtasks = (shapeId: string) => {
    const parent = shapes.find(s => s.id === shapeId);
    if (!parent || !parent.subtasks || parent.subtasks.length === 0) return;
    if (parent.expandedNodeIds && parent.expandedNodeIds.length > 0) return;

    const newShapes: Shape[] = [];
    const newConnections: Connection[] = [];
    const createdIds: string[] = [];
    
    const startX = parent.x + parent.width + 100;
    const startY = parent.y;

    parent.subtasks.forEach((st, index) => {
        const id = generateId();
        createdIds.push(id);
        
        const newShape: Shape = {
            id,
            type: ShapeType.TASK, 
            x: startX,
            y: startY + (index * 140),
            width: 200,
            height: 100,
            text: st.title,
            status: st.completed ? 'DONE' : 'TODO',
            connections: []
        };
        newShapes.push(newShape);
        
        newConnections.push({
            targetId: id,
            sourceSide: 'right',
            targetSide: 'left',
            style: defaultConnectionStyle
        });
    });

    const updatedParent = {
        ...parent,
        connections: [...parent.connections, ...newConnections],
        expandedNodeIds: createdIds,
        hideSubtasks: true 
    };

    onUpdateShapes([...shapes.filter(s => s.id !== shapeId), updatedParent, ...newShapes]);
  };

  const handleCollapseSubtasks = (shapeId: string) => {
      const parent = shapes.find(s => s.id === shapeId);
      if (!parent || !parent.expandedNodeIds) return;

      const nodesToRemove = new Set(parent.expandedNodeIds);
      const remainingShapes = shapes.filter(s => !nodesToRemove.has(s.id));

      const updatedConnections = parent.connections.filter(c => !nodesToRemove.has(c.targetId));

      const updatedParent = {
          ...parent,
          connections: updatedConnections,
          expandedNodeIds: undefined,
          hideSubtasks: false
      };

      onUpdateShapes(remainingShapes.map(s => s.id === shapeId ? updatedParent : s));
  };

  const addSubtask = (shapeId: string) => {
      const shape = shapes.find(s => s.id === shapeId);
      if(!shape) return;
      const newSubtask = {
          id: generateId(),
          title: "New Subtask",
          completed: false
      };
      let updatedShape: Shape = {
          ...shape,
          subtasks: [...(shape.subtasks || []), newSubtask],
          hideSubtasks: false
      };
      updatedShape = autoSizeShape(updatedShape);
      onUpdateShapes(shapes.map(s => s.id === shapeId ? updatedShape : s));
  };

  // --- Add/Manipulate Shape Logic ---
  const addShape = (type: ShapeType, clientX?: number, clientY?: number) => {
    const isText = type === ShapeType.TEXT;
    const isCircle = type === ShapeType.CIRCLE;
    const isNote = type === ShapeType.NOTE;
    const isRect = type === ShapeType.RECTANGLE;
    
    let x = 0, y = 0;
    if (clientX && clientY) {
        const coords = toCanvasCoordinates(clientX, clientY);
        x = coords.x - (isText ? 100 : 90);
        y = coords.y - (isText ? 30 : 50);
    } else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        x = (-pan.x + rect.width / 2) / scale - (isText ? 100 : 90);
        y = (-pan.y + rect.height / 2) / scale - (isText ? 30 : 50);
    }

    const id = generateId();
    const newShape: Shape = {
      id,
      type,
      x,
      y,
      width: isText ? 200 : isCircle ? 140 : isNote || type === ShapeType.SHEET ? 200 : isRect ? 300 : 200, 
      height: isText ? 60 : isCircle ? 140 : isNote || type === ShapeType.SHEET ? 240 : isRect ? 300 : 120,
      text: '', 
      connections: [],
      status: 'TODO',
      subtasks: [],
      hideSubtasks: false,
      attachments: [],
      styling: isRect ? {
          fillColor: '#272732',
          borderColor: '#475569',
          borderWidth: 2,
          borderRadius: 16,
          borderStyle: 'solid'
      } : undefined
    };

    if (isRect) {
        onUpdateShapes([newShape, ...shapes]);
    } else {
        onUpdateShapes([...shapes, newShape]);
    }
    
    setActiveTool('SELECT');
    setSelectedIds(new Set([id]));
    return id;
  };

  const setShapesDirectly = (newShapes: Shape[]) => {
      onUpdateShapes(newShapes, false);
  };

  // --- Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('.ui-panel')) {
      return;
    }

    if (e.button === 1 || activeTool === 'HAND') {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (activeTool === ShapeType.VOICE) {
        const coords = toCanvasCoordinates(e.clientX, e.clientY);
        startRecording(e, coords);
        return;
    }

    if (isCreationTool(activeTool)) {
       if (e.button !== 0) return;
       const newId = addShape(activeTool as ShapeType, e.clientX, e.clientY);
       if (newId) {
           if (activeTool === ShapeType.NOTE || activeTool === ShapeType.SHEET) {
               // Open dedicated editor via onOpenEditor callback but we don't have direct access here easily without finding the shape
               const shape = shapes.find(s => s.id === newId);
               if(shape) onOpenEditor(shape);
           } else if (activeTool !== ShapeType.RECTANGLE) {
               setIsEditing(true);
               setEditingId(newId);
           }
       }
       return;
    }

    const isBackground = 
        target === containerRef.current || 
        target === canvasRef.current || 
        target.tagName === 'svg';

    if (isBackground) {
        if (!e.shiftKey) {
            if (!contextMenuTriggerId) {
                setSelectedIds(new Set());
            }
            setSelectedConnection(null);
            setConnectionDraft(null);
            setIsEditing(false);
            setEditingId(null);
            setShowAiModal(false);
            // Close context menus when clicking on background
            closeContextMenuAndResetTrigger();
        }

        if (activeTool === 'SELECT') {
            const coords = toCanvasCoordinates(e.clientX, e.clientY);
            setSelectionBox({ start: coords, end: coords });
        } else {
            setIsDragging(true);
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    }
  };

  // State for closing context menus
  const [closeContextMenu, setCloseContextMenu] = useState<() => void>(() => {});
  const [contextMenuTriggerId, setContextMenuTriggerId] = useState<string | null>(null);

  const closeContextMenuAndResetTrigger = () => {
    closeContextMenu();
    setContextMenuTriggerId(null);
  };

  const handleShapeMouseDown = (e: React.MouseEvent, shape: Shape) => {
    // Close context menu if open
    if (contextMenuTriggerId) {
      closeContextMenuAndResetTrigger();
    }

    // Close any open context menus when clicking on background or performing definitive actions
    setSelectedConnection(null);

    e.stopPropagation();

    if (activeTool === 'HAND') return;
    if (isCreationTool(activeTool)) return;
    if (activeTool === ShapeType.VOICE) return;

    if (shape.locked && activeTool !== 'SELECT') return;

    e.stopPropagation();
    if (e.button !== 0) return;

    if (activeTool === 'CONNECTOR') {
      if (connectionDraft === null) {
        setConnectionDraft({ sourceId: shape.id });
      } else if (connectionDraft.sourceId !== shape.id) {
        const sourceShape = shapes.find(s => s.id === connectionDraft.sourceId);
        if (sourceShape && !sourceShape.connections.some(c => c.targetId === shape.id)) {
          const updatedSource: Shape = {
              ...sourceShape,
              connections: [...sourceShape.connections, {
                  targetId: shape.id,
                  sourceSide: connectionDraft.sourceSide,
                  targetSide: 'left',
                  style: defaultConnectionStyle
              }]
          };
          onUpdateShapes(shapes.map(s => s.id === connectionDraft.sourceId ? updatedSource : s));
        }
        setConnectionDraft(null);
        setActiveTool('SELECT');
      }
      return;
    }

    // --- Group Selection Logic ---
    const targetGroupId = shape.groupId;
    let shapesToSelect = [shape.id];

    if (targetGroupId) {
        shapesToSelect = shapes.filter(s => s.groupId === targetGroupId).map(s => s.id);
    }

    let newSelected = new Set(selectedIds);

    if (e.shiftKey) {
        // If clicking a group member with shift, toggle the whole group
        const allAlreadySelected = shapesToSelect.every(id => newSelected.has(id));
        if (allAlreadySelected) {
             shapesToSelect.forEach(id => newSelected.delete(id));
        } else {
             shapesToSelect.forEach(id => newSelected.add(id));
        }
    } else {
        // If not already selected, clear others and select this (or its group)
        // If it IS selected, we keep current selection (to allow dragging of multi-selection)
        // unless it's the only thing selected, effectively no-op
        if (!newSelected.has(shape.id)) {
            newSelected = new Set(shapesToSelect);
        } else {
            // Ensure whole group is selected if it wasn't already (edge case)
            shapesToSelect.forEach(id => newSelected.add(id));
        }
    }

    setSelectedIds(newSelected);
    setSelectedConnection(null);
    if (!shape.locked) setIsDragging(true);
    if (editingId !== shape.id) {
        setIsEditing(false);
        setEditingId(null);
    }
    setShowAiModal(false);

    const initStates: Record<string, Shape> = {};
    shapes.forEach(s => {
        if (newSelected.has(s.id)) initStates[s.id] = { ...s };
    });
    setInitialShapeStates(initStates);

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleConnectionStart = (e: React.MouseEvent, shapeId: string, side: Side) => {
      e.stopPropagation();
      e.preventDefault();
      setConnectionDraft({ sourceId: shapeId, sourceSide: side });
      setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, handle: string, shape: Shape) => {
    e.stopPropagation();
    e.preventDefault();
    if (shape.locked) return;
    setIsResizing(true);
    setResizeHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialShapeStates({ [shape.id]: { ...shape } });
    setSelectedIds(new Set([shape.id])); 
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (connectionDraft && containerRef.current) {
        const coords = toCanvasCoordinates(e.clientX, e.clientY);
        setMousePos(coords);
    }

    if (selectionBox) {
        const coords = toCanvasCoordinates(e.clientX, e.clientY);
        setSelectionBox(prev => prev ? { ...prev, end: coords } : null);
        return;
    }

    if ((activeTool === 'HAND' && isDragging) || (!selectedIds.size && isDragging && !isResizing && !selectionBox)) {
        if (dragStart) {
             setPan(prev => ({
                x: prev.x + e.movementX,
                y: prev.y + e.movementY
              }));
             setDragStart({ x: e.clientX, y: e.clientY });
        }
        return;
    }

    if (isResizing && selectedIds.size === 1 && dragStart) {
        const id = Array.from(selectedIds)[0];
        const initialState = initialShapeStates[id];
        if (!initialState) return;

        const dx = (e.clientX - dragStart.x) / scale;
        const dy = (e.clientY - dragStart.y) / scale;
        
        const newShape = { ...initialState };
        const minSize = 40;

        if (resizeHandle?.includes('e')) {
            newShape.width = Math.max(minSize, initialState.width + dx);
        }
        if (resizeHandle?.includes('w')) {
            const w = Math.max(minSize, initialState.width - dx);
            newShape.width = w;
            newShape.x = initialState.x + (initialState.width - w);
        }
        if (resizeHandle?.includes('s')) {
            newShape.height = Math.max(minSize, initialState.height + dy);
        }
        if (resizeHandle?.includes('n')) {
            const h = Math.max(minSize, initialState.height - dy);
            newShape.height = h;
            newShape.y = initialState.y + (initialState.height - h);
        }

        onUpdateShapes(
            shapes.map(s => s.id === id ? newShape : s), 
            false
        );
        return;
    }

    if (isDragging && selectedIds.size > 0 && dragStart && activeTool === 'SELECT') {
      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;

      const newShapes = shapes.map(s => {
          if (selectedIds.has(s.id) && !s.locked) {
              const init = initialShapeStates[s.id];
              if (init) {
                  return {
                      ...s,
                      x: Math.round((init.x + dx) / GRID_SIZE) * GRID_SIZE,
                      y: Math.round((init.y + dy) / GRID_SIZE) * GRID_SIZE
                  };
              }
          }
          return s;
      });

      onUpdateShapes(newShapes, false);
    }
  }, [isDragging, isResizing, resizeHandle, activeTool, selectedIds, scale, dragStart, initialShapeStates, connectionDraft, shapes, onUpdateShapes, toCanvasCoordinates, selectionBox]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (selectionBox) {
        const x1 = Math.min(selectionBox.start.x, selectionBox.end.x);
        const x2 = Math.max(selectionBox.start.x, selectionBox.end.x);
        const y1 = Math.min(selectionBox.start.y, selectionBox.end.y);
        const y2 = Math.max(selectionBox.start.y, selectionBox.end.y);

        const newSelected = new Set<string>();
        
        // Find shapes in box
        const shapesInBox: string[] = [];
        shapes.forEach(s => {
            if (s.x < x2 && s.x + s.width > x1 && s.y < y2 && s.y + s.height > y1) {
                shapesInBox.push(s.id);
            }
        });

        // Resolve groups - if any member is in box, select whole group
        const expandedSelection = new Set<string>();
        shapesInBox.forEach(id => {
            const shape = shapes.find(s => s.id === id);
            if (shape) {
                if (shape.groupId) {
                    shapes.filter(s => s.groupId === shape.groupId).forEach(g => expandedSelection.add(g.id));
                } else {
                    expandedSelection.add(shape.id);
                }
            }
        });

        if (e.shiftKey) {
             const merged = new Set(selectedIds);
             expandedSelection.forEach(id => merged.add(id));
             setSelectedIds(merged);
        } else {
             setSelectedIds(expandedSelection);
        }
        setSelectionBox(null);
    }

    if (connectionDraft) {
        const coords = toCanvasCoordinates(e.clientX, e.clientY);
        const target = shapes.find(s => 
            coords.x >= s.x && coords.x <= s.x + s.width &&
            coords.y >= s.y && coords.y <= s.y + s.height &&
            s.id !== connectionDraft.sourceId
        );
        
        if (target) {
            const sourceShape = shapes.find(s => s.id === connectionDraft.sourceId);
            if (sourceShape && !sourceShape.connections.some(c => c.targetId === target.id)) {
                const targetSide = getNearestSide(target, coords);
                const newConnection: Connection = {
                    targetId: target.id, 
                    sourceSide: connectionDraft.sourceSide, 
                    targetSide: targetSide,
                    style: defaultConnectionStyle
                };
                const updatedSource: Shape = { 
                    ...sourceShape, 
                    connections: [...sourceShape.connections, newConnection] 
                };
                onUpdateShapes(shapes.map(s => s.id === connectionDraft.sourceId ? updatedSource : s));
            }
        }
        setConnectionDraft(null);
        if (activeTool === 'CONNECTOR') setActiveTool('SELECT');
    }

    if (isDragging || isResizing) {
       onUpdateShapes(shapes); 
    }
    
    setIsDragging(false);
    setIsResizing(false);
    setDragStart(null);
    setInitialShapeStates({});
    setResizeHandle(null);
  }, [isDragging, isResizing, connectionDraft, shapes, activeTool, onUpdateShapes, toCanvasCoordinates, selectionBox, selectedIds, defaultConnectionStyle]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // --- Clipboard state ---
  const [clipboard, setClipboard] = useState<Shape[]>([]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Ignore shortcuts when dragging or resizing
        if (isDragging || isResizing) return;

        if (['Delete', 'Backspace'].includes(e.key) && !isEditing) {
            if ((e.target as HTMLElement).tagName === 'INPUT') return;

            if (selectedConnection) {
                deleteConnection();
            } else if (selectedIds.size > 0) {
                deleteSelected();
            }
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            // Select all shapes (but not connections)
            setSelectedIds(new Set(shapes.map(s => s.id)));
            setSelectedConnection(null);
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                onRedo();
            } else {
                onUndo();
            }
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            e.preventDefault();
            onRedo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            duplicateShape();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !isEditing) {
            e.preventDefault();
            // Copy selected shapes
            const selectedShapes = shapes.filter(s => selectedIds.has(s.id));
            setClipboard(selectedShapes.map(s => ({
                ...s,
                id: generateId(), // Give new IDs to copies
                x: s.x + 20, // Offset copies slightly
                y: s.y + 20,
                connections: [] // Don't copy connections
            })));
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !isEditing) {
            e.preventDefault();
            if (clipboard.length > 0) {
                // Paste copied shapes
                const pastedShapes = clipboard.map(s => ({
                    ...s,
                    id: generateId(),
                    x: s.x + Math.random() * 50 - 25, // Random offset
                    y: s.y + Math.random() * 50 - 25,
                    connections: []
                }));
                onUpdateShapes([...shapes, ...pastedShapes]);
                setSelectedIds(new Set(pastedShapes.map(s => s.id)));
            }
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
            e.preventDefault();
            if (e.shiftKey) {
                handleUngroup();
            } else {
                handleGroup();
            }
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            if (selectedIds.size > 0) {
                toggleLock();
            }
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            bringToFront();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            sendToBack();
        }
        if (e.code === 'Space' && !isEditing) {
            e.preventDefault();
            if (activeTool !== 'HAND') setActiveTool('HAND');
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space' && !isEditing) {
            e.preventDefault();
            setActiveTool('SELECT');
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedIds, selectedConnection, shapes, isEditing, onUpdateShapes, onUndo, onRedo, activeTool, isDragging, isResizing, onRedo, onUndo, duplicateShape, handleUngroup, handleGroup, deleteConnection, deleteSelected, setSelectedIds, setSelectedConnection, clipboard, toggleLock, bringToFront, sendToBack]);

  // --- AI Logic ---
  const handleAIBrainstorm = async (mode: 'subtasks' | 'nodes' | 'refine' | 'custom' | 'note' | 'sheet', customPrompt?: string) => {
    if (selectedIds.size === 0) return;
    
    const processingIds = new Set(loadingIds);
    selectedIds.forEach(id => processingIds.add(id));
    setLoadingIds(processingIds);
    setShowAiModal(false);

    try {
         for (const id of Array.from(selectedIds)) {
            const shape = shapes.find(s => s.id === id);
            if (!shape) continue;

            const context = customPrompt || shape.text || 'Project Task';
            
            if (mode === 'subtasks' && (shape.type === ShapeType.TASK || shape.type === ShapeType.IDEA || shape.type === ShapeType.VOICE)) {
                const suggestions = await generateSubtasks(context, shape.attachments || []);
                const newSubtasks = suggestions.map(s => ({
                    id: generateId(),
                    title: s,
                    completed: false
                }));
                let updatedShape: Shape = {
                    ...shape,
                    subtasks: [...(shape.subtasks || []), ...newSubtasks],
                    hideSubtasks: false 
                };
                if (shape.type !== ShapeType.VOICE) {
                    updatedShape = autoSizeShape(updatedShape);
                }
                onUpdateShapes(shapes.map(s => s.id === id ? updatedShape : s));
            } else if (mode === 'refine') {
                const newText = await refineText(shape.text, customPrompt || "Improve clarity");
                onUpdateShapes(shapes.map(s => s.id === id ? { ...s, text: newText } : s));
            } else if (mode === 'note') {
                const noteContent = await generateProjectNote(context);
                const newNote: Shape = {
                    id: generateId(),
                    type: ShapeType.NOTE,
                    x: shape.x + shape.width + 50,
                    y: shape.y,
                    width: 200,
                    height: 240,
                    text: noteContent,
                    connections: [],
                    status: 'TODO',
                    subtasks: []
                };
                const updatedParent = {
                    ...shape,
                    connections: [...shape.connections, { targetId: newNote.id, style: defaultConnectionStyle }]
                };
                onUpdateShapes([...shapes.filter(s => s.id !== id), updatedParent, newNote]);
            } else if (mode === 'sheet') {
                const sheetData = await generateSheetData(`Create a sheet for: ${context}`);
                const newSheet: Shape = {
                    id: generateId(),
                    type: ShapeType.SHEET,
                    x: shape.x + shape.width + 50,
                    y: shape.y,
                    width: 200,
                    height: 240,
                    text: `Sheet: ${context}`,
                    content: { cells: sheetData },
                    connections: [],
                    status: 'TODO',
                    subtasks: []
                };
                 const updatedParent = {
                    ...shape,
                    connections: [...shape.connections, { targetId: newSheet.id, style: defaultConnectionStyle }]
                };
                onUpdateShapes([...shapes.filter(s => s.id !== id), updatedParent, newSheet]);
            } else {
                const suggestions = await generateSubtasks(context, shape.attachments || []);
                const newShapes: Shape[] = [];
                const startY = shape.y + shape.height + 100;
                suggestions.forEach((text, idx) => {
                    newShapes.push({
                        id: generateId(),
                        type: ShapeType.IDEA,
                        x: shape.x + (idx * 220),
                        y: startY,
                        width: 180,
                        height: 120,
                        text,
                        connections: []
                    });
                });
                 const updatedParent = { 
                    ...shape, 
                    connections: [...shape.connections, ...newShapes.map(n => ({ targetId: n.id, style: defaultConnectionStyle }))] 
                };
                onUpdateShapes([...shapes.filter(s => s.id !== id), updatedParent, ...newShapes]);
            }
         }
    } catch (e) {
        console.error("AI Error", e);
    } finally {
        setLoadingIds(new Set());
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative bg-[#181820] overflow-hidden" ref={containerRef}>
      
      <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileUpload}
      />
      <input 
          type="file" 
          accept="image/*" 
          ref={imageToolInputRef} 
          className="hidden" 
          onChange={handleImageToolUpload}
      />

      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, #475569 1px, transparent 1px)`,
          backgroundSize: `${GRID_SIZE * scale}px ${GRID_SIZE * scale}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      />

      {/* Recording Indicator Overlay */}
      {isRecording && recordingPos && (
          <div className="absolute z-50 transform -translate-x-1/2 -translate-y-full bg-red-500 text-white px-4 py-2 rounded-full shadow-glow animate-pulse flex items-center gap-2"
               style={{ 
                   left: recordingPos.x * scale + pan.x, 
                   top: recordingPos.y * scale + pan.y 
               }}>
              <Mic size={16}/> Recording...
              <button onClick={stopRecording} className="ml-2 bg-white text-red-500 rounded-full w-5 h-5 flex items-center justify-center font-bold text-xs hover:scale-110 transition-transform">
                  ■
              </button>
          </div>
      )}

      <div 
        ref={canvasRef}
        className={`absolute inset-0 z-0 origin-top-left ${activeTool === 'HAND' ? 'cursor-grab active:cursor-grabbing' : activeTool === ShapeType.VOICE ? 'cursor-crosshair' : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
        }}
      >
        <ConnectionLayer 
          shapes={shapes}
          selectedConnection={selectedConnection}
          connectionDraft={connectionDraft}
          mousePos={mousePos}
          onSelectConnection={(conn) => {
              setSelectedConnection(conn);
              setSelectedIds(new Set());
          }}
          onClearSelection={() => setSelectedConnection(null)}
        />

        <ShapeLayer
            shapes={shapes}
            selectedIds={selectedIds}
            editingId={editingId}
            isEditing={isEditing}
            loadingIds={loadingIds}
            hoveredShapeId={hoveredShapeId}
            activeTool={activeTool}
            isRecording={isRecording}
            recordingPos={recordingPos}
            onShapeMouseDown={handleShapeMouseDown}
            onShapeDoubleClick={(e, shape) => {
                e.stopPropagation();
                if (shape.locked) return;
                if (shape.type === ShapeType.NOTE || shape.type === ShapeType.SHEET) {
                    onOpenEditor(shape);
                } else {
                    setIsEditing(true);
                    setEditingId(shape.id);
                }
            }}
            onMouseEnter={setHoveredShapeId}
            onMouseLeave={() => setHoveredShapeId(null)}
            onResizeMouseDown={handleResizeMouseDown}
            onConnectionStart={handleConnectionStart}
            onUpdateShapes={onUpdateShapes}
            setShapesDirectly={setShapesDirectly}
            setIsEditing={setIsEditing}
            setEditingId={setEditingId}
            onOpenEditor={onOpenEditor}
            setShowAiModal={setShowAiModal}
            triggerFileUpload={() => fileInputRef.current?.click()}
            triggerRecording={() => startRecording()}
            stopRecording={stopRecording}
            duplicateShape={duplicateShape}
            bringToFront={bringToFront}
            sendToBack={sendToBack}
            toggleLock={toggleLock}
            updateOpacity={updateOpacity}
            updateStyling={updateStyling}
            playAudio={playAudio}
            autoSizeShape={autoSizeShape}
            generateId={generateId}
            onGroup={handleGroup}
            onUngroup={handleUngroup}
            onExpandSubtasks={handleExpandSubtasks}
            onCollapseSubtasks={handleCollapseSubtasks}
            addSubtask={addSubtask}
            setSelectedIds={setSelectedIds}
            onOpenImageModal={setImageModalAttachment}
            onCloseContextMenu={setCloseContextMenu}
            onSetContextMenuTriggerId={setContextMenuTriggerId}
            contextMenuTriggerId={contextMenuTriggerId}
        />

        {selectionBox && (
            <div 
                className="absolute bg-nova-primary/10 border border-nova-primary/50 z-50 pointer-events-none"
                style={{
                    left: Math.min(selectionBox.start.x, selectionBox.end.x),
                    top: Math.min(selectionBox.start.y, selectionBox.end.y),
                    width: Math.abs(selectionBox.end.x - selectionBox.start.x),
                    height: Math.abs(selectionBox.end.y - selectionBox.start.y),
                }}
            />
        )}
      </div>

      <BoardUI
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        scale={scale}
        handleFitToScreen={handleFitToScreen}
        handleResetView={handleResetView}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        isToolbarCollapsed={isToolbarCollapsed}
        setIsToolbarCollapsed={setIsToolbarCollapsed}
        defaultConnectionStyle={defaultConnectionStyle}
        setDefaultConnectionStyle={setDefaultConnectionStyle}
        triggerImageToolUpload={() => imageToolInputRef.current?.click()}
        toggleSidebar={toggleSidebar}
        toggleRightPanel={toggleRightPanel}
        selectedConnection={selectedConnection}
        selectedIds={selectedIds}
        shapes={shapes}
        updateConnection={updateConnection}
        deleteConnection={deleteConnection}
        updateStyling={updateStyling}
        showAiModal={showAiModal}
        setShowAiModal={setShowAiModal}
        loadingIds={loadingIds}
        handleAIBrainstorm={handleAIBrainstorm}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {!isRightPanelCollapsed && (
        <RightPanel
          scale={scale}
          handleFitToScreen={handleFitToScreen}
          handleResetView={handleResetView}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          selectedIds={selectedIds}
          shapes={shapes}
          updateStyling={updateStyling}
          setActiveTool={setActiveTool}
          activeTool={activeTool}
          duplicateShape={duplicateShape}
          bringToFront={bringToFront}
          sendToBack={sendToBack}
          toggleLock={toggleLock}
          onGroup={handleGroup}
          onUngroup={handleUngroup}
          onExpandSubtasks={handleExpandSubtasks}
          onCollapseSubtasks={handleCollapseSubtasks}
          setShowAiModal={setShowAiModal}
          triggerFileUpload={() => fileInputRef.current?.click()}
          addSubtask={addSubtask}
          handleAIBrainstorm={handleAIBrainstorm}
        />
      )}

      {/* Image Preview Modal */}
      {imageModalAttachment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setImageModalAttachment(null)}>
          <div className="relative max-w-4xl max-h-full bg-nova-card rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setImageModalAttachment(null)}
                className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6">
              <img
                src={imageModalAttachment.url}
                alt={imageModalAttachment.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-white">{imageModalAttachment.name}</h3>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
