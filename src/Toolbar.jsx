import React, { useState } from 'react';
import { 
  Heading1, Heading2, Heading3, 
  Bold, Italic, Strikethrough, 
  Code, Quote, Link, Image, 
  List, ListOrdered, CheckSquare, Type, Sigma
} from 'lucide-react';
import Dialog from './Dialog';
function Toolbar({ editor, setExternalDialog, closeExternalDialog, textSize, onUpdateTextSize }) {
  if (!editor) {
    return null;
  }
  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    setExternalDialog({
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
    setExternalDialog({
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
    { icon: <Heading1 size={16} />, label: 'Heading 1', isActive: editor.isActive('heading', { level: 1 }), action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { icon: <Heading2 size={16} />, label: 'Heading 2', isActive: editor.isActive('heading', { level: 2 }), action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { icon: <Heading3 size={16} />, label: 'Heading 3', isActive: editor.isActive('heading', { level: 3 }), action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { divider: true },
    { icon: <Bold size={16} />, label: 'Bold', isActive: editor.isActive('bold'), action: () => editor.chain().focus().toggleBold().run() },
    { icon: <Italic size={16} />, label: 'Italic', isActive: editor.isActive('italic'), action: () => editor.chain().focus().toggleItalic().run() },
    { icon: <Strikethrough size={16} />, label: 'Strikethrough', isActive: editor.isActive('strike'), action: () => editor.chain().focus().toggleStrike().run() },
    { divider: true },
    { icon: <Code size={16} />, label: 'Code', isActive: editor.isActive('code'), action: () => editor.chain().focus().toggleCode().run() },
    { icon: <Quote size={16} />, label: 'Quote', isActive: editor.isActive('blockquote'), action: () => editor.chain().focus().toggleBlockquote().run() },
    { divider: true },
    { icon: <Link size={16} />, label: 'Link', isActive: editor.isActive('link'), action: setLink },
    { icon: <Image size={16} />, label: 'Image', isActive: editor.isActive('image'), action: setImage },
    { divider: true },
    { icon: <List size={16} />, label: 'Unordered List', isActive: editor.isActive('bulletList'), action: () => editor.chain().focus().toggleBulletList().run() },
    { icon: <ListOrdered size={16} />, label: 'Ordered List', isActive: editor.isActive('orderedList'), action: () => editor.chain().focus().toggleOrderedList().run() },
    { icon: <CheckSquare size={16} />, label: 'Task List', isActive: editor.isActive('taskList'), action: () => editor.chain().focus().toggleTaskList().run() },
    { divider: true },
    { icon: <Sigma size={16} />, label: 'Mathematics', action: () => editor.chain().focus().insertContent('\n\n$$\nE = mc^2\n$$\n\n').run() },
  ];
  return (
    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-1">
      {tools.map((tool, index) => {
        if (tool.divider) {
          return <div key={index} className="w-[1px] h-5 bg-[#e5e5e0] dark:bg-[#444] mx-1.5 flex-shrink-0" />;
        }
        return (
          <button
            key={index}
            title={tool.label}
            onClick={tool.action}
            className={`p-1.5 rounded-full transition-colors flex-shrink-0 active:scale-95 ${
              tool.isActive 
                ? 'text-white bg-black dark:text-black dark:bg-white shadow-sm' 
                : 'text-[#666] dark:text-[#aaa] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            aria-label={tool.label}
          >
            {tool.icon}
          </button>
        );
      })}
      
      <div className="w-[1px] h-5 bg-[#e5e5e0] dark:bg-[#444] mx-1.5 flex-shrink-0" />
      
      <div className="flex items-center gap-2 px-2 flex-shrink-0 min-w-[120px]">
        <Type size={14} className="text-[#888] dark:text-[#666]" />
        <input 
          type="range" 
          min="70" 
          max="150" 
          step="5"
          value={textSize || 100} 
          onChange={(e) => onUpdateTextSize(parseInt(e.target.value))}
          className="w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
        />
        <span className="text-[10px] font-mono text-[#888] w-7">{textSize}%</span>
      </div>
    </div>
  );
}
export default Toolbar;