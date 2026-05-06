import React, { useState, useEffect, useRef } from 'react';
import { X, Sun, Moon, Palette, Zap, Layers, Eye, Move, BarChart, Droplets, Type, ChevronRight, Github } from 'lucide-react';
import db from './db';

const ACCENT_COLORS = [
  { name: 'Slate', color: '#000000' },
  { name: 'Rose', color: '#e11d48' },
  { name: 'Amber', color: '#d97706' },
  { name: 'Emerald', color: '#059669' },
  { name: 'Blue', color: '#2563eb' },
  { name: 'Violet', color: '#7c3aed' },
];

function SettingsMenu({ 
  isOpen, 
  onClose, 
  currentTheme, 
  onToggleTheme, 
  globalAccent, 
  onUpdateAccent, 
  preferences, 
  onUpdatePreference 
}) {
  const [storageSize, setStorageSize] = useState('Calculating...');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      updateStorageSize();
    }
  }, [isOpen]);

  const updateStorageSize = async () => {
    const size = await db.getDatabaseSize();
    setStorageSize(size);
  };

  const handleExport = async () => {
    const data = await db.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mdnotes-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const success = await db.importData(event.target.result);
      if (success) {
        alert('Backup restored successfully! The app will now reload.');
        window.location.reload();
      } else {
        alert('Failed to restore backup. Please ensure the file is a valid MD-Notes backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    if (window.confirm('ARE YOU SURE? This will permanently delete all your notes and reset all settings. This action cannot be undone.')) {
      await db.resetDatabase();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-[var(--bg-color)] z-50 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <h2 className="text-xl font-serif font-bold text-black dark:text-white">Settings</h2>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-1 pb-12 no-scrollbar">
        {/* Appearance Section */}
        <section className="mb-8 mt-2">
          <h3 className="text-[11px] font-sans font-semibold text-[#888] uppercase tracking-widest mb-2 px-5">Appearance</h3>
          
          <div className="flex flex-col">
            <div className="flex items-center justify-between py-5 px-5 border-b border-[#e5e5e0] dark:border-[#333]">
              <div className="flex items-center gap-4">
                <div className="text-[#666] dark:text-[#999]">
                  {currentTheme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                </div>
                <div>
                  <p className="text-[16px] font-medium text-black dark:text-[#eee]">Theme Mode</p>
                  <p className="text-[13px] text-[#888]">{currentTheme === 'light' ? 'Light' : 'Dark'} mode active</p>
                </div>
              </div>
              <button 
                onClick={onToggleTheme}
                className="px-4 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-full text-xs font-medium active:scale-95 transition-all shadow-sm"
              >
                Switch
              </button>
            </div>

            <div className="flex flex-col py-5 px-5 border-b border-[#e5e5e0] dark:border-[#333]">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-[var(--accent-color)]">
                  <Palette size={20} />
                </div>
                <div>
                  <p className="text-[16px] font-medium text-black dark:text-[#eee]">Accent Color</p>
                  <p className="text-[13px] text-[#888]">Personalize your workspace</p>
                </div>
              </div>
              <div className="flex justify-between items-center pr-2">
                {ACCENT_COLORS.map(color => (
                  <button
                    key={color.name}
                    onClick={() => onUpdateAccent(color.color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 active:scale-90 ${globalAccent === color.color ? 'border-black dark:border-white scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    style={{ backgroundColor: color.color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Data & Storage Section */}
        <section className="mb-8">
          <h3 className="text-[11px] font-sans font-semibold text-[#888] uppercase tracking-widest mb-2 px-5">Data & Storage</h3>
          
          <div className="flex flex-col">
            <div className="flex items-center justify-between py-5 px-5 border-b border-[#e5e5e0] dark:border-[#333]">
              <div className="flex items-center gap-4">
                <div className="text-[#666] dark:text-[#999]">
                  <BarChart size={20} />
                </div>
                <div>
                  <p className="text-[16px] font-medium text-black dark:text-[#eee]">Storage Used</p>
                  <p className="text-[13px] text-[#888]">{storageSize}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-5 px-5 border-b border-[#e5e5e0] dark:border-[#333]">
              <div className="flex items-center gap-4">
                <div className="text-blue-500">
                  <Zap size={20} />
                </div>
                <p className="text-[16px] font-medium text-black dark:text-[#eee]">Export Backup</p>
              </div>
              <button 
                onClick={handleExport}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronRight size={20} className="text-[#ccc]" />
              </button>
            </div>

            <div className="flex items-center justify-between py-5 px-5 border-b border-[#e5e5e0] dark:border-[#333]">
              <div className="flex items-center gap-4">
                <div className="text-emerald-500">
                  <Layers size={20} />
                </div>
                <p className="text-[16px] font-medium text-black dark:text-[#eee]">Import Backup</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".json" 
                  onChange={handleImport}
                />
              </div>
              <button 
                onClick={() => fileInputRef.current.click()}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronRight size={20} className="text-[#ccc]" />
              </button>
            </div>

            <div className="flex items-center justify-between py-5 px-5 border-b border-[#e5e5e0] dark:border-[#333]">
              <div className="flex items-center gap-4">
                <div className="text-red-500">
                  <X size={20} />
                </div>
                <p className="text-[16px] font-medium text-red-500">Reset All Data</p>
              </div>
              <button 
                onClick={handleReset}
                className="px-4 py-1.5 bg-red-500/10 text-red-500 rounded-full text-xs font-semibold hover:bg-red-500/20 active:scale-95 transition-all"
              >
                Clear
              </button>
            </div>
          </div>
        </section>

        {/* Animations Section */}
        <section>
          <h3 className="text-[11px] font-sans font-semibold text-[#888] uppercase tracking-widest mb-2 px-5">Motion & Experience</h3>
          
          <div className="flex flex-col">
            {[
              { id: 'staggeredEntry', label: 'Staggered Entry', icon: <Layers size={18} />, desc: 'Note cards slide in one by one' },
              { id: 'paperSlide', label: 'Paper Slide', icon: <Move size={18} />, desc: 'Smooth horizontal page transitions' },
              { id: 'focusBlur', label: 'Focus Blur', icon: <Eye size={18} />, desc: 'Subtle blur on non-active lines' },
              { id: 'elasticMorph', label: 'Elastic Morph', icon: <Zap size={18} />, desc: 'Bouncy toolbar transitions' },
              { id: 'scrollProgress', label: 'Scroll Progress', icon: <BarChart size={18} />, desc: 'Reading progress indicator' },
              { id: 'inkBleed', label: 'Ink Bleed', icon: <Droplets size={18} />, desc: 'Liquid-like button ripples' },
            ].map(item => (
              <div key={item.id} className="flex items-center justify-between py-5 px-5 border-b border-[#e5e5e0] dark:border-[#333]">
                <div className="flex items-center gap-4">
                  <div className="text-[#666] dark:text-[#999]">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[16px] font-medium text-black dark:text-[#eee]">{item.label}</p>
                    <p className="text-[13px] text-[#888]">{item.desc}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onUpdatePreference(item.id, !preferences[item.id])}
                  className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${preferences[item.id] ? 'bg-[var(--accent-color)]' : 'bg-gray-200 dark:bg-gray-800'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${preferences[item.id] ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* About Section */}
        <section className="mt-8 mb-4">
          <h3 className="text-[11px] font-sans font-semibold text-[#888] uppercase tracking-widest mb-2 px-5">About</h3>
          
          <div className="flex flex-col">
            <div className="flex items-center justify-between py-8 px-5">
              <div className="flex flex-col gap-1">
                <p className="text-[17px] font-serif text-black dark:text-[#eee]">MD-Notes v2.0</p>
                <p className="text-[13px] text-[#888] italic">Crafted with care by Raj Sriv</p>
              </div>
              <a 
                href="https://github.com/rajsriv" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full text-xs font-bold active:scale-95 transition-all shadow-lg shadow-black/10"
              >
                <Github size={16} />
                GitHub
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SettingsMenu;
