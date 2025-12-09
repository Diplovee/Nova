
import React, { useState, useRef, useEffect } from 'react';
import { Shape } from '../types';
import { 
  X, Sparkles, Save, FileText, 
  Bold, Italic, Underline, List, Heading1, Heading2, 
  Quote, Code, AlignLeft, AlignCenter, AlignRight,
  Type, Undo2, Redo2, MoreHorizontal, MousePointer2,
  Check, ChevronDown, ZoomIn, ZoomOut, CheckSquare,
  Image as ImageIcon, Mic, PlayCircle, Eye, EyeOff
} from 'lucide-react';
import { generateNoteContent } from '../services/geminiService';
import { SimpleMarkdown } from './ui/SimpleMarkdown';

interface NoteEditorProps {
  shape: Shape;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Shape>) => void;
}

// A4 Ratio approximation: 1 : 1.414
// Base width 800px -> Base Height ~1130px
const PAGE_HEIGHT = 1130;

export const NoteEditor: React.FC<NoteEditorProps> = ({ shape, onClose, onUpdate }) => {
  // Content State
  const [content, setContent] = useState(shape.text || '');
  const [title, setTitle] = useState(() => {
     const lines = (shape.text || '').split('\n');
     const firstLine = lines.find(l => l.trim().length > 0) || 'Untitled Note';
     return firstLine.replace(/^#+\s*/, '').substring(0, 30);
  });

  // History State
  const [history, setHistory] = useState<string[]>([shape.text || '']);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Editor State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [showHeadingsMenu, setShowHeadingsMenu] = useState(false);
  const [isSpellCheck, setIsSpellCheck] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [pageCount, setPageCount] = useState(1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Calculate pages based on height and create automatic page breaks
  useEffect(() => {
    if (textareaRef.current && !isPreview) {
        // Temporarily set height to auto to measure content
        textareaRef.current.style.height = 'auto';
        const scrollHeight = textareaRef.current.scrollHeight || PAGE_HEIGHT;

        // Calculate required pages (A4 height simulation like MS Word)
        const calculatedPages = Math.max(1, Math.ceil(scrollHeight / PAGE_HEIGHT));
        const totalHeight = calculatedPages * PAGE_HEIGHT;

        // Set final height to accommodate all pages
        textareaRef.current.style.height = `${totalHeight}px`;

        setPageCount(calculatedPages);
    }
  }, [content, zoom, isPreview]);

  // Focus on mount
  useEffect(() => {
    if (textareaRef.current && !isPreview) {
      textareaRef.current.focus();
    }
  }, [isPreview]);

  // --- History Management ---
  const pushHistory = (newContent: string) => {
      // Prevent duplicate history entries
      if (historyIndex >= 0 && newContent === history[historyIndex]) return;

      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newContent);
      // Limit history stack size
      if (newHistory.length > 50) newHistory.shift();
      
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value);
  };

  // Save history on pause (debounce) for typing
  useEffect(() => {
      const timeout = setTimeout(() => {
          if (content !== history[historyIndex]) {
              pushHistory(content);
          }
      }, 1000);
      return () => clearTimeout(timeout);
  }, [content, historyIndex]);

  const handleUndo = () => {
      if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setContent(history[newIndex]);
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setContent(history[newIndex]);
      }
  };

  // --- Actions ---
  const handleSave = () => {
    onUpdate(shape.id, { text: content });
    onClose();
  };

  const handleAiGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    
    const newContent = await generateNoteContent(prompt, content);
    const updatedContent = content + (content ? '\n\n' : '') + newContent;
    setContent(updatedContent);
    pushHistory(updatedContent);
    
    setIsGenerating(false);
    setPrompt('');
    
    // Scroll to bottom
    setTimeout(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, 100);
  };

  // --- Formatting Helpers ---
  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const existingText = textarea.value;
    const selectedText = existingText.substring(start, end);
    const newText = existingText.substring(0, start) + before + selectedText + after + existingText.substring(end);
    
    pushHistory(newText);
    setContent(newText);
    
    requestAnimationFrame(() => {
        textarea.focus();
        const newCursorStart = start + before.length;
        const newCursorEnd = end + before.length;
        textarea.setSelectionRange(newCursorStart, newCursorEnd);
    });
  };

  const toggleLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    
    let startLineIndex = value.lastIndexOf('\n', start - 1) + 1;
    let endLineIndex = value.indexOf('\n', end);
    if (endLineIndex === -1) endLineIndex = value.length;

    const chunkStart = startLineIndex;
    let chunkEnd = end;
    if (chunkEnd < value.length && value[chunkEnd] !== '\n') {
        const nextNewline = value.indexOf('\n', chunkEnd);
        chunkEnd = nextNewline === -1 ? value.length : nextNewline;
    }

    const textChunk = value.substring(chunkStart, chunkEnd);
    const lines = textChunk.split('\n');
    const allHavePrefix = lines.every(line => line.trim() === '' || line.startsWith(prefix));

    const newLines = lines.map(line => {
        if (line.trim() === '') return line;
        if (prefix.startsWith('#')) {
             return line.replace(/^#+\s*/, '') === line ? prefix + line : prefix + line.replace(/^#+\s*/, '');
        }
        
        if (allHavePrefix) {
            return line.startsWith(prefix) ? line.substring(prefix.length) : line;
        } else {
            let cleanLine = line;
            if (['-', '>', '*'].includes(prefix.trim())) {
                 cleanLine = line.replace(/^[-*>]\s*/, '');
            }
            return prefix + cleanLine;
        }
    });

    const newChunk = newLines.join('\n');
    const newText = value.substring(0, chunkStart) + newChunk + value.substring(chunkEnd);

    pushHistory(newText);
    setContent(newText);

    requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(chunkStart, chunkStart + newChunk.length);
    });
  };

  const setHeading = (level: 0 | 1 | 2 | 3) => {
      if (level === 0) {
          const textarea = textareaRef.current;
          if (!textarea) return;
          const start = textarea.selectionStart;
          const value = textarea.value;
          const lineStart = value.lastIndexOf('\n', start - 1) + 1;
          const lineEnd = value.indexOf('\n', start) === -1 ? value.length : value.indexOf('\n', start);
          const line = value.substring(lineStart, lineEnd);
          const newLine = line.replace(/^#+\s*/, '');
          const newText = value.substring(0, lineStart) + newLine + value.substring(lineEnd);
          pushHistory(newText);
          setContent(newText);
      } else {
          const prefix = '#'.repeat(level) + ' ';
          toggleLinePrefix(prefix);
      }
      setShowHeadingsMenu(false);
  };

  // --- Media Handlers ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
          const base64 = ev.target?.result as string;
          // Insert Markdown Image tag
          const imgTag = `\n![${file.name}](${base64})\n`;
          insertText(imgTag);
      };
      reader.readAsDataURL(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                const base64data = reader.result as string;
                // Insert HTML Audio tag for SimpleMarkdown to pick up
                const audioTag = `\n<audio controls src="${base64data}"></audio>\n`;
                insertText(audioTag);
            };
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Mic Error:", err);
        alert("Microphone access required.");
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
            case 'b': e.preventDefault(); insertText('**', '**'); break;
            case 'i': e.preventDefault(); insertText('*', '*'); break;
            case 'u': e.preventDefault(); insertText('<u>', '</u>'); break;
            case 'z': 
                e.preventDefault(); 
                if (e.shiftKey) handleRedo(); else handleUndo(); 
                break;
            case 'y': e.preventDefault(); handleRedo(); break;
            case 's': e.preventDefault(); handleSave(); break;
        }
    }
  };

  const ToolbarButton = ({ icon: Icon, onClick, title, active = false, disabled = false, danger = false }: { icon: any, onClick: () => void, title: string, active?: boolean, disabled?: boolean, danger?: boolean }) => (
      <button 
        onClick={onClick}
        disabled={disabled}
        className={`p-2 rounded-md transition-all duration-200 ${
            active 
            ? 'bg-nova-primary/20 text-nova-primary' 
            : danger 
            ? 'text-red-400 hover:bg-red-500/20'
            : 'text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent'
        }`}
        title={title}
      >
        <Icon size={18} />
      </button>
  );

  const ToolbarSeparator = () => <div className="w-px h-6 bg-slate-700 mx-1" />;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">

      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />

      {/* Main Window */}
      <div className="w-full h-full md:w-[95vw] md:h-[95vh] bg-[#1E1E28] md:rounded-xl shadow-2xl overflow-hidden flex flex-col relative border border-slate-700">
        
        {/* Title Bar */}
        <div className="h-12 bg-[#2b2b36] flex items-center justify-between px-4 select-none border-b border-black/20 shrink-0">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-pointer">
                    <FileText className="text-nova-primary" size={20} />
                    <input 
                        className="bg-transparent border-none outline-none text-sm font-medium text-slate-200 placeholder:text-slate-500 w-40 hover:bg-black/20 rounded px-1 transition-colors"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button onClick={() => setIsPreview(!isPreview)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-bold rounded transition-colors mr-2">
                    {isPreview ? <><EyeOff size={14}/> Edit</> : <><Eye size={14}/> Preview</>}
                </button>
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-1.5 bg-nova-primary hover:bg-cyan-300 text-black text-xs font-bold uppercase tracking-wider rounded transition-colors"
                >
                    <Save size={14} /> Save
                </button>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded transition-colors"
                >
                    <X size={18} />
                </button>
            </div>
        </div>

        {/* Ribbon / Toolbar - Disable during preview */}
        <div className={`bg-[#1E1E28] border-b border-slate-700 p-2 px-4 flex items-center gap-2 shadow-sm z-20 overflow-x-auto shrink-0 custom-scrollbar ${isPreview ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-1">
                <ToolbarButton icon={Undo2} onClick={handleUndo} title="Undo (Ctrl+Z)" disabled={historyIndex <= 0} />
                <ToolbarButton icon={Redo2} onClick={handleRedo} title="Redo (Ctrl+Y)" disabled={historyIndex >= history.length - 1} />
            </div>
            <ToolbarSeparator />
            <div className="relative">
                <button 
                    onClick={() => setShowHeadingsMenu(!showHeadingsMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 min-w-[120px] justify-between border border-slate-700/50"
                >
                    <span>Format</span>
                    <ChevronDown size={12} className="text-slate-500"/>
                </button>
                {showHeadingsMenu && (
                    <div className="absolute top-full left-0 mt-1 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50 flex flex-col">
                        <button onClick={() => setHeading(0)} className="text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white">Paragraph</button>
                        <button onClick={() => setHeading(1)} className="text-left px-4 py-2 text-lg font-bold text-white hover:bg-slate-700">Heading 1</button>
                        <button onClick={() => setHeading(2)} className="text-left px-4 py-2 text-base font-bold text-white hover:bg-slate-700">Heading 2</button>
                        <button onClick={() => setHeading(3)} className="text-left px-4 py-2 text-sm font-bold text-white hover:bg-slate-700">Heading 3</button>
                    </div>
                )}
            </div>
            <div className="flex items-center bg-slate-800/50 rounded-lg p-0.5 border border-slate-700/50 ml-1">
                <ToolbarButton icon={Bold} onClick={() => insertText('**', '**')} title="Bold (Ctrl+B)" />
                <ToolbarButton icon={Italic} onClick={() => insertText('*', '*')} title="Italic (Ctrl+I)" />
                <ToolbarButton icon={Underline} onClick={() => insertText('<u>', '</u>')} title="Underline (Ctrl+U)" />
            </div>
            <ToolbarSeparator />
            <div className="flex items-center gap-1">
                <ToolbarButton icon={AlignLeft} onClick={() => insertText('<div align="left">', '</div>')} title="Align Left" />
                <ToolbarButton icon={AlignCenter} onClick={() => insertText('<div align="center">', '</div>')} title="Align Center" />
                <ToolbarButton icon={AlignRight} onClick={() => insertText('<div align="right">', '</div>')} title="Align Right" />
            </div>
            <ToolbarSeparator />
            <div className="flex items-center gap-1">
                <ToolbarButton icon={List} onClick={() => toggleLinePrefix('- ')} title="Bullet List" />
                <ToolbarButton icon={CheckSquare} onClick={() => toggleLinePrefix('[ ] ')} title="Checklist" />
                <ToolbarButton icon={Quote} onClick={() => toggleLinePrefix('> ')} title="Quote" />
                <ToolbarButton icon={Code} onClick={() => insertText('`', '`')} title="Inline Code" />
            </div>
            <ToolbarSeparator />
            {/* Media Controls */}
             <div className="flex items-center gap-1">
                <ToolbarButton icon={ImageIcon} onClick={() => fileInputRef.current?.click()} title="Insert Image" />
                <ToolbarButton 
                    icon={isRecording ? Check : Mic} 
                    onClick={isRecording ? stopRecording : startRecording} 
                    title={isRecording ? "Stop Recording" : "Record Voice Note"}
                    active={isRecording}
                    danger={isRecording}
                />
            </div>
        </div>

        {/* AI Prompt Bar - Disable during preview */}
        <div className={`relative z-10 bg-[#22222d] border-b border-slate-700 px-4 py-3 shrink-0 transition-all duration-300 ${isGenerating ? 'border-nova-primary/50' : ''} ${isPreview ? 'opacity-50 pointer-events-none' : ''}`}>
             <div className={`flex items-center gap-3 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 focus-within:border-nova-primary/50 focus-within:bg-slate-900 transition-all ${isGenerating ? 'editing-wave border-nova-primary' : ''}`}>
                <div className={`p-1.5 rounded-md ${isGenerating ? 'bg-nova-primary text-black' : 'bg-slate-800 text-nova-primary'}`}>
                    <Sparkles size={16} className={isGenerating ? 'animate-spin' : ''} />
                </div>
                <input 
                    type="text" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                    placeholder="Tell AI to write, expand, or summarize..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-500 h-8"
                    disabled={isGenerating}
                />
                <button 
                    onClick={handleAiGenerate}
                    disabled={!prompt || isGenerating}
                    className="text-xs font-semibold bg-slate-800 hover:bg-nova-primary hover:text-black text-slate-300 px-3 py-1.5 rounded-md transition-all disabled:opacity-50 disabled:hover:bg-slate-800 disabled:hover:text-slate-300"
                >
                    Generate
                </button>
             </div>
             {isGenerating && (
                 <div className="absolute bottom-0 left-0 w-full h-0.5 bg-nova-primary/20 overflow-hidden">
                     <div className="w-full h-full bg-nova-primary animate-shimmer origin-left" />
                 </div>
             )}
        </div>

        {/* Document Area */}
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto bg-[#1a1a23] relative flex justify-center p-8 cursor-text custom-scrollbar"
            onClick={() => !isPreview && textareaRef.current?.focus()}
        >
            {/* Paper Container */}
            <div
                className={`w-[800px] bg-[#1E1E28] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative transition-all duration-500 ${isGenerating ? 'shadow-[0_0_30px_rgba(34,211,238,0.15)] ring-1 ring-nova-primary/20' : ''}`}
                style={{
                    zoom: zoom / 100,
                    // Dynamic height based on content - expands automatically when limit reached
                    minHeight: PAGE_HEIGHT,
                    height: pageCount > 1 ? `${pageCount * PAGE_HEIGHT}px` : PAGE_HEIGHT,
                    // Simulate Pages with CSS background - dark line at bottom of each page
                    backgroundImage: `linear-gradient(to bottom, transparent ${PAGE_HEIGHT - 2}px, #0f0f13 ${PAGE_HEIGHT - 2}px, #0f0f13 ${PAGE_HEIGHT}px, transparent ${PAGE_HEIGHT}px)`,
                    backgroundSize: `100% ${PAGE_HEIGHT}px`,
                    backgroundRepeat: 'repeat-y',
                    paddingBottom: '40px'
                }}
            >
                {isPreview ? (
                     <div className="w-full h-full px-12 py-16 text-slate-200 text-lg leading-relaxed font-sans markdown-preview">
                        <SimpleMarkdown text={content} />
                     </div>
                ) : (
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        onKeyDown={handleKeyDown}
                        spellCheck={isSpellCheck}
                        placeholder="Start typing..."
                        name="page"
                        className="w-full bg-transparent resize-none outline-none text-slate-200 text-lg leading-relaxed px-12 py-16 font-sans selection:bg-nova-primary/30 overflow-hidden"
                        style={{ minHeight: PAGE_HEIGHT }}
                    />
                )}
            </div>
        </div>

        {/* Status Bar */}
        <div className="h-8 bg-[#22d3ee] flex items-center justify-between px-4 text-[10px] font-bold text-black select-none z-20 shrink-0">
             <div className="flex gap-4">
                 <span>PAGE {pageCount} OF {pageCount}</span>
                 <span>{content.length} CHARS</span>
                 <span>{content.trim() === '' ? 0 : content.trim().split(/\s+/).length} WORDS</span>
             </div>
             <div className="flex gap-4 items-center">
                 <button onClick={() => setIsSpellCheck(!isSpellCheck)} className={`flex items-center gap-1 hover:text-white transition-colors ${!isSpellCheck ? 'opacity-50' : ''}`}>
                    <Check size={10}/> SPELL CHECK {isSpellCheck ? 'ON' : 'OFF'}
                 </button>
                 <span>ENGLISH (US)</span>
                 <div className="flex items-center gap-2 bg-black/10 rounded px-1">
                     <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="hover:text-white p-0.5"><ZoomOut size={10} /></button>
                     <span className="w-8 text-center">{zoom}%</span>
                     <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="hover:text-white p-0.5"><ZoomIn size={10} /></button>
                 </div>
             </div>
        </div>

      </div>
    </div>
  );
};
