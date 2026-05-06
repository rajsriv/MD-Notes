import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check, X, MousePointer2, LayoutGrid, FileText, Sparkles, Move, Palette } from 'lucide-react';

const steps = [
  {
    title: "A Digital Sanctuary",
    subtitle: "Welcome to MD-Notes",
    description: "Experience a minimalist, e-book inspired workspace designed to keep your thoughts pure and your focus sharp.",
    icon: <Sparkles size={48} className="text-white" strokeWidth={1.5} />,
    color: "from-[#ff6b6b] via-[#ee5253] to-[#ff9f43]"
  },
  {
    title: "Creative Freedom",
    subtitle: "Introducing Free Mode",
    description: "Break free from the column. Drag, rotate, and resize elements anywhere on an infinite canvas with smart text wrapping.",
    icon: <Move size={48} className="text-white" strokeWidth={1.5} />,
    color: "from-[#4834d4] via-[#686de0] to-[#7ed6df]"
  },
  {
    title: "The Notch Nook",
    subtitle: "Intelligent Management",
    description: "Long-press any note to activate the Notch Nook. Rename, download, or delete multiple files with a single tactile gesture.",
    icon: <LayoutGrid size={48} className="text-white" strokeWidth={1.5} />,
    color: "from-[#be2edd] via-[#e056fd] to-[#7ed6df]"
  },
  {
    title: "Premium Reading",
    subtitle: "E-Book Aesthetics",
    description: "Toggle Reading Mode for a distraction-free experience with smooth typography and immersive mathematical typesetting.",
    icon: <FileText size={48} className="text-white" strokeWidth={1.5} />,
    color: "from-[#6ab04c] via-[#badc58] to-[#7ed6df]"
  },
  {
    title: "Make it Yours",
    subtitle: "Custom Themes",
    description: "Personalize your workspace with curated accent colors and a seamless transition between Light and Dark modes.",
    icon: <Palette size={48} className="text-white" strokeWidth={1.5} />,
    color: "from-[#f0932b] via-[#ffbe76] to-[#ff9f43]"
  }
];

export default function Onboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleComplete = () => {
    setIsClosing(true);
    setTimeout(() => {
      onComplete();
    }, 800); // Match duration-1000 with a slight buffer
  };

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const back = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className={`fixed inset-0 z-[200] bg-black transition-all duration-1000 ease-in-out ${isVisible && !isClosing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Immersive Background Gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-60 transition-all duration-1000`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        {/* Decorative Blobs */}
        <div className={`absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full blur-[160px] bg-white opacity-10 animate-pulse`} />
        <div className={`absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full blur-[160px] bg-white opacity-10 animate-pulse animation-delay-2000`} />
      </div>

      {/* Skip Button */}
      <button 
        onClick={handleComplete}
        className="absolute top-8 right-8 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10 transition-all active:scale-95"
      >
        <span className="text-xs font-bold uppercase tracking-widest">Skip</span>
        <X size={16} />
      </button>

      {/* Main Content Area */}
      <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-20 pb-16 md:pb-32 max-w-5xl mx-auto w-full">
        <div className="space-y-6 max-w-2xl animate-in slide-in-from-bottom-8 duration-700 fade-in">
          <div className="inline-flex mb-4">
            {step.icon}
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/50 mb-2">
              {step.subtitle}
            </p>
            <h2 className="text-4xl md:text-7xl font-serif text-white tracking-tight leading-tight drop-shadow-sm">
              {step.title}
            </h2>
          </div>

          <p className="text-lg md:text-2xl text-white/70 font-serif italic leading-relaxed max-w-xl">
            {step.description}
          </p>

          <div className="pt-10 flex flex-col md:flex-row items-center gap-8">
            <button 
              onClick={next}
              className="w-full md:w-auto px-12 py-5 bg-white text-black rounded-full font-bold text-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Next Step"}
              {currentStep < steps.length - 1 && <ChevronRight size={20} />}
            </button>

            {currentStep > 0 && (
              <button 
                onClick={back}
                className="text-white/60 hover:text-white font-bold tracking-widest text-xs uppercase flex items-center gap-2 transition-colors"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
            )}

            {/* Pagination Dots */}
            <div className="flex gap-3 ml-auto">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStep ? 'w-12 bg-white' : 'w-2 bg-white/30'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}