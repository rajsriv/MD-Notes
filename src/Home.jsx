import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus, ChevronRight, CheckCircle2, Circle, X, Trash2, Download, Edit3, LayoutGrid, List, CheckSquare, Sun, Moon } from 'lucide-react';
import Dialog from './Dialog';
import Onboarding from './Onboarding';
function Home() {
  const [docs, setDocs] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false });
  const [viewMode, setViewMode] = useState(localStorage.getItem('readmeMaker_viewMode') || 'list');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('mdnotes_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mdnotes_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));
  const toggleViewMode = () => {
    const newMode = viewMode === 'list' ? 'grid' : 'list';
    setViewMode(newMode);
    localStorage.setItem('readmeMaker_viewMode', newMode);
  };
  const stripMarkdown = (md) => {
    if (!md) return '';
    return md
      .replace(/[#*`_~>\[\]\(\)-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };
  useEffect(() => {
    loadDocs();
    const hasOnboarded = localStorage.getItem('mdnotes_onboarded');
    if (!hasOnboarded) {
      setShowOnboarding(true);
    }
  }, []);
  const handleOnboardingComplete = () => {
    localStorage.setItem('mdnotes_onboarded', 'true');
    setShowOnboarding(false);
  };
  const loadDocs = () => {
    const savedDocs = JSON.parse(localStorage.getItem('readmeMaker_docs') || '[]');
    savedDocs.sort((a, b) => b.lastModified - a.lastModified);
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
      onConfirm: () => {
        const newDocs = docs.filter(d => !selectedIds.has(d.id));
        localStorage.setItem('readmeMaker_docs', JSON.stringify(newDocs));
        setDocs(newDocs);
        setIsSelectionMode(false);
        setSelectedIds(new Set());
      }
    });
  };
  const handleDownload = () => {
    selectedIds.forEach(id => {
      const doc = docs.find(d => d.id === id);
      if (doc) {
        const blob = new Blob([doc.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.title || 'Untitled'}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
    setIsSelectionMode(false);
    setSelectedIds(new Set());
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
        onConfirm: (newTitle) => {
          if (newTitle !== null && newTitle.trim() !== '') {
            const updatedDocs = docs.map(d => d.id === id ? { ...d, title: newTitle.trim(), lastModified: Date.now() } : d);
            localStorage.setItem('readmeMaker_docs', JSON.stringify(updatedDocs));
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

  return (
    <div className="h-screen w-full flex flex-col relative overflow-hidden bg-transparent">
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      <Dialog {...dialogConfig} onCancel={closeDialog} />
      
      <div 
        className="absolute top-0 left-0 right-0 h-[280px] z-20 pointer-events-none transition-colors duration-300"
        style={{
           background: 'linear-gradient(to bottom, var(--bg-color) 241px, transparent 100%)',
           backdropFilter: 'blur(12px)',
           WebkitMaskImage: 'linear-gradient(to bottom, black 241px, transparent 100%)',
           maskImage: 'linear-gradient(to bottom, black 241px, transparent 100%)'
        }}
      />
      
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <header className="pt-16 pb-4 px-8 flex flex-col items-start max-w-2xl mx-auto w-full pointer-events-auto">
          <h1 className="text-4xl font-serif text-black dark:text-white mb-2 tracking-tight">
            MD-Notes
          </h1>
          <p className="text-[16px] font-serif text-[#666] dark:text-[#999] italic text-left max-w-[280px] leading-relaxed mb-8">
            Craft perfect Markdown documentation right from your device.
          </p>
          {docs.length > 0 && (
            <h2 className="text-xs font-sans font-semibold text-[#888] dark:text-[#666] uppercase tracking-widest px-2">What went down in History?</h2>
          )}
        </header>
      </div>
      
      <main className="flex-1 overflow-auto px-6 z-10 no-scrollbar pb-32 pt-[290px] max-w-2xl mx-auto w-full">
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
                      className={`break-inside-avoid mb-3 relative flex flex-col border border-[#e5e5e0] dark:border-[#333] rounded-2xl overflow-hidden transition-colors cursor-pointer select-none ${isSelected ? 'bg-[#ebebe5] dark:bg-[#252525] border-[#999] dark:border-[#555]' : 'bg-[#fcfcfc] dark:bg-[#1a1a1a] active:bg-[#ebebe5] dark:active:bg-[#252525]'}`}
                    >
                      <div className="p-3.5 pointer-events-none">
                        <p className="text-[12.5px] font-serif leading-[1.6] text-[#555] dark:text-[#aaa] break-words line-clamp-5">
                          {stripMarkdown(doc.content) || 'Empty document'}
                        </p>
                      </div>
                      <div className="flex-shrink-0 bg-white dark:bg-[#222] border-t border-[#f0f0ea] dark:border-[#333] p-3 pointer-events-none flex items-center justify-between">
                        <div className="flex-1 overflow-hidden pr-2">
                          <h3 className="text-[13px] font-serif font-medium text-[#111] dark:text-[#eee] mb-0.5 truncate">
                            {doc.title || 'Untitled Document'}
                          </h3>
                          <p className="text-[10px] font-sans text-[#777] dark:text-[#555]">
                            {new Date(doc.lastModified).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        {isSelectionMode && (
                          isSelected ? <CheckCircle2 size={16} className="text-black flex-shrink-0" /> : <Circle size={16} className="text-[#ccc] flex-shrink-0" />
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
                    className={`flex items-center justify-between py-5 px-2 border-b border-[#e5e5e0] dark:border-[#333] transition-colors cursor-pointer select-none ${isSelected ? 'bg-[#ebebe5] dark:bg-[#252525]' : 'active:bg-[#ebebe5] dark:active:bg-[#252525]'}`}
                  >
                    <div className="flex-1 overflow-hidden pr-4 pointer-events-none">
                      <h3 className="text-[17px] font-serif text-[#111] dark:text-[#eee] mb-1 truncate">
                        {doc.title || 'Untitled Document'}
                      </h3>
                      <p className="text-[13px] font-sans text-[#777] dark:text-[#555]">
                        {new Date(doc.lastModified).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    {isSelectionMode ? (
                      isSelected ? <CheckCircle2 size={20} className="text-black flex-shrink-0" /> : <Circle size={20} className="text-[#ccc] flex-shrink-0" />
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

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
        <div 
          className={`bg-[#1a1a1a] text-white shadow-2xl shadow-black/30 border border-[#333] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden ${
            isSelectionMode 
              ? 'w-[300px] h-[56px] rounded-[28px] px-3 gap-2' 
              : isMenuOpen
                ? 'w-[300px] h-[56px] rounded-[28px] px-3'
                : 'w-[52px] h-[52px] rounded-full'
          }`}
        >
          {isSelectionMode ? (
            <div className="flex items-center w-full h-full justify-between fade-in px-1">
              <button 
                onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}
                className="p-2.5 bg-[#333] hover:bg-[#444] rounded-full transition-colors flex items-center justify-center text-[#ddd] hover:text-white shrink-0 active:scale-95"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
              <div className="flex items-center gap-1">
                <button 
                  onClick={toggleViewMode}
                  className="p-2.5 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-[#ddd] hover:text-white shrink-0 active:scale-95"
                  title="Toggle Layout"
                >
                  {viewMode === 'list' ? <LayoutGrid size={18} strokeWidth={1.5} /> : <List size={18} strokeWidth={1.5} />}
                </button>
                {selectedIds.size === 1 && (
                  <button 
                    onClick={handleRename}
                    className="p-2.5 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-[#ddd] hover:text-white shrink-0 active:scale-95"
                  >
                    <Edit3 size={18} strokeWidth={1.5} />
                  </button>
                )}
                <button 
                  onClick={handleDownload}
                  className="p-2.5 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-[#ddd] hover:text-white shrink-0 active:scale-95"
                >
                  <Download size={18} strokeWidth={1.5} />
                </button>
                <button 
                  onClick={handleDelete}
                  className="p-2.5 rounded-full hover:bg-red-500/20 text-red-400 transition-colors flex items-center justify-center shrink-0 active:scale-95"
                >
                  <Trash2 size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ) : !isMenuOpen ? (
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="w-full h-full flex items-center justify-center active:scale-90 transition-transform"
              aria-label="Menu"
            >
              <LayoutGrid size={24} strokeWidth={1.5} className="text-white" />
            </button>
          ) : (
            <div className="flex items-center w-full h-full justify-between fade-in px-1">
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2.5 bg-[#333] hover:bg-[#444] rounded-full transition-colors flex items-center justify-center text-[#ddd] hover:text-white shrink-0 active:scale-95"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
              <div className="flex items-center gap-1">
                <button 
                  onClick={toggleViewMode}
                  className="p-2.5 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-[#ddd] hover:text-white shrink-0 active:scale-95"
                  title="Toggle Layout"
                >
                  {viewMode === 'list' ? <LayoutGrid size={18} strokeWidth={1.5} /> : <List size={18} strokeWidth={1.5} />}
                </button>
                <button 
                  onClick={toggleTheme}
                  className="p-2.5 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-[#ddd] hover:text-white shrink-0 active:scale-95"
                  title="Toggle Theme"
                >
                  {theme === 'light' ? <Moon size={18} strokeWidth={1.5} /> : <Sun size={18} strokeWidth={1.5} />}
                </button>
                <button 
                  onClick={() => { setIsSelectionMode(true); setIsMenuOpen(false); }}
                  className="p-2.5 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-[#ddd] hover:text-white shrink-0 active:scale-95"
                  title="Select Notes"
                >
                  <CheckSquare size={18} strokeWidth={1.5} />
                </button>
                <Link 
                  to="/editor"
                  className="p-2.5 bg-white text-black rounded-full hover:bg-[#eee] transition-colors flex items-center justify-center shrink-0 active:scale-95 ml-1"
                  title="New Note"
                >
                  <Plus size={20} strokeWidth={2.5} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;