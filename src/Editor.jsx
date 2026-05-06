import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import Toolbar from './Toolbar';
import CodeOutput from './CodeOutput';
import { Save, ChevronLeft, Type, X, Sun, Moon, Copy, Check, Palette, BookOpen, Eye, EyeOff, Sigma, Settings } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import Dialog from './Dialog';
import SettingsMenu from './SettingsMenu';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import 'katex/dist/katex.min.css';
import db from './db';
import Mathematics from './Mathematics';
import CanvasElement from './CanvasElement';

const FocusBlur = Extension.create({
  name: 'focusBlur',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('focus-blur'),
        props: {
          decorations: (state) => {
            const { selection } = state;
            const decorations = [];

            const $pos = state.doc.resolve(selection.from);
            const depth = $pos.depth;
            
            if (depth > 0) {
              const pos = $pos.before(1);
              const node = state.doc.nodeAt(pos);
              if (node) {
                decorations.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    class: 'ProseMirror-focusednode',
                  }),
                );
              }
            }

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

const DEFAULT_MARKDOWN = `# Welcome to MD-Notes
A beautifully crafted, **distraction-free** Markdown workspace for your thoughts, ideas, and code snippets.
## Features
- **Visual Editing**: Write your notes naturally, just like in Word or Notion.
- **Premium Reading**: Designed for a seamless, minimalist e-book reading aesthetic.
- **Formatting Tools**: Tap the 'Aa' button to reveal the floating Notch Nook toolbar.
- **Export**: Download your raw \`.md\` notes in one click.
### Code Snippets
\`\`\`javascript
function captureIdea(idea) {
  return "Saved: " + idea;
}
\`\`\`
### To-Do List
- [x] Adopt a minimalist e-book style
- [x] Implement smooth dynamic animations
- [ ] Jot down some brilliant ideas
> "The palest ink is better than the best memory."
`;
function Editor({ currentTheme, onToggleTheme, globalAccent, onUpdateAccent, preferences, onUpdatePreference }) {
  const [textSize, setTextSize] = useState(100);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [ripples, setRipples] = useState([]);
  const editorScrollRef = useRef(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const initialContent = useMemo(() => {
    // We'll handle content setting in useEffect to support async DB loading
    return '';
  }, [id]);
  const [markdown, setMarkdown] = useState(initialContent);
  const [title, setTitle] = useState('');
  const [activeTab, setActiveTab] = useState('editor');
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialType = queryParams.get('type') || 'markdown';
  
  const [docType, setDocType] = useState(initialType);
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [canvasElements, setCanvasElements] = useState([]);
  const [activeElementId, setActiveElementId] = useState(null);
  const [activeCanvasEditor, setActiveCanvasEditor] = useState(null);
  const [guides, setGuides] = useState({ x: [], y: [] });


  const [copied, setCopied] = useState(false);
  const [noteAccent, setNoteAccent] = useState(null);
  const [isReadingMode, setIsReadingMode] = useState(false);

  const ACCENT_COLORS = [
    { name: 'Slate', color: '#000000' },
    { name: 'Rose', color: '#e11d48' },
    { name: 'Amber', color: '#d97706' },
    { name: 'Emerald', color: '#059669' },
    { name: 'Blue', color: '#2563eb' },
    { name: 'Violet', color: '#7c3aed' },
  ];
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false });
  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Link.configure({ openOnClick: false }),
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      Mathematics,
      FocusBlur,
      Placeholder.configure({
        placeholder: 'Start writing here....',
      }),
    ],
    content: initialContent,
    contentType: 'markdown',
    autofocus: 'end',
    editorProps: {
      class: `focus:outline-none min-h-full markdown-preview pb-40 pt-0 ${preferences.focusBlur ? 'focus-blur-active' : ''}`,
    },
    onUpdate: ({ editor }) => {
      setMarkdown(editor.getMarkdown());
    },
    editable: !isReadingMode,
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadingMode);
      if (isReadingMode) {
        setActiveTab('editor');
      }
    }
  }, [isReadingMode, editor]);
  useEffect(() => {
    const loadContent = async () => {
      if (!editor) return;

      if (id) {
        const doc = await db.getDocById(id);
        if (doc) {
          setTitle(doc.title || '');
          setMarkdown(doc.content || '');
          setNoteAccent(doc.accentColor || null);
          setDocType(doc.type || 'markdown');
          
          if (doc.type === 'plain' && doc.content.startsWith('{')) {
            try {
              const data = JSON.parse(doc.content);
              setCanvasElements(data.elements || []);
              setIsFreeMode(data.isFreeMode || false);
              // Set content to the main editor if present
              const jsonContent = editor.storage.markdown.manager.parse(data.mainContent || '');
              editor.commands.setContent(jsonContent, false);
            } catch (e) {
              const jsonContent = editor.storage.markdown.manager.parse(doc.content || '');
              editor.commands.setContent(jsonContent, false);
            }
          } else {
            const jsonContent = editor.storage.markdown.manager.parse(doc.content || '');
            editor.commands.setContent(jsonContent, false);
          }
        }
      } else {
        const savedDocs = await db.getDocs();
        if (savedDocs.length === 0 && initialType === 'markdown') {
          setTitle('Welcome to MD-Notes');
          setMarkdown(DEFAULT_MARKDOWN);
          const jsonContent = editor.storage.markdown.manager.parse(DEFAULT_MARKDOWN);
          editor.commands.setContent(jsonContent, false);
        } else if (initialType === 'plain') {
          setTitle('New Design');
          setMarkdown('');
          editor.commands.setContent('', false);
        }
      }
    };
    loadContent();
  }, [id, editor]);


  useEffect(() => {
    const root = document.documentElement;
    if (currentTheme === 'light') {
      const accentToUse = noteAccent || globalAccent;
      root.style.setProperty('--accent-color', accentToUse);
      const r = parseInt(accentToUse.slice(1, 3), 16);
      const g = parseInt(accentToUse.slice(3, 5), 16);
      const b = parseInt(accentToUse.slice(5, 7), 16);
      root.style.setProperty('--accent-color-rgb', `${r}, ${g}, ${b}`);
    } else {
      root.style.removeProperty('--accent-color');
      root.style.removeProperty('--accent-color-rgb');
    }

    return () => {
      if (currentTheme === 'light') {
        root.style.setProperty('--accent-color', globalAccent);
        const r_g = parseInt(globalAccent.slice(1, 3), 16);
        const g_g = parseInt(globalAccent.slice(3, 5), 16);
        const b_g = parseInt(globalAccent.slice(5, 7), 16);
        root.style.setProperty('--accent-color-rgb', `${r_g}, ${g_g}, ${b_g}`);
      } else {
        root.style.removeProperty('--accent-color');
        root.style.removeProperty('--accent-color-rgb');
      }
    };
  }, [noteAccent, globalAccent, currentTheme]);

  useEffect(() => {
    const handleScroll = () => {
      if (!preferences.scrollProgress || !editorScrollRef.current) return;
      const element = editorScrollRef.current;
      const totalHeight = element.scrollHeight - element.clientHeight;
      const windowScrollTop = element.scrollTop;
      if (totalHeight === 0) {
        setScrollProgress(0);
        return;
      }
      const currentProgress = (windowScrollTop / totalHeight) * 100;
      setScrollProgress(currentProgress);
    };

    const scrollEl = editorScrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', handleScroll);
      }
    };
  }, [preferences.scrollProgress, activeTab]);

  const createRipple = (e) => {
    if (!preferences.inkBleed) return;
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const newRipple = {
      id: Date.now(),
      x,
      y,
      size
    };
    
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 800);
  };

  const handleRename = () => {
    setDialogConfig({
      isOpen: true,
      type: 'prompt',
      title: 'Rename Document',
      defaultValue: title || 'Untitled Document',
      onConfirm: (newTitle) => {
        if (newTitle !== null && newTitle.trim() !== '') {
          const finalTitle = newTitle.trim();
          setTitle(finalTitle);
          if (id) {
            const update = async () => {
              const doc = await db.getDocById(id);
              if (doc) {
                await db.saveDoc({ ...doc, title: finalTitle, lastModified: Date.now() });
              }
            };
            update();
          }
        }
      }
    });
  };
  const handleSave = async () => {
    let docTitle = title;
    if (!docTitle || docTitle === 'Untitled Document' || docTitle === 'Welcome to MD-Notes') {
      const lines = markdown.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 0) {
        const firstLine = lines[0];
        docTitle = firstLine.replace(/^#+\s+/, '').substring(0, 40);
        setTitle(docTitle);
      } else {
        docTitle = 'Untitled Document';
      }
    }
    
    const docId = id || Date.now().toString();
    
    let contentToSave = markdown;
    if (docType === 'plain') {
      contentToSave = JSON.stringify({
        mainContent: markdown,
        elements: canvasElements,
        isFreeMode
      });
    }

    const doc = {
      id: docId,
      title: docTitle,
      content: contentToSave,
      lastModified: Date.now(),
      accentColor: noteAccent,
      type: docType
    };

    try {
      await db.saveDoc(doc);
      if (!id) {
        navigate(`/editor/${docId}`);
      } else {
        alert('Document saved successfully!');
      }
    } catch (e) {
      alert('An error occurred while saving.');
    }
  };
  const startDrag = (e, id) => {
    if (!isFreeMode) return;
    e.preventDefault();
    setActiveElementId(id);
    const el = canvasElements.find(item => item.id === id);
    if (!el) return;

    const startX = e.clientX || e.touches?.[0].clientX;
    const startY = e.clientY || e.touches?.[0].clientY;
    
    const initialX = el.x;
    const initialY = el.y;

    const onMove = (moveEvent) => {
      const currentX = moveEvent.clientX || moveEvent.touches?.[0].clientX;
      const currentY = moveEvent.clientY || moveEvent.touches?.[0].clientY;
      
      let nextX = initialX + (currentX - startX);
      let nextY = initialY + (currentY - startY);

      // Snapping & Guidelines logic
      const SNAP_THRESHOLD = 15;
      const newGuides = { x: [], y: [] };
      
      // Center guideline
      const centerX = window.innerWidth / 2;
      if (Math.abs(nextX + el.width/2 - centerX) < SNAP_THRESHOLD) {
        nextX = centerX - el.width/2;
        newGuides.x.push(centerX);
      }

      // Snap to other elements
      canvasElements.forEach(other => {
        if (other.id === id) return;
        
        // Horizontal snapping (Left, Center, Right)
        if (Math.abs(nextX - other.x) < SNAP_THRESHOLD) {
          nextX = other.x;
          newGuides.x.push(other.x);
        }
        if (Math.abs(nextX + el.width - (other.x + other.width)) < SNAP_THRESHOLD) {
          nextX = other.x + other.width - el.width;
          newGuides.x.push(other.x + other.width);
        }

        // Vertical snapping (Top, Bottom)
        if (Math.abs(nextY - other.y) < SNAP_THRESHOLD) {
          nextY = other.y;
          newGuides.y.push(other.y);
        }
        if (Math.abs(nextY + el.height - (other.y + other.height)) < SNAP_THRESHOLD) {
          nextY = other.y + other.height - el.height;
          newGuides.y.push(other.y + other.height);
        }
      });

      setGuides(newGuides);
      setCanvasElements(prev => prev.map(item => 
        item.id === id ? { ...item, x: nextX, y: nextY } : item
      ));
    };

    const onEnd = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onEnd);
      setGuides({ x: [], y: [] });
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onEnd);
  };

  const addCanvasElement = (type) => {
    const id = Date.now().toString();
    const newElement = type === 'text' ? {
      id,
      type: 'text',
      x: 100,
      y: 100,
      width: 250,
      height: 150,
      rotation: 0,
      content: '<p>Start writing here...</p>',
      styles: { fontSize: 16 }
    } : {
      id,
      type: 'image',
      x: 150,
      y: 150,
      width: 200,
      height: 200,
      rotation: 0,
      src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=2070'
    };
    
    setCanvasElements(prev => [...prev, newElement]);
    setActiveElementId(id);
  };

  const updateCanvasElement = (id, updates) => {
    setCanvasElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const removeElement = (id) => {
    setCanvasElements(prev => prev.filter(el => el.id !== id));
    if (activeElementId === id) setActiveElementId(null);
  };

  const handleCopy = async () => {
    const content = editor ? editor.getMarkdown() : markdown;
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleUpdateNoteAccent = async (color) => {
    setNoteAccent(color);
    if (id) {
      const doc = await db.getDocById(id);
      if (doc) {
        await db.saveDoc({ ...doc, accentColor: color });
      }
    }
    setIsColorPickerOpen(false);
  };
  const handleInsertImage = (url) => {
    if (docType === 'plain') {
      const newEl = {
        id: Date.now().toString(),
        type: 'image',
        src: url,
        x: 100,
        y: editorScrollRef.current.scrollTop + 100,
        width: 300,
        height: 200
      };
      setCanvasElements(prev => [...prev, newEl]);
    } else {
      editor.chain().focus().setImage({ src: url }).run();
    }
    setIsImageDialogOpen(false);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[var(--bg-color)] transition-colors duration-300 text-[#111] dark:text-[#eee] overflow-hidden relative selection:bg-[var(--accent-color)]/20">
      <Dialog {...dialogConfig} onCancel={closeDialog} />
      <SettingsMenu 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        currentTheme={currentTheme}
        onToggleTheme={onToggleTheme}
        globalAccent={globalAccent}
        onUpdateAccent={onUpdateAccent}
        preferences={preferences}
        onUpdatePreference={onUpdatePreference}
      />
      {preferences.scrollProgress && activeTab === 'editor' && (
        <div className="scroll-progress-container">
          <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }} />
        </div>
      )}
      <div
        className="absolute top-0 left-0 right-0 h-28 z-20 pointer-events-none transition-colors duration-300"
        style={{
          background: 'linear-gradient(to bottom, var(--bg-color) 10%, transparent 100%)',
          backdropFilter: 'blur(8px)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
        }}
      />
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center gap-1 px-4 pt-5 pb-4 pointer-events-none">
        <RouterLink
          to="/"
          className="p-2 text-[#555] dark:text-[#999] hover:text-black dark:hover:text-white transition-colors pointer-events-auto"
        >
          <ChevronLeft size={24} strokeWidth={1.5} />
        </RouterLink>
        <button
          onClick={handleRename}
          className="text-[16px] font-serif font-medium text-[#444] dark:text-[#999] hover:text-black dark:hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-[#e5e5e0] dark:hover:bg-[#333] truncate max-w-[180px] pointer-events-auto"
          title="Click to rename"
        >
          {title || 'Untitled Document'}
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsReadingMode(!isReadingMode)}
            className={`p-2.5 rounded-full transition-all active:scale-95 ${isReadingMode ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-transparent text-[#666] dark:text-[#999] hover:bg-black/5 dark:hover:bg-white/10'}`}
            title={isReadingMode ? "Exit Reading Mode" : "Enter Reading Mode"}
          >
            {isReadingMode ? <BookOpen size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2} />}
          </button>
          {!isReadingMode && (
            <button
              onClick={handleSave}
              className="p-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full hover:shadow-lg active:scale-95 transition-all"
              title="Save Document"
            >
              <Save size={20} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
      <main 
        className="flex-1 flex flex-col overflow-hidden relative transition-colors duration-500"
        style={{ 
          backgroundColor: currentTheme === 'light' 
            ? `rgba(var(--accent-color-rgb), 0.05)` 
            : 'transparent' 
        }}
      >
        <div className={`flex-1 flex flex-col h-full absolute inset-0 transition-all duration-500 ${activeTab === 'editor' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'} ${preferences.paperSlide && activeTab === 'code' ? '-translate-x-10' : 'translate-x-0'}`}>
          <main 
            ref={editorScrollRef} 
            className={`flex-1 overflow-auto px-6 z-10 no-scrollbar pb-52 pt-20 max-w-2xl mx-auto w-full spring-scroll ${docType === 'plain' ? 'relative bg-white/30 dark:bg-black/10 canvas-grid' : ''}`}
          >
            <div 
              className={`relative ${docType === 'plain' ? 'min-h-[1000px]' : ''}`}
              onClick={() => {
                if (docType === 'plain') {
                  setActiveElementId(null);
                  setActiveCanvasEditor(null);
                }
              }}
            >
              {/* Guidelines */}
              {guides.y.map((y, i) => (
                <div key={`y-${i}`} className="absolute left-0 right-0 h-px bg-[var(--accent-color)]/40 z-50 pointer-events-none" style={{ top: y }} />
              ))}
              {guides.x.map((x, i) => (
                <div key={`x-${i}`} className="absolute top-0 bottom-0 w-px bg-[var(--accent-color)]/40 z-50 pointer-events-none" style={{ left: x }} />
              ))}

              <div 
                className="markdown-preview focus:outline-none relative z-10" 
                style={{ 
                  fontSize: `${textSize}%`,
                  // Fixed vs Free-form layout logic
                  display: isFreeMode && docType === 'plain' ? 'block' : 'block'
                }}
              >
                {(!isFreeMode || docType !== 'plain') && (
                  <EditorContent editor={editor} />
                )}
              </div>

              {/* Canvas Elements (Images, Text Boxes, etc.) */}
              {docType === 'plain' && canvasElements.map(el => (
                <CanvasElement
                  key={el.id}
                  element={el}
                  allElements={canvasElements}
                  isFreeMode={isFreeMode}
                  isReadingMode={isReadingMode}
                  isActive={activeElementId === el.id}
                  onUpdate={updateCanvasElement}
                  onSelect={(id) => {
                    setActiveElementId(id);
                    if (el.type !== 'text') setActiveCanvasEditor(null);
                  }}
                  onDelete={removeElement}
                  onEditorFocus={(id, ed) => {
                    setActiveElementId(id);
                    setActiveCanvasEditor(ed);
                  }}
                  onEditorBlur={() => {
                    // We don't necessarily want to clear the active editor on blur
                    // as the user might be clicking tools in the capsule.
                  }}
                  currentTheme={currentTheme}
                />
              ))}
            </div>
          </main>
        </div>
        <div className={`flex-1 flex flex-col h-full absolute inset-0 transition-all duration-500 ${activeTab === 'code' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'} ${preferences.paperSlide && activeTab === 'editor' ? 'translate-x-10' : 'translate-x-0'}`}>
          <div className="pt-20 pb-52 h-full flex flex-col px-4 overflow-auto spring-scroll no-scrollbar">
            <CodeOutput markdown={markdown} setMarkdown={setMarkdown} editor={editor} />
          </div>
        </div>
      </main>
      <div
        className="fixed bottom-0 left-0 right-0 h-[180px] z-30 pointer-events-none transition-colors duration-300"
        style={{
          background: `linear-gradient(to top, var(--bg-color) 0%, transparent 100%)`,
          backdropFilter: 'blur(20px)',
          WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
          maskImage: 'linear-gradient(to top, black 0%, transparent 100%)'
        }}
      />
      {!isReadingMode && (
        <div className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center">
        <div
          className={`bg-white dark:bg-[#1a1a1a] text-black dark:text-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] relative ${preferences.elasticMorph ? 'ease-elastic' : ''} ${isToolbarExpanded
            ? 'w-full h-12'
            : `${docType === 'plain' ? 'w-[200px]' : 'w-[240px]'} rounded-t-2xl h-11 shadow-2xl border-x border-t border-[#e5e5e0] dark:border-[#333]`
            }`}
        >
          {/* Inverted Corners (Outward Curves) */}
          {isToolbarExpanded && (
            <>
              {/* Top-left curve to edge */}
              <div className="absolute left-0 w-5 h-5 pointer-events-none transition-opacity duration-300 delay-500 animate-in fade-in fill-mode-forwards" style={{ top: '-19.5px' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white dark:text-[#1a1a1a]">
                  <path d="M0 20 L0 0 C0 11.0457 8.9543 20 20 20 Z" fill="currentColor" />
                </svg>
              </div>
              {/* Top-right curve to edge */}
              <div className="absolute right-0 w-5 h-5 pointer-events-none transition-opacity duration-300 delay-500 animate-in fade-in fill-mode-forwards" style={{ top: '-19.5px' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white dark:text-[#1a1a1a]">
                  <path d="M20 20 L20 0 C20 11.0457 11.0457 20 0 20 Z" fill="currentColor" />
                </svg>
              </div>
            </>
          )}


          <div
            className={`absolute inset-0 flex items-center justify-between px-3 transition-all duration-400 ${isToolbarExpanded ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100 delay-100'
              }`}
          >
            {docType === 'markdown' && (
              <div className="relative flex items-center bg-[#f0f0ea] dark:bg-[#252525] p-1 rounded-full">
                <div 
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-[#333] rounded-full shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                    activeTab === 'code' ? 'translate-x-full' : 'translate-x-0'
                  }`}
                  style={{ width: isReadingMode ? '100%' : 'calc(50% - 4px)' }}
                />
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`relative z-10 px-3 py-1 rounded-full text-[12px] font-medium transition-all duration-300 ${activeTab === 'editor' ? 'text-black dark:text-white' : 'text-[#666] dark:text-[#999] hover:text-black dark:hover:text-white'}`}
                >
                  Read
                </button>
                {!isReadingMode && (
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`relative z-10 px-3 py-1 rounded-full text-[12px] font-medium transition-all duration-300 ${activeTab === 'code' ? 'text-black dark:text-white' : 'text-[#666] dark:text-[#999] hover:text-black dark:hover:text-white'}`}
                  >
                    Code
                  </button>
                )}
              </div>
            )}
            {docType === 'plain' && !isReadingMode && (
              <div className="flex items-center gap-1 bg-[#f0f0ea] dark:bg-[#252525] p-0.5 rounded-full ml-1">
                <div className="flex items-center p-0.5 bg-black/5 dark:bg-white/5 rounded-full">
                  <button 
                    onClick={() => {
                      if (isFreeMode) {
                        setDialogConfig({
                          isOpen: true,
                          type: 'alert',
                          title: 'Switching to Fixed Mode',
                          message: 'To maintain a structured layout, please create a new file for Fixed Mode writing. Free Mode layouts cannot be converted back.',
                        });
                        return;
                      }
                      setIsFreeMode(false);
                    }}
                    className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-tighter transition-all ${!isFreeMode ? 'bg-white dark:bg-[#444] text-black dark:text-white shadow-sm' : 'text-[#888]'}`}
                  >
                    Fixed
                  </button>
                  <button 
                    onClick={() => setIsFreeMode(true)}
                    className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-tighter transition-all ${isFreeMode ? 'bg-white dark:bg-[#444] text-black dark:text-white shadow-sm' : 'text-[#888]'}`}
                  >
                    Free
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center text-[#666] dark:text-[#ddd] hover:text-black dark:hover:text-white shrink-0"
                title="Copy Markdown"
              >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} strokeWidth={1.5} />}
              </button>
              <button
                onClick={() => setIsToolbarExpanded(true)}
                className="p-1.5 ml-0.5 rounded-full hover:bg-[#f0f0ea] dark:hover:bg-[#333] transition-colors flex items-center justify-center text-black dark:text-white shrink-0"
                aria-label="Formatting Tools"
              >
                <Type size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>
          <div
            className={`absolute inset-0 flex items-center w-full px-1 transition-all duration-400 ${isToolbarExpanded ? 'opacity-100 scale-100 delay-100' : 'opacity-0 scale-105 pointer-events-none'
              }`}
          >
            <div className="flex-1 overflow-hidden flex items-center h-full">
              <Toolbar
                editor={activeCanvasEditor || editor}
                setExternalDialog={setDialogConfig}
                closeExternalDialog={closeDialog}
                textSize={textSize}
                onUpdateTextSize={setTextSize}
                isPlainMode={docType === 'plain'}
                onAddText={() => addCanvasElement('text')}
                onAddImage={() => {
                  setDialogConfig({
                    isOpen: true,
                    type: 'prompt',
                    title: 'Insert Image',
                    defaultValue: '',
                    showUploadOption: true,
                    onConfirm: (url) => {
                      if (url) {
                        const id = Date.now().toString();
                        setCanvasElements(prev => [...prev, {
                          id,
                          type: 'image',
                          x: 150,
                          y: 150,
                          width: 200,
                          height: 200,
                          rotation: 0,
                          src: url
                        }]);
                        setActiveElementId(id);
                      }
                    }
                  });
                }}
              />
            </div>
            <button
              onClick={() => setIsToolbarExpanded(false)}
              className="p-2 ml-1 mr-2 bg-[#f0f0ea] dark:bg-[#333] hover:bg-[#e5e5e0] dark:hover:bg-[#444] rounded-full transition-colors flex items-center justify-center text-[#666] dark:text-[#ddd] hover:text-black dark:hover:text-white shrink-0 active:scale-95"
              aria-label="Collapse Tools"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}
export default Editor;