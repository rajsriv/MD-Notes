import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, X, MousePointer2, LayoutGrid, FileText, Sparkles } from 'lucide-react';
const steps = [
  {
    title: "Welcome to MD-Notes",
    description: "Your digital sanctuary for minimalist, e-book inspired markdown documentation. Let's take a quick tour of your new workspace.",
    icon: <Sparkles size={48} className="text-black dark:text-white" strokeWidth={1} />,
    color: "bg-orange-50 dark:bg-orange-900/20"
  },
  {
    title: "Organize Your Library",
    description: "Switch between a clean List view or a Pinterest-style Grid view to see snippets of your work. Your preference is saved automatically.",
    icon: <LayoutGrid size={48} className="text-black dark:text-white" strokeWidth={1} />,
    color: "bg-blue-50 dark:bg-blue-900/20"
  },
  {
    title: "The Power of Long Press",
    description: "Long-press any file to enter Selection Mode. A dynamic 'Notch Nook' capsule will appear at the bottom with tools to rename, download, or delete.",
    icon: <MousePointer2 size={48} className="text-black dark:text-white" strokeWidth={1} />,
    color: "bg-purple-50 dark:bg-purple-900/20"
  },
  {
    title: "Distraction-Free Writing",
    description: "Open any file to enter the editor. The formatting tools are tucked away in the bottom capsule, keeping your focus on the words.",
    icon: <FileText size={48} className="text-black dark:text-white" strokeWidth={1} />,
    color: "bg-green-50 dark:bg-green-900/20"
  },
  {
    title: "Ready to Create?",
    description: "Your work is auto-saved as you write, and you can manually save to ensure every thought is preserved forever.",
    icon: <Check size={48} className="text-black dark:text-white" strokeWidth={1} />,
    color: "bg-yellow-50 dark:bg-yellow-900/20"
  }
];
export default function Onboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };
  const back = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-[2.5rem] shadow-2xl overflow-hidden border border-[#e5e5e0] dark:border-[#333]">
        {}
        <div className="p-10 flex flex-col items-center text-center">
          <div className={`w-24 h-24 ${steps[currentStep].color} rounded-3xl flex items-center justify-center mb-8 animate-bounce-subtle`}>
            {steps[currentStep].icon}
          </div>
          <h2 className="text-2xl font-serif text-black dark:text-white mb-4 tracking-tight">
            {steps[currentStep].title}
          </h2>
          <p className="text-[16px] font-serif text-[#666] dark:text-[#999] leading-relaxed mb-10 italic">
            {steps[currentStep].description}
          </p>
          {}
          <div className="flex gap-2 mb-10">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-black dark:bg-white' : 'w-2 bg-[#e5e5e0] dark:bg-[#333]'}`}
              />
            ))}
          </div>
          {}
          <div className="flex items-center justify-between w-full">
            <button 
              onClick={back}
              className={`p-3 rounded-full transition-colors ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'hover:bg-[#f4f4f0] dark:hover:bg-[#333] text-[#888]'}`}
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={next}
              className="px-8 py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-full font-sans font-medium hover:bg-[#333] dark:hover:bg-[#eee] transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-black/10"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              {currentStep < steps.length - 1 && <ChevronRight size={18} />}
            </button>
          </div>
        </div>
        {}
        <button 
          onClick={onComplete}
          className="absolute top-6 right-6 p-2 text-[#aaa] hover:text-black dark:hover:text-white transition-colors"
          aria-label="Skip Tour"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}