
import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { NovaBoard } from './components/NovaBoard';
import { TaskBoard } from './components/TaskBoard';
import { NoteEditor } from './components/NoteEditor';
import { SheetEditor } from './components/SheetEditor';
import { Dashboard } from './components/Dashboard';
import { TimelineView } from './components/TimelineView';
import { ResourcesView } from './components/ResourcesView';
import { SettingsView } from './components/SettingsView';
import { Onboarding } from './components/Onboarding';
import { SplashScreen } from './components/SplashScreen';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Page, Shape, ShapeType, Board } from './types';
import { FileText, Table, Pencil, ArrowLeft } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper for relative dates
const daysFromNow = (days: number) => Date.now() + (days * 86400000);

const DEFAULT_BOARD: Board = {
    id: 'demo-launch-v2',
    title: 'Nova 2.0 Launch',
    lastModified: Date.now(),
    shapes: [
      // --- CENTRAL STRATEGY ---
      { 
        id: 'root-idea', 
        type: ShapeType.IDEA, 
        x: 400, 
        y: 300, 
        width: 220, 
        height: 140, 
        text: 'Nova 2.0\nProduct Launch', 
        styling: { fillColor: '#22d3ee', borderColor: '#fff', borderWidth: 2 },
        connections: [
            { targetId: 'marketing-group-rect', style: 'dotted' },
            { targetId: 'dev-container', style: 'solid' },
            { targetId: 'finance-sheet', style: 'dashed' }
        ] 
      },

      // --- MARKETING CLUSTER (Grouped) ---
      {
          id: 'marketing-group-rect',
          type: ShapeType.RECTANGLE,
          x: 40,
          y: 40,
          width: 380,
          height: 400,
          text: 'Marketing Campaign',
          styling: { fillColor: '#272732', borderColor: '#eab308', borderStyle: 'dashed', borderWidth: 2, borderRadius: 24 },
          groupId: 'grp-marketing',
          connections: []
      },
      {
          id: 'note-strategy',
          type: ShapeType.NOTE,
          x: 70,
          y: 100,
          width: 200,
          height: 240,
          text: '# Q4 Marketing Strategy\n\n**Core Message:** "Infinite Possibilities."\n\n> Focus on the visual nature of the board.\n\n## Channels\n- [ ] Twitter / X Ad Campaign\n- [ ] ProductHunt Launch Day\n- [ ] Dev.to Technical Articles\n\n**Target Audience:**\n1. Product Managers\n2. Creative Developers\n3. Startups',
          groupId: 'grp-marketing',
          connections: []
      },
      {
          id: 'voice-brainstorm',
          type: ShapeType.VOICE,
          x: 290,
          y: 100,
          width: 100,
          height: 80,
          text: 'Ad Copy Ideas',
          groupId: 'grp-marketing',
          connections: [],
          attachments: [{ id: 'dummy-audio', type: 'audio', url: '', mimeType: 'audio/webm', name: 'Brainstorm.webm' }]
      },
      {
          id: 'task-socials',
          type: ShapeType.TASK,
          x: 70,
          y: 360,
          width: 320,
          height: 100,
          text: 'Prepare Social Assets',
          status: 'TODO',
          priority: 'MEDIUM',
          assignee: 'Sarah',
          startDate: daysFromNow(1),
          dueDate: daysFromNow(5),
          groupId: 'grp-marketing',
          connections: []
      },

      // --- DEVELOPMENT CLUSTER ---
      {
          id: 'dev-container',
          type: ShapeType.RECTANGLE,
          x: 750,
          y: 50,
          width: 450,
          height: 500,
          text: 'Engineering Sprint',
          styling: { fillColor: '#1e293b', borderColor: '#3b82f6', borderWidth: 2, borderRadius: 16 },
          connections: []
      },
      {
          id: 'task-backend',
          type: ShapeType.TASK,
          x: 780,
          y: 120,
          width: 240,
          height: 140,
          text: 'Core API Optimization',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          startDate: daysFromNow(-2),
          dueDate: daysFromNow(3),
          assignee: 'James',
          subtasks: [
              { id: 'st1', title: 'Refactor Database Schema', completed: true },
              { id: 'st2', title: 'Redis Caching Layer', completed: false },
              { id: 'st3', title: 'Load Testing', completed: false }
          ],
          connections: [{ targetId: 'task-frontend', style: 'solid' }]
      },
      {
          id: 'task-frontend',
          type: ShapeType.TASK,
          x: 880,
          y: 320,
          width: 240,
          height: 120,
          text: 'UI/UX Polish',
          status: 'TODO',
          priority: 'MEDIUM',
          startDate: daysFromNow(3),
          dueDate: daysFromNow(10),
          assignee: 'Mike',
          subtasks: [
              { id: 'st4', title: 'Dark Mode Fixes', completed: false },
              { id: 'st5', title: 'Mobile Responsiveness', completed: false }
          ],
          connections: []
      },
      // Expanded Nodes Example
      {
          id: 'node-optimization-1',
          type: ShapeType.IDEA,
          x: 1050,
          y: 120,
          width: 120,
          height: 80,
          text: 'GraphQL Migration?',
          styling: { fillColor: '#334155' },
          connections: [{ targetId: 'task-backend', style: 'dotted' }]
      },

      // --- FINANCE & DATA ---
      {
          id: 'finance-sheet',
          type: ShapeType.SHEET,
          x: 400,
          y: 600,
          width: 240,
          height: 200,
          text: 'Q4 Budget Plan',
          content: {
              cells: {
                  "A1": "Category", "B1": "Budget", "C1": "Actual",
                  "A2": "Servers", "B2": "$5,000", "C2": "$4,200",
                  "A3": "Marketing", "B3": "$12,000", "C3": "$8,500",
                  "A4": "Tools", "B4": "$2,000", "C4": "$2,000",
                  "A5": "Total", "B5": "$19,000", "C5": "$14,700"
              }
          },
          connections: []
      },
      {
          id: 'data-metrics',
          type: ShapeType.DATA,
          x: 700,
          y: 650,
          width: 180,
          height: 100,
          text: 'KPI Targets:\nDAU: 10k\nRetention: 45%',
          styling: { fillColor: '#0f172a', borderColor: '#22c55e' },
          connections: [{ targetId: 'finance-sheet', style: 'dashed' }]
      }
    ]
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingItem, setEditingItem] = useState<Shape | null>(null);

  // --- Session Management ---
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  
  // Board Content State (Active Session)
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [history, setHistory] = useState<Shape[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // --- Header Editing State ---
  const [isRenamingBoard, setIsRenamingBoard] = useState(false);
  const [tempBoardTitle, setTempBoardTitle] = useState('');

  // --- Onboarding & Splash State ---
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // --- Confirmation Modal State ---
  const [deleteBoardId, setDeleteBoardId] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // --- Load Saved Data ---
  useEffect(() => {
      // Simulate loading time for splash screen
      const splashTimer = setTimeout(() => {
          setShowSplash(false);
      }, 3000);

      const savedBoards = localStorage.getItem('nova_boards');
      if (savedBoards) {
          try {
              const parsed = JSON.parse(savedBoards);
              if (Array.isArray(parsed) && parsed.length > 0) {
                  setBoards(parsed);
              } else {
                  // Initialize with default if array is empty but exists
                  setBoards([DEFAULT_BOARD]);
              }
          } catch (e) {
              console.error("Failed to parse boards", e);
              setBoards([DEFAULT_BOARD]);
          }
      } else {
          // First time user
          setBoards([DEFAULT_BOARD]);
          localStorage.setItem('nova_boards', JSON.stringify([DEFAULT_BOARD]));
      }

      // Auto-open last session if available
      const lastBoardId = localStorage.getItem('nova_last_board_id');
      if (lastBoardId) {
          const allBoards = savedBoards ? JSON.parse(savedBoards) : [DEFAULT_BOARD];
          const lastBoard = allBoards.find((b: Board) => b.id === lastBoardId);
          if (lastBoard) {
              openBoard(lastBoard);
          }
      }

      // Check Onboarding Status
      const onboardingCompleted = localStorage.getItem('nova_onboarding_completed');
      if (!onboardingCompleted) {
          setShowOnboarding(true);
      }

      return () => clearTimeout(splashTimer);
  }, []);

  // --- Auto Save ---
  useEffect(() => {
      if (!currentBoard) return;

      const saveTimeout = setTimeout(() => {
          const updatedBoard = {
              ...currentBoard,
              shapes: shapes,
              lastModified: Date.now()
          };
          
          // Update local state list
          const updatedBoards = boards.map(b => b.id === currentBoard.id ? updatedBoard : b);
          setBoards(updatedBoards);
          
          // Persist to local storage
          localStorage.setItem('nova_boards', JSON.stringify(updatedBoards));
          
      }, 1000); // Debounce save every 1s

      return () => clearTimeout(saveTimeout);
  }, [shapes, currentBoard?.id]); // Only trigger when shapes change or board ID changes

  // --- Board Actions ---
  const createNewBoard = () => {
      const newBoard: Board = {
          id: generateId(),
          title: 'Untitled Project',
          shapes: [],
          lastModified: Date.now()
      };
      const newBoards = [...boards, newBoard];
      setBoards(newBoards);
      localStorage.setItem('nova_boards', JSON.stringify(newBoards));
      openBoard(newBoard);
  };

  const deleteBoard = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setDeleteBoardId(id);
      setShowDeleteConfirmation(true);
  };

  const confirmDeleteBoard = () => {
      if (deleteBoardId) {
          const newBoards = boards.filter(b => b.id !== deleteBoardId);
          setBoards(newBoards);
          localStorage.setItem('nova_boards', JSON.stringify(newBoards));

          if (currentBoard?.id === deleteBoardId) {
              setCurrentBoard(null);
              setShapes([]);
              setCurrentPage(Page.DASHBOARD);
              localStorage.removeItem('nova_last_board_id');
          }
      }
      setDeleteBoardId(null);
      setShowDeleteConfirmation(false);
  };

  const cancelDeleteBoard = () => {
      setDeleteBoardId(null);
      setShowDeleteConfirmation(false);
  };

  const getBoardTitle = (id: string) => {
      const board = boards.find(b => b.id === id);
      return board?.title || 'this project';
  };

  const renameBoard = (boardId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    const updatedBoards = boards.map(b => b.id === boardId ? { ...b, title: newTitle } : b);
    setBoards(updatedBoards);
    localStorage.setItem('nova_boards', JSON.stringify(updatedBoards));
    if (currentBoard?.id === boardId) {
        setCurrentBoard(prev => prev ? { ...prev, title: newTitle } : null);
    }
  };

  const openBoard = (board: Board) => {
      setCurrentBoard(board);
      setShapes(board.shapes || []);
      setHistory([board.shapes || []]);
      setHistoryIndex(0);
      setCurrentPage(Page.NOVA_BOARD);
      localStorage.setItem('nova_last_board_id', board.id);
  };

  const handlePageChange = (page: Page) => {
      if (page === Page.NOVA_BOARD && !currentBoard) {
          // If trying to go to board but none selected, go to dashboard
          setCurrentPage(Page.DASHBOARD);
      } else {
          setCurrentPage(page);
      }
  };

  const handleOnboardingComplete = () => {
      setShowOnboarding(false);
      localStorage.setItem('nova_onboarding_completed', 'true');
  };

  // --- History Handlers ---
  const handleUpdateShapes = useCallback((newShapes: Shape[], saveToHistory = true) => {
    setShapes(newShapes);
    
    if (saveToHistory) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newShapes);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [history, historyIndex, currentBoard]);

  const handleSingleShapeUpdate = (id: string, updates: Partial<Shape>) => {
      const newShapes = shapes.map(s => s.id === id ? { ...s, ...updates } : s);
      handleUpdateShapes(newShapes);
  };

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setShapes(history[prevIndex]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setShapes(history[nextIndex]);
    }
  }, [historyIndex, history]);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const toggleFullscreen = () => {
    // Toggle fullscreen mode completely
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    // Also hide/show right panel when toggling fullscreen
    if (newFullscreenState) {
      setIsRightPanelCollapsed(true);
    }
  };

  // --- Render ---
  if (showSplash) {
      return <SplashScreen />;
  }

  if (showOnboarding) {
      return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const renderContent = () => {
    switch (currentPage) {
      case Page.DASHBOARD:
        return (
            <Dashboard 
                boards={boards} 
                onCreate={createNewBoard} 
                onOpen={openBoard}
                onDelete={deleteBoard}
                onRename={renameBoard}
            />
        );
      case Page.NOVA_BOARD:
        return (
          <NovaBoard
            shapes={shapes}
            onUpdateShapes={handleUpdateShapes}
            onUndo={undo}
            onRedo={redo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onOpenEditor={setEditingItem}
            isRightPanelCollapsed={isRightPanelCollapsed}
            toggleFullscreen={toggleFullscreen}
          />
        );
      case Page.TASKS:
        return (
          <TaskBoard 
            shapes={shapes}
            onUpdateShapes={handleUpdateShapes}
          />
        );
      case Page.TIMELINE:
        return (
            <TimelineView 
                shapes={shapes}
                onUpdateShapes={handleUpdateShapes}
            />
        );
      case Page.RESOURCES:
        return <ResourcesView />;
      case Page.NOTES:
        const notes = shapes.filter(s => s.type === ShapeType.NOTE);
        return (
            <div className="p-8 h-full flex flex-col gap-8 overflow-y-auto">
                 <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3"><FileText/> Notes</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {notes.map(note => (
                         <div key={note.id} onClick={() => setEditingItem(note)} className="bg-nova-card p-6 rounded-2xl border border-slate-700 hover:border-nova-primary cursor-pointer transition-colors group relative h-48 flex flex-col">
                             <h3 className="font-bold text-lg mb-2 truncate text-white">{note.text.split('\n')[0] || 'Untitled'}</h3>
                             <p className="text-slate-400 text-sm line-clamp-4 flex-1 whitespace-pre-wrap font-mono text-xs opacity-70">{note.text}</p>
                             <div className="mt-4 text-[10px] text-slate-500 uppercase tracking-widest pt-2 border-t border-slate-700/50">Edit Note</div>
                         </div>
                     ))}
                     {notes.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-800 rounded-3xl text-slate-500">
                            <FileText size={48} className="mb-4 opacity-20"/>
                            <p>No notes found in this board.</p>
                            <p className="text-sm opacity-50">Create a Note shape on the Nova Board to see it here.</p>
                        </div>
                     )}
                 </div>
            </div>
        );
      case Page.SHEETS:
        const sheets = shapes.filter(s => s.type === ShapeType.SHEET);
        return (
            <div className="p-8 h-full flex flex-col gap-8 overflow-y-auto">
                 <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3"><Table/> Sheets</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {sheets.map(sheet => (
                         <div key={sheet.id} onClick={() => setEditingItem(sheet)} className="bg-nova-card p-6 rounded-2xl border border-slate-700 hover:border-nova-primary cursor-pointer transition-colors group relative h-48 flex flex-col">
                             <h3 className="font-bold text-lg mb-2 truncate text-white">{sheet.text || 'Untitled Sheet'}</h3>
                             <div className="flex-1 border border-slate-700/50 rounded bg-slate-800/50 p-2 overflow-hidden">
                                 <div className="grid grid-cols-3 gap-1 opacity-50">
                                     {Array.from({length: 9}).map((_, i) => <div key={i} className="h-2 bg-slate-600 rounded-sm"/>)}
                                 </div>
                             </div>
                             <div className="mt-4 text-[10px] text-slate-500 uppercase tracking-widest pt-2 border-t border-slate-700/50">Open Sheet</div>
                         </div>
                     ))}
                     {sheets.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-800 rounded-3xl text-slate-500">
                            <Table size={48} className="mb-4 opacity-20"/>
                            <p>No sheets found in this board.</p>
                            <p className="text-sm opacity-50">Create a Sheet shape on the Nova Board to see it here.</p>
                        </div>
                     )}
                 </div>
            </div>
        );
      case Page.SETTINGS:
          return <SettingsView />;
      default:
        return <div>Page Not Found</div>;
    }
  };

  return (
    <div className="flex w-full h-screen bg-[#1E1E28] text-white overflow-hidden font-sans">
      {!isFullscreen && (
        <Sidebar
          currentPage={currentPage}
          setPage={handlePageChange}
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />
      )}

      <main
        className={`flex-1 relative h-full overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'ml-0'
            : isSidebarCollapsed
              ? 'ml-20'
              : 'ml-64'
        }`}
      >
        {/* Active Board Indicator - Centered on non-board pages */}
        {currentBoard && currentPage !== Page.DASHBOARD && (
             <div className={`absolute top-4 z-50 transition-all duration-300 ${
                 currentPage === Page.NOVA_BOARD 
                    ? 'left-4' 
                    : 'left-1/2 -translate-x-1/2 shadow-float'
             }`}>
                {isRenamingBoard ? (
                    <div className="flex items-center gap-2 bg-nova-card p-1 rounded-xl border border-nova-primary">
                        <input 
                            autoFocus
                            value={tempBoardTitle}
                            onChange={(e) => setTempBoardTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') {
                                    renameBoard(currentBoard.id, tempBoardTitle);
                                    setIsRenamingBoard(false);
                                }
                            }}
                            className="bg-transparent text-white font-bold px-2 outline-none w-48"
                        />
                        <button onClick={() => { renameBoard(currentBoard.id, tempBoardTitle); setIsRenamingBoard(false); }} className="p-1 bg-nova-primary text-black rounded hover:bg-cyan-300">
                           <Pencil size={12}/>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/10 hover:border-nova-primary/50 transition-colors group">
                        <button onClick={() => setCurrentPage(Page.DASHBOARD)} className="hover:text-nova-primary"><ArrowLeft size={14}/></button>
                        <div className="w-px h-3 bg-white/20" />
                        <div className="w-2 h-2 rounded-full bg-nova-primary animate-pulse" />
                        <span 
                            className="text-sm font-medium cursor-pointer"
                            onClick={() => {
                                setTempBoardTitle(currentBoard.title);
                                setIsRenamingBoard(true);
                            }}
                        >
                            {currentBoard.title}
                        </span>
                    </div>
                )}
            </div>
        )}

        {renderContent()}

        {/* Global Editor Modals */}
        {editingItem?.type === ShapeType.NOTE && (
            <NoteEditor 
                shape={editingItem}
                onClose={() => setEditingItem(null)}
                onUpdate={handleSingleShapeUpdate}
            />
        )}
        {editingItem?.type === ShapeType.SHEET && (
            <SheetEditor
                shape={editingItem}
                onClose={() => setEditingItem(null)}
                onUpdate={handleSingleShapeUpdate}
            />
        )}

        <ConfirmationModal
          isOpen={showDeleteConfirmation}
          title="Delete Project"
          message={`Are you sure you want to delete "${getBoardTitle(deleteBoardId || '')}"? This will permanently remove all content and cannot be undone.`}
          confirmText="Delete Project"
          cancelText="Cancel"
          onConfirm={confirmDeleteBoard}
          onCancel={cancelDeleteBoard}
          variant="danger"
        />
      </main>
    </div>
  );
};

export default App;
