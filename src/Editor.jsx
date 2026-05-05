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
import { Save, ChevronLeft, Type, X, Sun, Moon, Copy, Check } from 'lucide-react';
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
function Editor({ currentTheme, onToggleTheme }) {
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
  const [copied, setCopied] = useState(false);
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
      class: 'focus:outline-none min-h-full px-6 markdown-preview pb-40 pt-0',
    },
    onUpdate: ({ editor }) => {
      setMarkdown(editor.getMarkdown());
    },
  });
  useEffect(() => {
    if (id && editor) {
      const savedDocs = JSON.parse(localStorage.getItem('readmeMaker_docs') || '[]');
      const doc = savedDocs.find(d => d.id === id);
      if (doc) {
        setTitle(doc.title || '');
        setMarkdown(doc.content);
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
  return (
    <div className="h-screen w-full flex flex-col bg-[var(--bg-color)] transition-colors duration-300 text-[#111] dark:text-[#eee] overflow-hidden relative selection:bg-orange-100 dark:selection:bg-blue-900/30">
      <Dialog {...dialogConfig} onCancel={closeDialog} />
      { }
      <div
        className="absolute top-0 left-0 right-0 h-28 z-20 pointer-events-none transition-colors duration-300"
        style={{
          background: 'linear-gradient(to bottom, var(--bg-color) 10%, transparent 100%)',
          backdropFilter: 'blur(8px)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
        }}
      />
      { }
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center gap-1 px-4 pt-5 pb-4 pointer-events-none">
        <RouterLink
          to="/"
          className="p-2 text-[#555] dark:text-[#999] hover:text-black dark:hover:text-white transition-colors pointer-events-auto"
        >
          <ChevronLeft size={28} strokeWidth={1.5} />
        </RouterLink>
        <button
          onClick={handleRename}
          className="text-[16px] font-serif font-medium text-[#444] dark:text-[#999] hover:text-black dark:hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-[#e5e5e0] dark:hover:bg-[#333] truncate max-w-[200px] pointer-events-auto"
          title="Click to rename"
        >
          {title || 'Untitled Document'}
        </button>
      </div>
      { }
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className={`flex-1 flex flex-col h-full absolute inset-0 transition-opacity duration-200 ${activeTab === 'editor' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          <main className="flex-1 overflow-auto px-6 z-10 no-scrollbar pb-32 pt-20 max-w-2xl mx-auto w-full">
            <div className="markdown-preview focus:outline-none">
              <EditorContent editor={editor} />
            </div>
          </main>
        </div>
        <div className={`flex-1 flex flex-col h-full absolute inset-0 transition-opacity duration-200 ${activeTab === 'code' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          <div className="pt-20 h-full flex flex-col">
            <CodeOutput markdown={markdown} setMarkdown={setMarkdown} editor={editor} />
          </div>
        </div>
      </main>
      { }
      <div
        className="absolute bottom-0 left-0 right-0 h-[148px] z-30 pointer-events-none transition-colors duration-300"
        style={{
          background: 'linear-gradient(to top, var(--bg-color) 10%, transparent 100%)',
          backdropFilter: 'blur(8px)',
          WebkitMaskImage: 'linear-gradient(to top, black 50%, transparent 100%)',
          maskImage: 'linear-gradient(to top, black 50%, transparent 100%)'
        }}
      />
      { }
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
        <div
          className={`bg-white dark:bg-[#1a1a1a] text-black dark:text-white shadow-2xl shadow-black/10 dark:shadow-black/40 border border-[#e5e5e0] dark:border-[#333] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden ${isToolbarExpanded
            ? 'w-[94vw] max-w-3xl rounded-2xl h-14'
            : 'w-[310px] rounded-full h-[52px]'
            }`}
        >
          { }
          <div
            className={`absolute inset-0 flex items-center justify-center gap-1 px-3 transition-all duration-400 ${isToolbarExpanded ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100 delay-100'
              }`}
          >
            <button
              onClick={handleSave}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center text-[#666] dark:text-[#ddd] hover:text-black dark:hover:text-white shrink-0"
              aria-label="Save"
            >
              <Save size={18} strokeWidth={1.5} />
            </button>
            <div className="relative mx-1 bg-[#f0f0ea] dark:bg-[#333] p-1 rounded-full flex items-center text-[13px] font-sans font-medium shrink-0">
              { }
              <div
                className={`absolute top-1 bottom-1 w-[60px] bg-white dark:bg-[#555] rounded-full shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${activeTab === 'editor' ? 'translate-x-0' : 'translate-x-[60px]'
                  }`}
              />
              <button
                onClick={() => setActiveTab('editor')}
                className={`relative z-10 w-[60px] py-1 text-center rounded-full transition-colors duration-300 ${activeTab === 'editor' ? 'text-black dark:text-white' : 'text-[#888] dark:text-[#aaa] hover:text-black dark:hover:text-white'}`}
              >
                Read
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`relative z-10 w-[60px] py-1 text-center rounded-full transition-colors duration-300 ${activeTab === 'code' ? 'text-black dark:text-white' : 'text-[#888] dark:text-[#aaa] hover:text-black dark:hover:text-white'}`}
              >
                Code
              </button>
            </div>
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
          { }
          <div
            className={`absolute inset-0 flex items-center w-full px-1 transition-all duration-400 ${isToolbarExpanded ? 'opacity-100 scale-100 delay-100' : 'opacity-0 scale-105 pointer-events-none'
              }`}
          >
            <div className="flex-1 overflow-hidden flex items-center h-full">
              <Toolbar
                editor={editor}
                setExternalDialog={setDialogConfig}
                closeExternalDialog={closeDialog}
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
    </div>
  );
}
export default Editor;