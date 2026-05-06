import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import Mathematics from './Mathematics';
import { X, RotateCcw, Maximize2 } from 'lucide-react';

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
  isReadingMode
}) => {
  const elementRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(null); // 'nw', 'n', 'ne', etc.
  const [isRotating, setIsRotating] = useState(false);

  // Auto-Wrap Logic: Calculate intersections with other images
  const exclusions = useMemo(() => {
    if (element.type !== 'text') return [];
    
    return allElements
      .filter(el => el.type === 'image' && el.id !== element.id)
      .map(img => {
        // Simple rectangular overlap in global space
        // (Improving with rotation awareness later if needed)
        const xOverlap = Math.max(0, Math.min(element.x + element.width, img.x + img.width) - Math.max(element.x, img.x));
        const yOverlap = Math.max(0, Math.min(element.y + element.height, img.y + img.height) - Math.max(element.y, img.y));
        
        if (xOverlap > 0 && yOverlap > 0) {
          return {
            x: Math.max(0, img.x - element.x),
            y: Math.max(0, img.y - element.y),
            width: xOverlap,
            height: yOverlap
          };
        }
        return null;
      })
      .filter(Boolean);
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
    onUpdate: ({ editor }) => {
      if (element.type === 'text') {
        onUpdate(element.id, { content: editor.getHTML() });
      }
    },
    onFocus: () => onEditorFocus(element.id, editor),
    onBlur: () => onEditorBlur(),
  }, [element.id]);

  // Update editor content if it changes externally (e.g., from DB load)
  useEffect(() => {
    if (editor && element.type === 'text' && element.content !== editor.getHTML()) {
      editor.commands.setContent(element.content);
    }
  }, [element.content, editor]);

  // Handle Reading Mode (setEditable)
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadingMode);
    }
  }, [isReadingMode, editor]);

  const handlePointerDown = (e, action) => {
    e.stopPropagation();
    onSelect(element.id);
    
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
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        
        // Simple non-rotated resizing for now (improving this later)
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
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
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
        isFreeMode && handlePointerDown(e, 'drag');
      }}
      onClick={(e) => {
        if (isReadingMode) return;
        e.stopPropagation();
      }}
    >
      {/* Selection Border */}
      {isActive && isFreeMode && (
        <div className="absolute -inset-1 border-2 border-[var(--accent-color)] rounded-lg pointer-events-none" />
      )}

      {/* Rotation Handle */}
      {isActive && isFreeMode && (
        <div 
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-px h-10 bg-[var(--accent-color)] flex flex-col items-center"
          onPointerDown={(e) => handlePointerDown(e, 'rotate')}
        >
          <div className="w-6 h-6 rounded-full bg-white dark:bg-[#333] border-2 border-[var(--accent-color)] shadow-lg flex items-center justify-center cursor-alias hover:scale-110 transition-transform">
            <RotateCcw size={12} className="text-[var(--accent-color)]" />
          </div>
        </div>
      )}

      {/* Resizing Handles */}
      {isActive && handles.map(h => (
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

      {/* Action Buttons (Delete) */}
      {isActive && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(element.id); }}
          className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full shadow-xl flex items-center justify-center z-40 hover:scale-110 transition-transform active:scale-95"
        >
          <X size={14} strokeWidth={3} />
        </button>
      )}

      {/* Content Rendering */}
      <div className="w-full h-full overflow-hidden rounded-lg bg-transparent">
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
            onClick={(e) => isActive && e.stopPropagation()}
          >
            {/* Text Wrap Floats */}
            {exclusions.map((ex, i) => (
              <div 
                key={i}
                style={{
                  float: ex.x < element.width / 2 ? 'left' : 'right',
                  width: ex.width,
                  height: ex.height,
                  marginTop: ex.y,
                  shapeOutside: 'inset(0%)',
                  pointerEvents: 'none'
                }}
              />
            ))}
            <EditorContent editor={editor} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasElement;
