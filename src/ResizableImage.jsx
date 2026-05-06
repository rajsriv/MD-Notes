import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState, useRef, useEffect } from 'react';

const ImageComponent = ({ node, updateAttributes, selected }) => {
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  const onResize = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newWidth = e.clientX - rect.left;
    updateAttributes({ width: Math.max(50, newWidth) });
  };

  const stopResize = () => {
    setIsResizing(false);
    window.removeEventListener('pointermove', onResize);
    window.removeEventListener('pointerup', stopResize);
  };

  const startResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    window.addEventListener('pointermove', onResize);
    window.addEventListener('pointerup', stopResize);
  };

  const setFloat = (f) => {
    updateAttributes({ float: f });
  };

  return (
    <NodeViewWrapper 
      className={`inline-block relative group m-2 transition-all ${selected ? 'ring-2 ring-[var(--accent-color)] rounded-lg' : ''}`}
      style={{ 
        float: node.attrs.float || 'none',
        width: node.attrs.width || 'auto',
        maxWidth: '100%'
      }}
      ref={containerRef}
    >
      <img 
        src={node.attrs.src} 
        alt="" 
        className="w-full h-auto rounded-lg shadow-sm"
        style={{ display: 'block' }}
      />
      
      {/* Controls */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 dark:bg-black/80 backdrop-blur-sm p-1 rounded-md shadow-lg z-10">
        <button onClick={() => setFloat('left')} className={`p-1 rounded ${node.attrs.float === 'left' ? 'bg-[var(--accent-color)] text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>L</button>
        <button onClick={() => setFloat('none')} className={`p-1 rounded ${!node.attrs.float || node.attrs.float === 'none' ? 'bg-[var(--accent-color)] text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>C</button>
        <button onClick={() => setFloat('right')} className={`p-1 rounded ${node.attrs.float === 'right' ? 'bg-[var(--accent-color)] text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>R</button>
      </div>

      {/* Resize Handle */}
      {!isResizing && (
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 bg-[var(--accent-color)] rounded-tl-md rounded-br-lg z-20"
          onPointerDown={startResize}
        />
      )}
    </NodeViewWrapper>
  );
};

const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'inline',
  inline: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { default: '300px' },
      float: { default: 'none' }, // 'left', 'right', 'none'
    };
  },

  parseHTML() {
    return [{ tag: 'img[data-resizable]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes, { 'data-resizable': '' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent);
  },

  addCommands() {
    return {
      setImage: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});

export default ResizableImage;
