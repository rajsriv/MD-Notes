import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus, ChevronRight, CheckCircle2, Circle, X, Trash2, Edit3, LayoutGrid, List, CheckSquare, Sun, Moon, Palette, Type, Settings } from 'lucide-react';
import SettingsMenu from './SettingsMenu';
import Dialog from './Dialog';
import Onboarding from './Onboarding';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import db from './db';

const MARKDOWN_GUIDE = `# Markdown Essentials

Master the art of Markdown with this quick reference guide.

## Text Formatting
- **Bold**: \`**text**\`
- *Italic*: \`*text*\`
- ~~Strikethrough~~: \`~~text~~\`
- \`Inline Code\`: \`\\\`code\\\` \`

## Lists
### Unordered
- Item 1
- Item 2
  - Sub-item

### Ordered
1. First
2. Second
3. Third

### Task List
- [x] Completed task
- [ ] Pending task

## Blockquotes
> "Markdown is a text-to-HTML conversion tool for web writers."

## Links & Images
[Visit Tiptap](https://tiptap.dev)
![Placeholder Image](https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800&auto=format&fit=crop)

## Tables
| Feature | Support |
| :--- | :--- |
| Markdown | Excellent |
| LaTeX | Enabled |
| Design | Premium |
`;

const LATEX_GUIDE = `# LaTeX Math Guide

Welcome to the LaTeX-enabled editor! You can now write complex mathematical formulas with ease.

## Inline Math
You can write math within a sentence by surrounding it with single dollar signs. For example: $E = mc^2$ or $\\sqrt{a^2 + b^2} = c$.

## Block Math
For larger equations, use double dollar signs to create a centered block:

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

## Useful Symbols
- Fractions: $\\frac{a}{b}$
- Exponents: $x^n$
- Subscripts: $a_i$
- Integrals: $\\int_a^b f(x) dx$
- Sums: $\\sum_{i=1}^n i$
- Greek Letters: $\\alpha, \\beta, \\gamma, \\Delta$

Happy typesetting!`;

