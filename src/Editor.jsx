import { useState, useEffect, useMemo } from 'react';
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
import { Download, Save, ChevronLeft, Type, X } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import Dialog from './Dialog';

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

function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const initialContent = useMemo(() => {
    if (id) return ''; // Let useEffect handle loading existing docs
    const savedDocs = JSON.parse(localStorage.getItem('readmeMaker_docs') || '[]');
    return savedDocs.length === 0 ? DEFAULT_MARKDOWN : '';
  }, [id]);

  const [markdown, setMarkdown] = useState(initialContent);
  const [title, setTitle] = useState('');
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'code'
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
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
    ],
    content: initialContent,
    contentType: 'markdown',
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-full px-6 markdown-preview pb-40 pt-48', // Extra padding bottom for pills and top for blur header
      },
    },
    onUpdate: ({ editor }) => {
      setMarkdown(editor.getMarkdown());
    },
  });

  // Load document from localStorage if ID exists
  useEffect(() => {
    if (id && editor) {
      const savedDocs = JSON.parse(localStorage.getItem('readmeMaker_docs') || '[]');
      const doc = savedDocs.find(d => d.id === id);
      if (doc) {
        setTitle(doc.title || '');
        setMarkdown(doc.content);
        // Explicitly parse to JSON to preserve structure
        const jsonContent = editor.storage.markdown.manager.parse(doc.content);
        editor.commands.setContent(jsonContent, false);
      }
    } else if (!id && editor && initialContent !== '') {
       const jsonContent = editor.storage.markdown.manager.parse(initialContent);
       editor.commands.setContent(jsonContent, false);
    }
  }, [id, editor, initialContent]);

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
      const lines = markdown.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 0) {
        const firstLine = lines[0];
        docTitle = firstLine.replace(/^#+\\s+/, '').substring(0, 40);
        setTitle(docTitle);
      } else {
        docTitle = 'Untitled Document';
      }
    }

    if (id) {
      const updatedDocs = savedDocs.map(d => 
        d.id === id ? { ...d, title: docTitle, content: markdown, lastModified: Date.now() } : d
      );
      localStorage.setItem('readmeMaker_docs', JSON.stringify(updatedDocs));
      alert('Document saved successfully!');
    } else {
      const newId = Date.now().toString();
      const newDoc = {
        id: newId,
        title: docTitle,
        content: markdown,
        lastModified: Date.now()
      };
      savedDocs.push(newDoc);
      localStorage.setItem('readmeMaker_docs', JSON.stringify(savedDocs));
      navigate(`/editor/${newId}`);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-transparent text-[#111] overflow-hidden relative">
      
      <Dialog {...dialogConfig} onCancel={closeDialog} />

      {/* Top Blur Fade Effect */}
      <div 
        className="absolute top-0 left-0 right-0 h-28 z-20 pointer-events-none"
        style={{
           background: 'linear-gradient(to bottom, rgba(244, 244, 240, 0.95) 10%, rgba(244, 244, 240, 0) 100%)',
           backdropFilter: 'blur(8px)',
           WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
           maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
        }}
      />

      {/* Top Left Back Button and Title (Subtle) */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center gap-1 px-4 pt-5 pb-4 pointer-events-none">
        <RouterLink 
          to="/" 
          className="p-2 text-[#555] hover:text-black transition-colors pointer-events-auto"
        >
          <ChevronLeft size={28} strokeWidth={1.5} />
        </RouterLink>
        <button
          onClick={handleRename}
          className="text-[16px] font-serif font-medium text-[#444] hover:text-black transition-colors px-2 py-1 rounded-md hover:bg-[#e5e5e0] truncate max-w-[200px] pointer-events-auto"
          title="Click to rename"
        >
          {title || 'Untitled Document'}
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className={`flex-1 flex flex-col h-full absolute inset-0 transition-opacity duration-200 ${activeTab === 'editor' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <EditorContent editor={editor} className="h-full" />
          </div>
        </div>
        
        <div className={`flex-1 flex flex-col h-full absolute inset-0 transition-opacity duration-200 ${activeTab === 'code' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          <div className="pt-48 h-full flex flex-col">
            <CodeOutput markdown={markdown} setMarkdown={setMarkdown} editor={editor} />
          </div>
        </div>
      </main>

      {/* Bottom Blur Fade Effect */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[148px] z-30 pointer-events-none"
        style={{
           background: 'linear-gradient(to top, rgba(244, 244, 240, 0.95) 10%, rgba(244, 244, 240, 0) 100%)',
           backdropFilter: 'blur(8px)',
           WebkitMaskImage: 'linear-gradient(to top, black 50%, transparent 100%)',
           maskImage: 'linear-gradient(to top, black 50%, transparent 100%)'
        }}
      />

      {/* Dynamic Expanding Bottom Capsule (Notch Nook Style) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
        
        <div 
          className={`bg-[#1a1a1a] text-white shadow-2xl shadow-black/30 border border-[#333] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden ${
            isToolbarExpanded 
              ? 'w-[94vw] max-w-3xl rounded-2xl h-14' 
              : 'w-[260px] rounded-full h-[52px]'
          }`}
        >
          
          {/* --- Basic Capsule View --- */}
          <div 
            className={`absolute inset-0 flex items-center justify-center gap-1 px-3 transition-all duration-400 ${
              isToolbarExpanded ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100 delay-100'
            }`}
          >
            <button 
              onClick={handleSave}
              className="p-2 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-[#ddd] hover:text-white shrink-0"
              aria-label="Save"
            >
              <Save size={18} strokeWidth={1.5} />
            </button>

            <div className="relative mx-1 bg-[#333] p-1 rounded-full flex items-center text-[13px] font-sans font-medium shrink-0">
              {/* Sliding Background Pill */}
              <div 
                className={`absolute top-1 bottom-1 w-[60px] bg-white rounded-full shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                  activeTab === 'editor' ? 'translate-x-0' : 'translate-x-[60px]'
                }`}
              />
              
              <button
                onClick={() => setActiveTab('editor')}
                className={`relative z-10 w-[60px] py-1 text-center rounded-full transition-colors duration-300 ${activeTab === 'editor' ? 'text-black' : 'text-[#aaa] hover:text-white'}`}
              >
                Read
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`relative z-10 w-[60px] py-1 text-center rounded-full transition-colors duration-300 ${activeTab === 'code' ? 'text-black' : 'text-[#aaa] hover:text-white'}`}
              >
                Code
              </button>
            </div>

            <button 
              onClick={handleDownload}
              className="p-2 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-[#ddd] hover:text-white shrink-0"
              aria-label="Download"
            >
              <Download size={18} strokeWidth={1.5} />
            </button>

            <button 
              onClick={() => setIsToolbarExpanded(true)}
              className="p-2 ml-0.5 rounded-full hover:bg-[#333] transition-colors flex items-center justify-center text-white shrink-0"
              aria-label="Formatting Tools"
            >
              <Type size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* --- Expanded Nook View (Formatting Tools) --- */}
          <div 
            className={`absolute inset-0 flex items-center w-full px-1 transition-all duration-400 ${
              isToolbarExpanded ? 'opacity-100 scale-100 delay-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
          >
            <div className="flex-1 overflow-hidden flex items-center h-full">
              <Toolbar editor={editor} />
            </div>
            <button 
              onClick={() => setIsToolbarExpanded(false)}
              className="p-2 ml-1 mr-2 bg-[#333] hover:bg-[#444] rounded-full transition-colors flex items-center justify-center text-[#ddd] hover:text-white shrink-0 active:scale-95"
              aria-label="Collapse Tools"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Editor;
