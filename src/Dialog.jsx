import React, { useState, useEffect } from 'react';

function Dialog({ isOpen, title, message, type = 'prompt', defaultValue = '', onConfirm, onCancel }) {
  const [inputValue, setInputValue] = useState(defaultValue);

  // Update input value when dialog opens or default changes
  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
    }
  }, [defaultValue, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#f4f4f0]/60 backdrop-blur-sm fade-in transition-opacity" 
        onClick={onCancel} 
      />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-[2rem] shadow-2xl shadow-black/10 w-full max-w-sm p-6 fade-in border border-[#e5e5e0]">
        
        <h3 className="text-xl font-serif text-[#111] mb-2 tracking-tight">
          {title}
        </h3>
        
        {message && (
          <p className="text-[15px] text-[#666] mb-5 font-serif italic leading-relaxed">
            {message}
          </p>
        )}
        
        {type === 'prompt' && (
          <input 
            type="text" 
            value={inputValue} 
            onChange={e => setInputValue(e.target.value)}
            className="w-full bg-[#f8f8f8] border border-[#e5e5e0] rounded-xl px-4 py-3 text-black font-sans focus:outline-none focus:border-[#999] focus:bg-white transition-colors mb-6 text-[15px]"
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
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
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
