import React, { useState } from 'react';
import { 
  Heading1, Heading2, Heading3, 
  Bold, Italic, Strikethrough, 
  Code, Quote, Link, Image, 
  List, ListOrdered, CheckSquare 
} from 'lucide-react';
import Dialog from './Dialog';
function Toolbar({ editor }) {
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false });
  if (!editor) {
    return null;
  }
  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));
  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    setDialogConfig({
      isOpen: true,
      type: 'prompt',
      title: 'Insert Link',
      defaultValue: previousUrl || '',
      onConfirm: (url) => {
        if (url === null) return;
        if (url === '') {
          editor.chain().focus().extendMarkRange('link').unsetLink().run();
          return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      }
    });
  };
  const setImage = () => {
    setDialogConfig({
      isOpen: true,
      type: 'prompt',
      title: 'Insert Image',
      defaultValue: '',
      showUploadOption: true,
      onConfirm: (url) => {
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      }
    });
  };
  const tools = [
    { icon: <Heading1 size={20} />, label: 'Heading 1', isActive: editor.isActive('heading', { level: 1 }), action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { icon: <Heading2 size={20} />, label: 'Heading 2', isActive: editor.isActive('heading', { level: 2 }), action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { icon: <Heading3 size={20} />, label: 'Heading 3', isActive: editor.isActive('heading', { level: 3 }), action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { divider: true },
    { icon: <Bold size={20} />, label: 'Bold', isActive: editor.isActive('bold'), action: () => editor.chain().focus().toggleBold().run() },
    { icon: <Italic size={20} />, label: 'Italic', isActive: editor.isActive('italic'), action: () => editor.chain().focus().toggleItalic().run() },
    { icon: <Strikethrough size={20} />, label: 'Strikethrough', isActive: editor.isActive('strike'), action: () => editor.chain().focus().toggleStrike().run() },
    { divider: true },
    { icon: <Code size={20} />, label: 'Code', isActive: editor.isActive('code'), action: () => editor.chain().focus().toggleCode().run() },
    { icon: <Quote size={20} />, label: 'Quote', isActive: editor.isActive('blockquote'), action: () => editor.chain().focus().toggleBlockquote().run() },
    { divider: true },
    { icon: <Link size={20} />, label: 'Link', isActive: editor.isActive('link'), action: setLink },
    { icon: <Image size={20} />, label: 'Image', isActive: editor.isActive('image'), action: setImage },
    { divider: true },
    { icon: <List size={20} />, label: 'Unordered List', isActive: editor.isActive('bulletList'), action: () => editor.chain().focus().toggleBulletList().run() },
    { icon: <ListOrdered size={20} />, label: 'Ordered List', isActive: editor.isActive('orderedList'), action: () => editor.chain().focus().toggleOrderedList().run() },
    { icon: <CheckSquare size={20} />, label: 'Task List', isActive: editor.isActive('taskList'), action: () => editor.chain().focus().toggleTaskList().run() },
  ];
  return (
    <>
      <Dialog {...dialogConfig} onCancel={closeDialog} />
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-1">
        {tools.map((tool, index) => {
          if (tool.divider) {
            return <div key={index} className="w-[1px] h-5 bg-[#444] mx-1.5 flex-shrink-0" />;
          }
          return (
            <button
              key={index}
              title={tool.label}
              onClick={tool.action}
              className={`p-1.5 rounded-full transition-colors flex-shrink-0 active:scale-95 ${
                tool.isActive 
                  ? 'text-black bg-white shadow-sm' 
                  : 'text-[#aaa] hover:text-white hover:bg-white/10'
              }`}
              aria-label={tool.label}
            >
              {tool.icon}
            </button>
          );
        })}
      </div>
    </>
  );
}
export default Toolbar;