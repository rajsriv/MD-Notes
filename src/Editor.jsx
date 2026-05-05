import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Toolbar from './Toolbar';
import CodeOutput from './CodeOutput';
import { Save, ChevronLeft, Type, X, Sun, Moon, Copy, Check, Palette, BookOpen, Eye, EyeOff, Sigma } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import Dialog from './Dialog';
import { Node, InputRule, mergeAttributes, PasteRule } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import katex from 'katex';
import 'katex/dist/katex.min.css';
const Mathematics = Node.create({
  name: 'mathematics',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      latex: { default: '' },
      display: { default: false },
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize: (state, node) => {
          if (node.attrs.display) {
            state.write(`\n\n$$\n${node.attrs.latex}\n$$\n\n`);
          } else {
            state.write(`$${node.attrs.latex}$`);
          }
        },
        parse: {
          setup: (markdownit) => {
            // Optional: configure markdown-it if needed
          },
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-latex]',
        getAttrs: (el) => ({ latex: el.getAttribute('data-latex'), display: false }),
      },
      {
        tag: 'div[data-latex]',
        getAttrs: (el) => ({ latex: el.getAttribute('data-latex'), display: true }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    if (node.attrs.display) {
      return ['div', mergeAttributes(HTMLAttributes, { 
        'data-latex': node.attrs.latex,
        class: 'math-node math-block-node' 
      })];
    }
    return ['span', mergeAttributes(HTMLAttributes, { 
      'data-latex': node.attrs.latex,
      class: 'math-node math-inline-node'
    })];
  },

  addInputRules() {
    return [
      new InputRule({
        find: /\$\$([^$]+)\$\$$/,
        handler: ({ state, range, match }) => {
          const start = range.from;
          const end = range.to;
          const latex = match[1];
          state.tr.replaceWith(start, end, this.type.create({ latex, display: true }));
        },
      }),
      new InputRule({
        find: /\$([^$]+)\$$/,
        handler: ({ state, range, match }) => {
          const start = range.from;
          const end = range.to;
          const latex = match[1];
          state.tr.replaceWith(start, end, this.type.create({ latex, display: false }));
        },
      }),
    ];
  },

  addPasteRules() {
    return [
      new PasteRule({
        find: /\$\$([\s\S]+?)\$\$/g,
        type: this.type,
        getAttributes: match => ({ latex: match[1], display: true }),
      }),
      new PasteRule({
        find: /\$([^$]+)\$/g,
        type: this.type,
        getAttributes: match => ({ latex: match[1], display: false }),
      }),
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('math-auto-parse'),
        appendTransaction: (transactions, oldState, newState) => {
          if (!transactions.some(tr => tr.docChanged)) return;
          
          let tr = newState.tr;
          let modified = false;

          // Collect all matches first to avoid position issues during replacement
          const matches = [];
          newState.doc.descendants((node, pos) => {
            if (node.isText) {
              const text = node.text;
              const regex = /\$\$([\s\S]+?)\$\$|\$([^$]+)\$/g;
              let match;
              while ((match = regex.exec(text)) !== null) {
                const isBlock = !!match[1];
                const latex = (match[1] || match[2]).trim();
                matches.push({
                  start: pos + match.index,
                  end: pos + match.index + match[0].length,
                  latex,
                  display: isBlock
                });
              }
            }
          });

          // Apply replacements from back to front
          for (let i = matches.length - 1; i >= 0; i--) {
            const { start, end, latex, display } = matches[i];
            tr.replaceWith(start, end, this.type.create({ latex, display }));
            modified = true;
          }

          return modified ? tr : null;
        },
      }),
    ];
  },

  addNodeView() {
    return ({ node, getPos }) => {
      const dom = document.createElement(node.attrs.display ? 'div' : 'span');
      dom.className = node.attrs.display ? 'math-node math-block-node' : 'math-node math-inline-node';
      
      const render = () => {
        try {
          katex.render(node.attrs.latex || '...', dom, {
            displayMode: node.attrs.display,
            throwOnError: false,
          });
        } catch (e) {
          dom.textContent = node.attrs.latex;
        }
      };
      
      render();
      return { 
        dom,
        update: (newNode) => {
          if (newNode.type.name !== this.name) return false;
          if (newNode.attrs.latex !== node.attrs.latex || newNode.attrs.display !== node.attrs.display) {
            node = newNode;
            render();
          }
          return true;
        }
      };
    };
  },
});

