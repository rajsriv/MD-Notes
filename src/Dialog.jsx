import React, { useState, useEffect, useRef } from 'react';
import { Upload, Link as LinkIcon } from 'lucide-react';

function Dialog({ isOpen, title, message, type = 'prompt', defaultValue = '', onConfirm, onCancel, showUploadOption = false }) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
    }
  }, [defaultValue, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onConfirm(event.target.result);
        onCancel();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24 md:pt-32 pointer-events-none">
      <div 
        className="absolute inset-0 bg-[#f4f4f0]/40 backdrop-blur-[2px] fade-in transition-opacity pointer-events-auto" 
        onClick={onCancel} 
      />
      <div className="relative bg-white rounded-[2rem] shadow-2xl shadow-black/10 w-full max-w-sm p-6 fade-in border border-[#e5e5e0] pointer-events-auto">
        <h3 className="text-xl font-serif text-[#111] mb-2 tracking-tight">
          {title}
        </h3>
        {message && (
          <p className="text-[15px] text-[#666] mb-5 font-serif italic leading-relaxed">
            {message}
          </p>
        )}
        
        {type === 'prompt' && (
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Paste image URL here..."
              value={inputValue} 
              onChange={e => setInputValue(e.target.value)}
              className="w-full bg-[#f8f8f8] border border-[#e5e5e0] rounded-xl px-4 py-3 text-black font-sans focus:outline-none focus:border-[#999] focus:bg-white transition-colors text-[15px]"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  onConfirm(inputValue);
                  onCancel();
                } else if (e.key === 'Escape') {
                  onCancel();
                }
              }}
            />
            
            {showUploadOption && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-px bg-[#e5e5e0] flex-1" />
                  <span className="text-[11px] font-sans font-bold text-[#aaa] uppercase tracking-widest">or</span>
                  <div className="h-px bg-[#e5e5e0] flex-1" />
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#f4f4f0] hover:bg-[#ebebe5] text-black rounded-xl transition-colors font-sans font-medium text-[14px]"
                >
                  <Upload size={18} strokeWidth={1.5} />
                  Choose from Device
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-8">
          <button 
            onClick={onCancel} 
            className="px-5 py-2.5 rounded-full text-[14px] font-sans font-medium text-[#666] hover:bg-[#f4f4f0] hover:text-black transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirm(type === 'prompt' ? inputValue : true);
              onCancel();
            }} 
            className="px-6 py-2.5 rounded-full text-[14px] font-sans font-medium bg-black text-white hover:bg-[#333] transition-colors shadow-lg shadow-black/10 active:scale-95"
          >
            {type === 'prompt' ? 'Save' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dialog;