function Home({ currentTheme, onToggleTheme, globalAccent, onUpdateAccent, preferences, onUpdatePreference }) {
  const [docs, setDocs] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false });
  const [viewMode, setViewMode] = useState(localStorage.getItem('readmeMaker_viewMode') || 'list');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [ripples, setRipples] = useState([]);
  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const ACCENT_COLORS = [
    { name: 'Slate', color: '#000000' },
    { name: 'Rose', color: '#e11d48' },
    { name: 'Amber', color: '#d97706' },
    { name: 'Emerald', color: '#059669' },
    { name: 'Blue', color: '#2563eb' },
    { name: 'Violet', color: '#7c3aed' },
  ];
  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));
  const toggleViewMode = async () => {
    const newMode = viewMode === 'list' ? 'grid' : 'list';
    setViewMode(newMode);
    await db.setPreference('readmeMaker_viewMode', newMode);
  };
  const stripMarkdown = (md) => {
    if (!md) return '';
    // If it looks like JSON (Plain format), parse it and get mainContent
    if (md.startsWith('{')) {
      try {
        const data = JSON.parse(md);
        md = data.mainContent || '';
      } catch (e) {
        // Not JSON, continue with original string
      }
    }
    return md
      .replace(/[#*`~_]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .trim();
  };
  useEffect(() => {
    const init = async () => {
      const savedMode = await db.getPreference('readmeMaker_viewMode', 'list');
      setViewMode(savedMode);

      const savedDocs = await db.getDocs();
      if (savedDocs.length === 0) {
        const now = Date.now();
        const templates = [
          {
            id: 'markdown-guide-' + now,
            title: 'Markdown Essentials',
            content: MARKDOWN_GUIDE,
            lastModified: now + 100,
            accentColor: '#2563eb' // Blue
          },
          {
            id: 'latex-guide-' + now,
            title: 'LaTeX Math Guide',
            content: LATEX_GUIDE,
            lastModified: now,
            accentColor: '#7c3aed' // Violet
          }
        ];
        for (const template of templates) {
          await db.saveDoc(template);
        }
        setDocs(templates);
      } else {
        setDocs(savedDocs);
      }
      
      const hasOnboardedStr = await db.getPreference('mdnotes_onboarded', 'false');
      if (hasOnboardedStr !== 'true') {
        setShowOnboarding(true);
      }
    };
    init();
  }, []);

  const handleOnboardingComplete = async () => {
    await db.setPreference('mdnotes_onboarded', 'true');
    setShowOnboarding(false);
  };
  const loadDocs = async () => {
    const savedDocs = await db.getDocs();
    setDocs(savedDocs);
  };
  const handlePointerDown = (id) => {
    timerRef.current = setTimeout(() => {
      setIsSelectionMode(true);
      toggleSelection(id);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 450); 
  };
  const cancelLongPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  const toggleSelection = (id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        if (newSet.size === 0) setIsSelectionMode(false);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  const handleItemClick = (e, id) => {
    e.preventDefault();
    if (isSelectionMode) {
      toggleSelection(id);
    } else {
      navigate(`/editor/${id}`);
    }
  };
  const handleDelete = () => {
    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Documents',
      message: `Are you sure you want to delete ${selectedIds.size} document(s)? This action cannot be undone.`,
      onConfirm: async () => {
        const idsToDelete = Array.from(selectedIds);
        await db.deleteDocs(idsToDelete);
        const newDocs = docs.filter(d => !selectedIds.has(d.id));
        setDocs(newDocs);
        setIsSelectionMode(false);
        setSelectedIds(new Set());
      }
    });
  };
  const handleRename = () => {
    const id = Array.from(selectedIds)[0];
    const doc = docs.find(d => d.id === id);
    if (doc) {
      setDialogConfig({
        isOpen: true,
        type: 'prompt',
        title: 'Rename Document',
        defaultValue: doc.title || 'Untitled Document',
        onConfirm: async (newTitle) => {
          if (newTitle !== null && newTitle.trim() !== '') {
            const title = newTitle.trim();
            await db.saveDoc({ ...doc, title, lastModified: Date.now() });
            loadDocs();
          }
          setIsSelectionMode(false);
          setSelectedIds(new Set());
        }
      });
    } else {
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    }
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const LavaLamp = () => {
    if (currentTheme === 'dark') return null;
    return (
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 mix-blend-multiply"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)'
        }}
      >
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] animate-blob" style={{ backgroundColor: 'var(--accent-color)' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-blob animation-delay-2000" style={{ backgroundColor: 'var(--accent-color)' }}></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full blur-[80px] animate-blob animation-delay-4000" style={{ backgroundColor: 'var(--accent-color)' }}></div>
      </div>
    );
  };

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

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-color)] transition-colors duration-300 relative overflow-hidden">
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
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
      
      <div 
        className="fixed top-0 left-0 right-0 h-[360px] z-20 pointer-events-none transition-all duration-500"
        style={{
           background: `linear-gradient(to bottom, 
             var(--bg-color) 0%, 
             var(--bg-color) 60%, 
             rgba(var(--bg-color-rgb), 0.9) 80%, 
             transparent 100%)`,
           backdropFilter: 'blur(32px) saturate(150%)',
           WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 75%, transparent 100%)',
           maskImage: 'linear-gradient(to bottom, black 0%, black 75%, transparent 100%)'
        }}
      />
      
      <div 
        className="fixed bottom-0 left-0 right-0 h-[180px] z-30 pointer-events-none transition-colors duration-300"
        style={{
           background: `linear-gradient(to top, var(--bg-color) 0%, transparent 100%)`,
           backdropFilter: 'blur(20px)',
           WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
           maskImage: 'linear-gradient(to top, black 0%, transparent 100%)'
        }}
      />
      
      <div className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
        <header className="pt-16 pb-24 px-8 flex flex-col items-start max-w-2xl mx-auto w-full pointer-events-auto relative min-h-[340px]">
          <LavaLamp />
          <div className="relative z-10">
            <h1 className="text-4xl font-serif text-black dark:text-white mb-2 tracking-tight">
              MD-Notes
            </h1>
            <p className="text-[16px] font-serif text-[#666] dark:text-[#999] italic text-left max-w-[280px] leading-relaxed mb-8">
              Craft perfect Markdown documentation right from your device.
            </p>
            {docs.length > 0 && (
              <h2 className="text-xs font-sans font-semibold text-[#888] dark:text-[#666] uppercase tracking-widest px-2">What went down in History?</h2>
            )}
          </div>
        </header>
      </div>
      
      <main className="flex-1 overflow-auto px-6 z-10 no-scrollbar pb-32 pt-[290px] max-w-2xl mx-auto w-full spring-scroll">
        {docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4 opacity-50">
            <FileText size={48} className="text-[#999] mb-4" strokeWidth={1} />
            <p className="text-[#333] dark:text-[#eee] font-serif text-lg">Your library is empty.</p>
            <p className="text-[#666] dark:text-[#999] font-serif text-sm mt-2 italic">Tap the menu button to begin writing.</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "columns-2 gap-3 px-1 pt-4 pb-8" : "flex flex-col"}>
            <div className={viewMode === 'list' ? "border-t border-[#e5e5e0] dark:border-[#333]" : "contents"}>
              {docs.map(doc => {
                const isSelected = selectedIds.has(doc.id);
                if (viewMode === 'grid') {
                  return (
                    <div 
                      key={doc.id} 
                      onPointerDown={() => handlePointerDown(doc.id)}
                      onPointerUp={cancelLongPress}
                      onPointerLeave={cancelLongPress}
                      onPointerMove={cancelLongPress}
                      onClick={(e) => handleItemClick(e, doc.id)}
                      className={`break-inside-avoid mb-3 relative flex flex-col border border-[#e5e5e0] dark:border-[#333] rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer select-none ${isSelected ? 'bg-[#ebebe5] dark:bg-[#252525] border-[#999] dark:border-[#555]' : 'shadow-sm active:scale-[0.98]'} ${preferences.staggeredEntry ? 'staggered-item' : ''}`}
                      style={{ 
                        backgroundColor: currentTheme === 'light' ? `${doc.accentColor || '#ffffff'}15` : '#1a1a1a',
                        animationDelay: preferences.staggeredEntry ? `${docs.indexOf(doc) * 0.05}s` : '0s'
                      }}
                    >
                      <div className="p-3.5 pointer-events-none overflow-hidden">
                        <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                          <div 
                            className={`text-[12.5px] font-serif leading-[1.6] text-[#444] dark:text-[#aaa] break-words ${
                              ['line-clamp-3', 'line-clamp-4', 'line-clamp-5', 'line-clamp-6'][
                                (doc.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 4
                              ]
                            }`}
                            dangerouslySetInnerHTML={{ 
                              __html: (doc.content || '')
                                .replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
                                  try {
                                    return `<div class="katex-preview-block my-3">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
                                  } catch (e) { return `$$${math}$$`; }
                                })
                                .replace(/\$([^$]+?)\$/g, (_, math) => {
                                  try {
                                    return `<span class="katex-preview-inline">${katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })}</span>`;
                                  } catch (e) { return `$${math}$`; }
                                })
                                .replace(/^# (.*$)/gm, '<h1 class="text-sm font-bold mb-1">$1</h1>')
                                .replace(/^## (.*$)/gm, '<h2 class="text-xs font-bold mb-1">$1</h2>')
                                .replace(/^### (.*$)/gm, '<h3 class="text-[11px] font-bold mb-0.5">$1</h3>')
                                .replace(/^\> (.*$)/gm, '<blockquote class="border-l-2 border-gray-300 pl-2 italic">$1</blockquote>')
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                .replace(/^[-*] (.*$)/gm, '<li class="ml-2 list-none">• $1</li>')
                                .replace(/\n/g, '<br/>')
                            }} 
                          />
                        </div>
                      </div>
                      <div className="flex-shrink-0 bg-[#f9f9f9]/50 dark:bg-[#222] border-t border-[#f0f0ea] dark:border-[#333] p-3 pointer-events-none flex items-center justify-between">
                        <div className="flex-1 overflow-hidden pr-2">
                          <h3 className="text-[13px] font-serif font-medium text-black dark:text-[#eee] mb-0.5 truncate">
                            {doc.title || 'Untitled Document'}
                          </h3>
                          <p className="text-[10px] font-sans text-[#999] dark:text-[#555]">
                            {new Date(doc.lastModified).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        {isSelectionMode && (
                          isSelected ? <CheckCircle2 size={16} className="text-black dark:text-white flex-shrink-0" /> : <Circle size={16} className="text-[#ccc] flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                }
                return (
                  <div 
                    key={doc.id} 
                    onPointerDown={() => handlePointerDown(doc.id)}
                    onPointerUp={cancelLongPress}
                    onPointerLeave={cancelLongPress}
                    onPointerMove={cancelLongPress}
                    onClick={(e) => handleItemClick(e, doc.id)}
                    className={`flex items-center justify-between py-5 px-3 border-b border-[#e5e5e0] dark:border-[#333] transition-colors cursor-pointer select-none ${isSelected ? 'bg-[#ebebe5] dark:bg-[#252525]' : 'hover:bg-white/40 active:bg-[#ebebe5] dark:active:bg-[#252525]'} ${preferences.staggeredEntry ? 'staggered-item' : ''}`}
                    style={{ 
                      backgroundColor: currentTheme === 'light' ? `${doc.accentColor || '#ffffff'}15` : 'transparent',
                      animationDelay: preferences.staggeredEntry ? `${docs.indexOf(doc) * 0.05}s` : '0s'
                    }}
                  >
                    <div className="flex-1 overflow-hidden pr-4 pointer-events-none">
                      <h3 className="text-[17px] font-serif text-black dark:text-[#eee] mb-1 truncate">
                        {doc.title || 'Untitled Document'}
                      </h3>
                      <p className="text-[13px] font-sans text-[#888] dark:text-[#555]">
                        {new Date(doc.lastModified).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    {isSelectionMode ? (
                      isSelected ? <CheckCircle2 size={20} className="text-black dark:text-white flex-shrink-0" /> : <Circle size={20} className="text-[#ccc] flex-shrink-0" />
                    ) : (
                      <ChevronRight size={18} className="text-[#ccc] flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {isMenuOpen && !isSelectionMode && (
        <div 
          className="fixed inset-0 z-30 bg-transparent" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
        <div 
          className={`bg-white dark:bg-[#1a1a1a] text-black dark:text-white shadow-2xl shadow-black/10 dark:shadow-black/40 border border-[#e5e5e0] dark:border-[#333] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden ${
            isSelectionMode 
              ? 'w-[94vw] max-w-3xl rounded-2xl h-11' 
              : isColorPickerOpen
                ? 'w-[240px] rounded-2xl h-11'
                : isMenuOpen
                  ? 'w-[230px] rounded-full h-11'
                  : 'w-[48px] h-[48px] rounded-full'
          }`}
        >



          {/* Selection Mode Content */}
          <div className={`absolute inset-0 flex items-center justify-between px-4 transition-all duration-300 ${isSelectionMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button 
              onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}
              className="p-2 bg-[#f0f0ea] dark:bg-[#333] hover:bg-[#e5e5e0] dark:hover:bg-[#444] rounded-full transition-colors flex items-center justify-center text-[#666] dark:text-[#ddd] hover:text-black dark:hover:text-white shrink-0 active:scale-95"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
            <div className="flex items-center gap-0.5">
              <button 
                onClick={toggleViewMode}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center text-[#666] dark:text-[#ddd] hover:text-black dark:hover:text-white shrink-0 active:scale-95"
                title="Toggle Layout"
              >
                {viewMode === 'list' ? <LayoutGrid size={16} strokeWidth={1.5} /> : <List size={16} strokeWidth={1.5} />}
              </button>
              {selectedIds.size === 1 && (
                <button 
                  onClick={handleRename}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center text-[#666] dark:text-[#ddd] hover:text-black dark:hover:text-white shrink-0 active:scale-95"
                >
                  <Edit3 size={16} strokeWidth={1.5} />
                </button>
              )}
              <button 
                onClick={handleDelete}
                className="p-2 rounded-full hover:bg-red-500/20 text-red-400 transition-colors flex items-center justify-center shrink-0 active:scale-95"
              >
                <Trash2 size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Default / Menu Mode Content */}
          <div className={`absolute inset-0 flex items-center justify-between px-2 transition-all duration-300 ${!isSelectionMode && !isColorPickerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {!isMenuOpen ? (
              <button 
                onClick={(e) => { createRipple(e); setIsMenuOpen(true); }}
                className="w-full h-full flex items-center justify-center active:scale-95 transition-transform ink-bleed-wrap"
                aria-label="Menu"
              >
                <LayoutGrid size={22} strokeWidth={1.5} className="text-black dark:text-white" />
                {ripples.map(ripple => (
                  <span 
                    key={ripple.id} 
                    className="ink-ripple" 
                    style={{ left: `${ripple.x}px`, top: `${ripple.y}px`, width: `${ripple.size}px`, height: `${ripple.size}px` }} 
                  />
                ))}
              </button>
            ) : (
              <div className="flex items-center w-full h-full justify-between px-1">
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 bg-[#f0f0ea] dark:bg-[#333] hover:bg-[#e5e5e0] dark:hover:bg-[#444] rounded-full transition-colors flex items-center justify-center text-[#666] dark:text-[#ddd] hover:text-black dark:hover:text-white shrink-0 active:scale-95"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
                <div className="flex items-center gap-0.5">
                  <div className="relative flex items-center bg-[#f0f0ea] dark:bg-[#333] p-1 rounded-full">
                    <div 
                      className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-[#555] rounded-full shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                        viewMode === 'list' ? 'translate-x-full' : 'translate-x-0'
                      }`}
                    />
                    <button 
                      onClick={() => toggleViewMode()}
                      className={`relative z-10 p-1.5 rounded-full transition-colors duration-300 ${viewMode === 'grid' ? 'text-black dark:text-white' : 'text-[#666] dark:text-[#999] hover:text-black dark:hover:text-white'}`}
                      title="Grid View"
                    >
                      <LayoutGrid size={16} strokeWidth={1.5} />
                    </button>
                    <button 
                      onClick={() => toggleViewMode()}
                      className={`relative z-10 p-1.5 rounded-full transition-colors duration-300 ${viewMode === 'list' ? 'text-black dark:text-white' : 'text-[#666] dark:text-[#999] hover:text-black dark:hover:text-white'}`}
                      title="List View"
                    >
                      <List size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                  <button 
                    onClick={(e) => { createRipple(e); setIsSettingsOpen(true); setIsMenuOpen(false); }}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center text-[#666] dark:text-[#ddd] hover:text-black dark:hover:text-white shrink-0 active:scale-95 relative ink-bleed-wrap"
                    title="Settings"
                  >
                    <Settings size={16} strokeWidth={1.5} />
                    {ripples.map(ripple => (
                      <span 
                        key={ripple.id} 
                        className="ink-ripple" 
                        style={{ left: ripple.x, top: ripple.y, width: ripple.size, height: ripple.size }} 
                      />
                    ))}
                  </button>
                  <button 
                    onClick={() => { setIsSelectionMode(true); setIsMenuOpen(false); }}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center text-[#666] dark:text-[#ddd] hover:text-black dark:hover:text-white shrink-0 active:scale-95"
                    title="Select Notes"
                  >
                    <CheckSquare size={16} strokeWidth={1.5} />
                  </button>
                  <button 
                    onClick={() => setShowFormatSelector(true)}
                    className="p-1.5 bg-black dark:bg-white text-white dark:text-black rounded-full hover:bg-[#333] dark:hover:bg-[#eee] transition-colors flex items-center justify-center shrink-0 active:scale-95 ml-1"
                    title="New Note"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Format Selection Overlay */}
      {showFormatSelector && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-md transition-all duration-500"
            onClick={() => setShowFormatSelector(false)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1a1a1a] rounded-[2.5rem] border border-[#e5e5e0] dark:border-[#333] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <h3 className="text-2xl font-serif text-black dark:text-white mb-2 text-center">New Document</h3>
              <p className="text-sm font-serif text-[#666] dark:text-[#999] text-center italic mb-8">Choose your creative format</p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => navigate('/editor?type=markdown')}
                  className="w-full flex items-center gap-4 p-5 bg-[#f4f4f0] dark:bg-[#252525] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all group border border-transparent hover:border-black/5 dark:hover:border-white/5"
                >
                  <div className="p-3 bg-black dark:bg-white text-white dark:text-black rounded-xl">
                    <FileText size={24} strokeWidth={1.5} />
                  </div>
                  <div className="text-left">
                    <p className="font-sans font-bold text-black dark:text-white text-sm">MD Format</p>
                    <p className="text-[11px] text-[#888] dark:text-[#666]">Standard Markdown editor</p>
                  </div>
                </button>

                <button 
                  onClick={() => navigate('/editor?type=plain')}
                  className="w-full flex items-center gap-4 p-5 bg-[#f4f4f0] dark:bg-[#252525] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all group border border-transparent hover:border-black/5 dark:hover:border-white/5"
                >
                  <div className="p-3 bg-[var(--accent-color)] text-white rounded-xl">
                    <LayoutGrid size={24} strokeWidth={1.5} />
                  </div>
                  <div className="text-left">
                    <p className="font-sans font-bold text-black dark:text-white text-sm">Plain Format</p>
                    <p className="text-[11px] text-[#888] dark:text-[#666]">Free-form canvas layout</p>
                  </div>
                </button>
              </div>

              <button 
                onClick={() => setShowFormatSelector(false)}
                className="w-full mt-8 py-3 text-xs font-sans font-bold text-[#aaa] hover:text-black dark:hover:text-white transition-colors uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;