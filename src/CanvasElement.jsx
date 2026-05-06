import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import Mathematics from './Mathematics';
import { X, RotateCcw, Edit3, Type, AlignLeft } from 'lucide-react';

const CanvasElement = ({ 
  element, 
  allElements,
  isFreeMode,
  isActive, 
  onUpdate, 
  onSelect, 
  onDelete, 
  onEditorFocus,
  onEditorBlur,
  currentTheme,
  isReadingMode,
  zoom = 1
}) => {
  const elementRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(null); // 'nw', 'n', 'ne', etc.
  const [isRotating, setIsRotating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Reset editing mode when selection changes
  useEffect(() => {
    if (!isActive) setIsEditing(false);
  }, [isActive]);

  // Auto-Wrap Logic: Calculate high-precision rotation-aware exclusions
  const exclusions = useMemo(() => {
    if (element.type !== 'text' || element.noWrap) return [];
    
    const slices = [];
    const SLICE_HEIGHT = 10; // Precision of the wrap
    const textRect = { x: element.x, y: element.y, w: element.width, h: element.height };

    allElements.filter(el => el.type === 'image').forEach(img => {
      // 1. Calculate rotated corners of the image
      const rad = ((img.rotation || 0) * Math.PI) / 180;
      const cx = img.x + img.width / 2;
      const cy = img.y + img.height / 2;
      
      const getRotatedPoint = (px, py) => {
        const dx = px - cx;
        const dy = py - cy;
        return {
          x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
          y: cy + dx * Math.sin(rad) + dy * Math.cos(rad)
        };
      };

      const corners = [
        getRotatedPoint(img.x, img.y),
        getRotatedPoint(img.x + img.width, img.y),
        getRotatedPoint(img.x + img.width, img.y + img.height),
        getRotatedPoint(img.x, img.y + img.height)
      ];

      // 2. Find vertical range of the image relative to text box
      const minY = Math.min(...corners.map(p => p.y)) - textRect.y;
      const maxY = Math.max(...corners.map(p => p.y)) - textRect.y;

      // Only process if there's a vertical overlap
      if (maxY <= 0 || minY >= textRect.h) return;

      // 3. Slice the image vertically
      for (let y = Math.max(0, Math.floor(minY / SLICE_HEIGHT) * SLICE_HEIGHT); y < Math.min(textRect.h, maxY); y += SLICE_HEIGHT) {
        const currentY = textRect.y + y + SLICE_HEIGHT / 2;
        const intersects = [];

        // Check intersection of line y = currentY with each of the 4 edges
        for (let i = 0; i < 4; i++) {
          const p1 = corners[i];
          const p2 = corners[(i + 1) % 4];
          if ((p1.y <= currentY && p2.y > currentY) || (p2.y <= currentY && p1.y > currentY)) {
            const ix = p1.x + (currentY - p1.y) * (p2.x - p1.x) / (p2.y - p1.y);
            intersects.push(ix - textRect.x);
          }
        }

        if (intersects.length >= 2) {
          const minX = Math.max(0, Math.min(...intersects));
          const maxX = Math.min(textRect.w, Math.max(...intersects));
          
            slices.push({
              y,
              height: SLICE_HEIGHT,
              minX,
              maxX
            });
          }
        }
      });

    // 4. Consolidate slices by Y coordinate to handle multiple images
    const rowMap = {};
    slices.forEach(s => {
      if (!rowMap[s.y]) rowMap[s.y] = { y: s.y, height: s.height, minX: textRect.w, maxX: 0 };
      rowMap[s.y].minX = Math.min(rowMap[s.y].minX, s.minX);
      rowMap[s.y].maxX = Math.max(rowMap[s.y].maxX, s.maxX);
    });

    return Object.values(rowMap).sort((a, b) => a.y - b.y);
  }, [allElements, element]);

  // Initialize Tiptap for text boxes
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      Image,
      TaskList,
      TaskItem,
      Placeholder.configure({ placeholder: 'Start writing...' }),
      Mathematics,
    ],
    content: element.content || '',
    editable: false, // Start non-editable
    onUpdate: ({ editor }) => {
      if (element.type === 'text') {
        onUpdate(element.id, { content: editor.getHTML() });
      }
    },
    onFocus: () => onEditorFocus(element.id, editor),
    onBlur: () => {
      onEditorBlur();
      setIsEditing(false);
    },
  }, [element.id]);

  // Update editor content if it changes externally (e.g., from DB load)
  useEffect(() => {
    if (editor && element.type === 'text' && element.content !== editor.getHTML()) {
      editor.commands.setContent(element.content);
    }
  }, [element.content, editor]);

  // Handle Editing Mode (setEditable)
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing && !isReadingMode);
      if (isEditing) {
        editor.commands.focus();
      }
    }
  }, [isEditing, isReadingMode, editor]);

  const handlePointerDown = (e, action) => {
    e.stopPropagation();
    onSelect(element.id);
    
    // If we're editing, don't trigger drag from content
    if (isEditing && action === 'drag') return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = element.x;
    const initialY = element.y;
    const initialWidth = element.width;
    const initialHeight = element.height;
    const initialRotation = element.rotation || 0;

    if (action === 'rotate') {
      setIsRotating(true);
      const rect = elementRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const onRotateMove = (moveEvent) => {
        const dx = moveEvent.clientX - centerX;
        const dy = moveEvent.clientY - centerY;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        onUpdate(element.id, { rotation: angle });
      };

      const onRotateEnd = () => {
        setIsRotating(false);
        document.removeEventListener('pointermove', onRotateMove);
        document.removeEventListener('pointerup', onRotateEnd);
      };

      document.addEventListener('pointermove', onRotateMove);
      document.addEventListener('pointerup', onRotateEnd);
      return;
    }

    if (action.startsWith('resize')) {
      setIsResizing(action);
      const dir = action.split('-')[1]; // nw, n, ne, etc.

      const onResizeMove = (moveEvent) => {
        const dx = (moveEvent.clientX - startX) / zoom;
        const dy = (moveEvent.clientY - startY) / zoom;
        
        let newWidth = initialWidth;
        let newHeight = initialHeight;
        let newX = initialX;
        let newY = initialY;

        if (dir.includes('e')) newWidth = initialWidth + dx;
        if (dir.includes('w')) {
          newWidth = initialWidth - dx;
          newX = initialX + dx;
        }
        if (dir.includes('s')) newHeight = initialHeight + dy;
        if (dir.includes('n')) {
          newHeight = initialHeight - dy;
          newY = initialY + dy;
        }

        onUpdate(element.id, { 
          width: Math.max(50, newWidth), 
          height: Math.max(30, newHeight),
          x: newX,
          y: newY
        });
      };

      const onResizeEnd = () => {
        setIsResizing(null);
        document.removeEventListener('pointermove', onResizeMove);
        document.removeEventListener('pointerup', onResizeEnd);
      };

      document.addEventListener('pointermove', onResizeMove);
      document.addEventListener('pointerup', onResizeEnd);
      return;
    }

    // Default: Dragging
    if (!isFreeMode) return;
    setIsDragging(true);
    const onDragMove = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      onUpdate(element.id, { x: initialX + dx, y: initialY + dy });
    };

    const onDragEnd = () => {
      setIsDragging(false);
      document.removeEventListener('pointermove', onDragMove);
      document.removeEventListener('pointerup', onDragEnd);
    };

    document.addEventListener('pointermove', onDragMove);
    document.addEventListener('pointerup', onDragEnd);
  };

  const TEXT_COLORS = [
    { name: 'Default', color: 'inherit' },
    { name: 'White', color: '#ffffff' },
    { name: 'Gray', color: '#888888' },
    { name: 'Red', color: '#ef4444' },
    { name: 'Amber', color: '#f59e0b' },
    { name: 'Emerald', color: '#10b981' },
    { name: 'Blue', color: '#3b82f6' },
    { name: 'Violet', color: '#8b5cf6' },
  ];

  const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

  return (
    <div
      ref={elementRef}
      className={`select-none group ${isActive ? 'z-50' : 'z-20'} ${isFreeMode ? 'absolute' : 'relative w-full mb-6'}`}
      style={{
        left: isFreeMode ? element.x : 0,
        top: isFreeMode ? element.y : 0,
        width: isFreeMode ? element.width : '100%',
        height: isFreeMode ? element.height : 'auto',
        transform: isFreeMode ? `rotate(${element.rotation || 0}deg)` : 'none',
        touchAction: 'none'
      }}
      onPointerDown={(e) => {
        if (isReadingMode) return;
        e.stopPropagation(); // Always stop propagation if we're clicking the element
        if (isEditing) return;
        isFreeMode && handlePointerDown(e, 'drag');
      }}
      onClick={(e) => {
        e.stopPropagation(); // Always stop propagation to prevent background deselection
      }}
    >
      {/* Selection Border */}
      {isActive && isFreeMode && (
        <div className="absolute -inset-1 border-2 border-[var(--accent-color)] rounded-lg pointer-events-none" />
      )}

      {/* Control Handles (Rotation) */}
      {isActive && isFreeMode && !isEditing && (
        <div 
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-px h-10 bg-[var(--accent-color)] flex flex-col items-center"
          onPointerDown={(e) => handlePointerDown(e, 'rotate')}
        >
          <div className="w-6 h-6 rounded-full bg-white dark:bg-[#333] border-2 border-[var(--accent-color)] shadow-lg flex items-center justify-center cursor-alias hover:scale-110 transition-transform">
            <RotateCcw size={12} className="text-[var(--accent-color)]" />
          </div>
        </div>
      )}

      {/* Resize Handles */}
      {isActive && !isEditing && handles.map(h => (
        <div
          key={h}
          className={`absolute w-3 h-3 bg-white dark:bg-[#333] border-2 border-[var(--accent-color)] rounded-full shadow-sm z-30
            ${h === 'nw' ? '-top-1.5 -left-1.5 cursor-nw-resize' : ''}
            ${h === 'n' ? '-top-1.5 left-1/2 -translate-x-1/2 cursor-n-resize' : ''}
            ${h === 'ne' ? '-top-1.5 -right-1.5 cursor-ne-resize' : ''}
            ${h === 'e' ? 'top-1/2 -right-1.5 -translate-y-1/2 cursor-e-resize' : ''}
            ${h === 'se' ? '-bottom-1.5 -right-1.5 cursor-se-resize' : ''}
            ${h === 's' ? '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-s-resize' : ''}
            ${h === 'sw' ? '-bottom-1.5 -left-1.5 cursor-sw-resize' : ''}
            ${h === 'w' ? 'top-1/2 -left-1.5 -translate-y-1/2 cursor-w-resize' : ''}
          `}
          onPointerDown={(e) => handlePointerDown(e, `resize-${h}`)}
        />
      ))}

      {/* Element Toolbar (Bottom Actions) */}
      {isActive && !isReadingMode && (
        <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[60]">
          {/* Color Picker Sub-toolbar */}
          {element.type === 'text' && (
            <div className="flex items-center gap-1.5 p-1.5 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl rounded-full shadow-xl border border-black/5 dark:border-white/10 animate-in fade-in zoom-in-95 duration-300">
              {TEXT_COLORS.map(c => (
                <button
                  key={c.name}
                  onClick={(e) => { e.stopPropagation(); onUpdate(element.id, { textColor: c.color }); }}
                  className={`w-5 h-5 rounded-full border border-black/5 dark:border-white/10 transition-transform hover:scale-125 ${element.textColor === c.color ? 'ring-2 ring-[var(--accent-color)] ring-offset-2 dark:ring-offset-[#1a1a1a]' : ''}`}
                  style={{ backgroundColor: c.color === 'inherit' ? (currentTheme === 'light' ? '#000' : '#fff') : c.color }}
                  title={c.name}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-black/5 dark:border-white/10 animate-in slide-in-from-top-2 duration-300">
            {element.type === 'text' && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); }}
                  className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg scale-110' : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#666] dark:text-[#aaa]'}`}
                  title="Edit Text"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onUpdate(element.id, { noWrap: !element.noWrap }); }}
                  className={`p-2 rounded-xl transition-all ${!element.noWrap ? 'bg-[var(--accent-color)] text-white shadow-lg' : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#666] dark:text-[#aaa]'}`}
                  title="Toggle Text Wrap"
                >
                  <AlignLeft size={16} />
                </button>
              </>
            )}
            <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1" />
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(element.id); }}
              className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-all"
              title="Delete Element"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Content Rendering */}
      <div 
        className={`w-full h-full overflow-hidden rounded-lg transition-all ${isEditing ? 'bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-2xl border-2 border-[var(--accent-color)]' : 'bg-transparent'}`}
        style={{ 
          color: element.textColor || 'inherit',
          fontSize: element.type === 'text' ? `${Math.max(12, (element.width / 300) * 16)}px` : 'inherit',
          lineHeight: '1.4'
        }}
      >
        {element.type === 'image' ? (
          <img 
            src={element.src} 
            alt="" 
            className="w-full h-full object-cover pointer-events-none" 
            style={{ filter: element.filter || 'none' }}
          />
        ) : (
          <div 
            className="w-full h-full p-3 prose prose-sm dark:prose-invert max-w-none canvas-prose focus:outline-none relative overflow-y-auto no-scrollbar"
            onPointerDown={(e) => isEditing && e.stopPropagation()}
            style={{ fontSize: 'inherit' }}
          >
            {!element.noWrap && exclusions.map((row, i) => (
              <React.Fragment key={i}>
                {row.maxX > 0 && (
                  <div 
                    style={{
                      float: 'left',
                      clear: 'left',
                      width: row.maxX + 10,
                      height: row.height,
                      backgroundColor: 'transparent',
                      pointerEvents: 'none',
                      shapeOutside: 'inset(0%)'
                    }}
                  />
                )}
                {row.minX < element.width && (
                  <div 
                    style={{
                      float: 'right',
                      clear: 'right',
                      width: Math.max(0, element.width - row.minX + 10),
                      height: row.height,
                      marginTop: `-${row.height}px`,
                      backgroundColor: 'transparent',
                      pointerEvents: 'none',
                      shapeOutside: 'inset(0%)'
                    }}
                  />
                )}
              </React.Fragment>
            ))}
            <EditorContent editor={editor} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasElement;
