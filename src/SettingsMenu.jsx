import React from 'react';
import { X, Sun, Moon, Palette, Zap, Layers, Eye, Move, BarChart, Droplets, Type } from 'lucide-react';

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

      <div className="flex-1 overflow-y-auto px-6 pb-12 no-scrollbar">
        {/* Appearance Section */}
        <section className="mb-8">
          <h3 className="text-[11px] font-sans font-semibold text-[#888] uppercase tracking-widest mb-4">Appearance</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white dark:bg-[#1a1a1a] p-4 rounded-2xl border border-[#e5e5e0] dark:border-[#333]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black/5 dark:bg-white/5 rounded-xl">
                  {currentTheme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
                </div>
                <div>
                  <p className="text-sm font-medium">Theme Mode</p>
                  <p className="text-[12px] text-[#888]">{currentTheme === 'light' ? 'Light' : 'Dark'} mode active</p>
                </div>
              </div>
              <button 
                onClick={onToggleTheme}
                className="px-4 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-full text-xs font-medium active:scale-95 transition-all"
              >
                Switch
              </button>
            </div>

            <div className="flex flex-col bg-white dark:bg-[#1a1a1a] p-4 rounded-2xl border border-[#e5e5e0] dark:border-[#333]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-black/5 dark:bg-white/5 rounded-xl text-[var(--accent-color)]">
                  <Palette size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium">Accent Color</p>
                  <p className="text-[12px] text-[#888]">Personalize your workspace</p>
                </div>
              </div>
              <div className="flex justify-between px-1">
                {ACCENT_COLORS.map(color => (
                  <button
                    key={color.name}
                    onClick={() => onUpdateAccent(color.color)}
                    className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 active:scale-90 ${globalAccent === color.color ? 'border-black dark:border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    style={{ backgroundColor: color.color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Writing Style Section */}
        <section className="mb-8">
          <h3 className="text-[11px] font-sans font-semibold text-[#888] uppercase tracking-widest mb-4">Writing Experience</h3>
          <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-2xl border border-[#e5e5e0] dark:border-[#333]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-black/5 dark:bg-white/5 rounded-xl text-[#666] dark:text-[#aaa]">
                <Type size={18} />
              </div>
              <div>
                <p className="text-sm font-medium">Caret Style</p>
                <p className="text-[11px] text-[#888]">Customize your typing cursor</p>
              </div>
            </div>
            <div className="flex bg-[#f0f0ea] dark:bg-[#252525] p-1 rounded-xl">
              {['line', 'block', 'underscore'].map(type => (
                <button
                  key={type}
                  onClick={() => onUpdatePreference('caretType', type)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all capitalize ${preferences.caretType === type ? 'bg-white dark:bg-[#444] text-black dark:text-white shadow-sm' : 'text-[#666] dark:text-[#999]'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Animations Section */}
        <section>
          <h3 className="text-[11px] font-sans font-semibold text-[#888] uppercase tracking-widest mb-4">Motion & Experience</h3>
          
          <div className="space-y-3">
            {[
              { id: 'staggeredEntry', label: 'Staggered Entry', icon: <Layers size={18} />, desc: 'Note cards slide in one by one' },
              { id: 'paperSlide', label: 'Paper Slide', icon: <Move size={18} />, desc: 'Smooth horizontal page transitions' },
              { id: 'focusBlur', label: 'Focus Blur', icon: <Eye size={18} />, desc: 'Subtle blur on non-active lines' },
              { id: 'elasticMorph', label: 'Elastic Morph', icon: <Zap size={18} />, desc: 'Bouncy toolbar transitions' },
              { id: 'scrollProgress', label: 'Scroll Progress', icon: <BarChart size={18} />, desc: 'Reading progress indicator' },
              { id: 'inkBleed', label: 'Ink Bleed', icon: <Droplets size={18} />, desc: 'Liquid-like button ripples' },
            ].map(item => (
              <div key={item.id} className="flex items-center justify-between bg-white dark:bg-[#1a1a1a] p-4 rounded-2xl border border-[#e5e5e0] dark:border-[#333]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-black/5 dark:bg-white/5 rounded-xl text-[#666] dark:text-[#aaa]">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-[11px] text-[#888]">{item.desc}</p>
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
      </div>
    </div>
  );
}

export default SettingsMenu;
