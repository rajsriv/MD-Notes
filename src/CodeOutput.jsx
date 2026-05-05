import React, { useState } from 'react';
import { Edit3, Eye } from 'lucide-react';
function CodeOutput({ markdown, setMarkdown, editor }) {
  const [isEditing, setIsEditing] = useState(false);
  const handleChange = (e) => {
    const newVal = e.target.value;
    setMarkdown(newVal);
    if (editor) {
      const jsonContent = editor.storage.markdown.manager.parse(newVal);
      editor.commands.setContent(jsonContent, false);
    }
  };
  return (
    <div className="flex-1 overflow-hidden flex flex-col relative bg-transparent">
      {}
      <div className="p-4 flex justify-center flex-shrink-0 z-10 border-b border-[#e5e5e0] mb-4">
        <div className="relative flex items-center bg-[#e0e0dc] rounded-full w-full max-w-xs shadow-inner p-1">
          {}
          <div 
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
              isEditing ? 'translate-x-full' : 'translate-x-0'
            }`}
          />
          <button 
            onClick={() => setIsEditing(false)}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-sm font-sans font-medium rounded-full transition-colors duration-300 ${!isEditing ? 'text-black' : 'text-[#666] hover:text-black'}`}
          >
            <Eye size={16} /> Preview
          </button>
          <button 
            onClick={() => setIsEditing(true)}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-sm font-sans font-medium rounded-full transition-colors duration-300 ${isEditing ? 'text-black' : 'text-[#666] hover:text-black'}`}
          >
            <Edit3 size={16} /> Edit
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 pb-40 custom-scrollbar flex flex-col">
        {isEditing ? (
          <textarea
            value={markdown}
            onChange={handleChange}
            className="flex-1 w-full h-full min-h-[500px] bg-transparent text-sm font-mono text-[#333] resize-none focus:outline-none custom-scrollbar leading-relaxed"
            placeholder="Type your markdown here..."
            spellCheck="false"
          />
        ) : (
          <pre className="text-[13px] font-mono text-[#444] whitespace-pre-wrap break-words leading-relaxed max-w-2xl mx-auto w-full">
            {markdown || 'Your markdown code will appear here...'}
          </pre>
        )}
      </div>
    </div>
  );
}
export default CodeOutput;