const DEFAULT_MARKDOWN = `# Welcome to MD-Notes ✨
A beautifully crafted, **distraction-free** Markdown workspace for your thoughts, ideas, and code snippets.
## Features
- 🚀 **Visual Editing**: Write your notes naturally, just like in Word or Notion.
- 🎨 **Premium Reading**: Designed for a seamless, minimalist e-book reading aesthetic.
- 🛠️ **Formatting Tools**: Tap the 'Aa' button to reveal the floating Notch Nook toolbar.
- 📥 **Export**: Download your raw \`.md\` notes in one click.
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
function Editor({ currentTheme, onToggleTheme, globalAccent, onUpdateAccent, globalTextSize, onUpdateTextSize }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const initialContent = useMemo(() => {
    if (id) return '';
    const savedDocs = JSON.parse(localStorage.getItem('readmeMaker_docs') || '[]');
    return savedDocs.length === 0 ? DEFAULT_MARKDOWN : '';
  }, [id]);
  const [markdown, setMarkdown] = useState(initialContent);
  const [title, setTitle] = useState('');
  const [activeTab, setActiveTab] = useState('editor');
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    ],
    content: initialContent,
    contentType: 'markdown',
    editorProps: {
      class: 'focus:outline-none min-h-full px-6 markdown-preview pb-40 pt-0',
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
    if (id && editor) {
      const savedDocs = JSON.parse(localStorage.getItem('readmeMaker_docs') || '[]');
      const doc = savedDocs.find(d => d.id === id);
      if (doc) {
        setTitle(doc.title || '');
        setMarkdown(doc.content || '');
        setNoteAccent(doc.accentColor || null);
        const jsonContent = editor.storage.markdown.manager.parse(doc.content || '');
        editor.commands.setContent(jsonContent, false);
      }
    } else if (!id && editor && initialContent !== '') {
      const jsonContent = editor.storage.markdown.manager.parse(initialContent);
      editor.commands.setContent(jsonContent, false);
    }
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
            const savedDocs = JSON.parse(localStorage.getItem('readmeMaker_docs') || '[]');
            const updatedDocs = savedDocs.map(d =>
              d.id === id ? { ...d, title: finalTitle, lastModified: Date.now() } : d
            );
            localStorage.setItem('readmeMaker_docs', JSON.stringify(updatedDocs));
          }
        }
      }
    });
  };
  const handleSave = () => {
    const savedDocs = JSON.parse(localStorage.getItem('readmeMaker_docs') || '[]');
    let docTitle = title;
    if (!docTitle || docTitle === 'Untitled Document') {
      const lines = markdown.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 0) {
        const firstLine = lines[0];
        docTitle = firstLine.replace(/^#+\s+/, '').substring(0, 40);
        setTitle(docTitle);
      } else {
        docTitle = 'Untitled Document';
      }
    }
    if (id) {
      const updatedDocs = savedDocs.map(d =>
        d.id === id ? { ...d, title: docTitle, content: markdown, lastModified: Date.now(), accentColor: noteAccent } : d
      );
      localStorage.setItem('readmeMaker_docs', JSON.stringify(updatedDocs));
      alert('Document saved successfully!');
    } else {
      const newId = Date.now().toString();
      const newDoc = {
        id: newId,
        title: docTitle,
        content: markdown,
        lastModified: Date.now(),
        accentColor: noteAccent
      };
      savedDocs.push(newDoc);
      localStorage.setItem('readmeMaker_docs', JSON.stringify(savedDocs));
      navigate(`/editor/${newId}`);
    }
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

  const handleUpdateNoteAccent = (color) => {
    setNoteAccent(color);
    if (id) {
      const savedDocs = JSON.parse(localStorage.getItem('readmeMaker_docs') || '[]');
      const updatedDocs = savedDocs.map(d => 
        d.id === id ? { ...d, accentColor: color } : d
      );
      localStorage.setItem('readmeMaker_docs', JSON.stringify(updatedDocs));
    }
    setIsColorPickerOpen(false);
  };
  return (
    <div className="h-screen w-full flex flex-col bg-[var(--bg-color)] transition-colors duration-300 text-[#111] dark:text-[#eee] overflow-hidden relative selection:bg-[var(--accent-color)]/20">
      <Dialog {...dialogConfig} onCancel={closeDialog} />
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
          <ChevronLeft size={28} strokeWidth={1.5} />
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
        <div className={`flex-1 flex flex-col h-full absolute inset-0 transition-opacity duration-200 ${activeTab === 'editor' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          <main className="flex-1 overflow-auto px-6 z-10 no-scrollbar pb-52 pt-20 max-w-2xl mx-auto w-full">
            <div className="markdown-preview focus:outline-none">
              <EditorContent editor={editor} />
            </div>
          </main>
        </div>
        <div className={`flex-1 flex flex-col h-full absolute inset-0 transition-opacity duration-200 ${activeTab === 'code' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          <div className="pt-20 pb-52 h-full flex flex-col px-4">
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
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
        <div
          className={`bg-white dark:bg-[#1a1a1a] text-black dark:text-white shadow-2xl shadow-black/10 dark:shadow-black/40 border border-[#e5e5e0] dark:border-[#333] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden ${isToolbarExpanded
            ? 'w-[94vw] max-w-3xl rounded-2xl h-14'
            : isColorPickerOpen
              ? 'w-[280px] rounded-2xl h-14'
              : 'w-[360px] rounded-full h-[54px]'
            }`}
        >
          {/* Color Picker Content */}
          <div className={`absolute inset-0 flex items-center justify-center gap-3 px-4 transition-all duration-300 ${isColorPickerOpen && !isToolbarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button onClick={() => setIsColorPickerOpen(false)} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full">
              <X size={16} />
            </button>
            <div className="flex gap-2.5">
              {ACCENT_COLORS.map(color => (
                <button
                  key={color.name}
                  onClick={() => handleUpdateNoteAccent(color.color)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 ${(noteAccent || globalAccent) === color.color ? 'border-black dark:border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: color.color }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div
            className={`absolute inset-0 flex items-center justify-between px-3 transition-all duration-400 ${isToolbarExpanded || isColorPickerOpen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100 delay-100'
              }`}
          >
            <div className="relative flex items-center bg-[#f0f0ea] dark:bg-[#252525] p-1 rounded-full">
              <div 
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-[#333] rounded-full shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                  activeTab === 'code' ? 'translate-x-full' : 'translate-x-0'
                }`}
                style={{ width: isReadingMode ? '100%' : 'calc(50% - 4px)' }}
              />
              <button
                onClick={() => setActiveTab('editor')}
                className={`relative z-10 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-300 ${activeTab === 'editor' ? 'text-black dark:text-white' : 'text-[#666] dark:text-[#999] hover:text-black dark:hover:text-white'}`}
              >
                Read
              </button>
              {!isReadingMode && (
                <button
                  onClick={() => setActiveTab('code')}
                  className={`relative z-10 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-300 ${activeTab === 'code' ? 'text-black dark:text-white' : 'text-[#666] dark:text-[#999] hover:text-black dark:hover:text-white'}`}
                >
                  Code
                </button>
              )}
            </div>
            {currentTheme === 'light' && (
              <button
                onClick={() => setIsColorPickerOpen(true)}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center text-[#666] dark:text-[#ddd] hover:text-black dark:hover:text-white shrink-0"
                title="Note Accent"
              >
                <Palette size={18} strokeWidth={1.5} />
              </button>
            )}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center text-[#666] dark:text-[#ddd] hover:text-black dark:hover:text-white shrink-0"
              title="Toggle Theme"
            >
              {currentTheme === 'light' ? <Moon size={18} strokeWidth={1.5} /> : <Sun size={18} strokeWidth={1.5} />}
            </button>
            <button
              onClick={handleCopy}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center text-[#666] dark:text-[#ddd] hover:text-black dark:hover:text-white shrink-0"
              title="Copy Markdown"
            >
              {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} strokeWidth={1.5} />}
            </button>
            <button
              onClick={() => setIsToolbarExpanded(true)}
              className="p-2 ml-0.5 rounded-full hover:bg-[#f0f0ea] dark:hover:bg-[#333] transition-colors flex items-center justify-center text-black dark:text-white shrink-0"
              aria-label="Formatting Tools"
            >
              <Type size={18} strokeWidth={1.5} />
            </button>
          </div>
          <div
            className={`absolute inset-0 flex items-center w-full px-1 transition-all duration-400 ${isToolbarExpanded ? 'opacity-100 scale-100 delay-100' : 'opacity-0 scale-105 pointer-events-none'
              }`}
          >
            <div className="flex-1 overflow-hidden flex items-center h-full">
              <Toolbar
                editor={editor}
                setExternalDialog={setDialogConfig}
                closeExternalDialog={closeDialog}
                globalTextSize={globalTextSize}
                onUpdateTextSize={onUpdateTextSize}
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