import { useState, useEffect } from 'react';
import { Share, PlusSquare, ChevronLeft, ChevronRight, RotateCcw, Bookmark, Copy, Printer, Search } from 'lucide-react';

const IOSInstallGuide = () => {
  const [activeStep, setActiveStep] = useState(0);

  // Auto-cycle through steps
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { label: 'Tap Share', sublabel: 'in Safari toolbar' },
    { label: 'Add to Home Screen', sublabel: 'scroll down in menu' },
    { label: 'Tap Add', sublabel: 'top right corner' },
  ];

  return (
    <div className="space-y-4">
      {/* iPhone Mockup */}
      <div className="relative mx-auto w-44 h-[320px] md:w-52 md:h-[380px]">
        {/* Phone frame - titanium style */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2a2a2c] to-[#1a1a1c] rounded-[2.5rem] p-[3px] shadow-xl">
          {/* Inner bezel */}
          <div className="w-full h-full bg-black rounded-[2.3rem] p-[2px] relative overflow-hidden">
            {/* Dynamic Island */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full z-20" />
            
            {/* Screen content */}
            <div className="w-full h-full bg-[#f2f2f7] dark:bg-[#1c1c1e] rounded-[2.2rem] overflow-hidden relative">
              
              {/* Step 0: Safari with share button highlighted */}
              {activeStep === 0 && (
                <div className="w-full h-full flex flex-col animate-fade-in">
                  {/* iOS Status Bar */}
                  <div className="h-10 flex items-end justify-between px-6 pb-1">
                    <span className="text-[10px] font-semibold text-foreground">9:41</span>
                    <div className="flex gap-1 items-center">
                      <div className="flex gap-[2px]">
                        <div className="w-[3px] h-[6px] bg-foreground rounded-sm" />
                        <div className="w-[3px] h-[8px] bg-foreground rounded-sm" />
                        <div className="w-[3px] h-[10px] bg-foreground rounded-sm" />
                        <div className="w-[3px] h-[12px] bg-foreground rounded-sm" />
                      </div>
                      <div className="w-6 h-3 border border-foreground rounded-sm ml-1 relative">
                        <div className="absolute inset-[2px] bg-foreground rounded-[1px]" style={{ width: '70%' }} />
                        <div className="absolute right-[-2px] top-1/2 -translate-y-1/2 w-[2px] h-[4px] bg-foreground rounded-r-sm" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Safari URL Bar */}
                  <div className="px-3 pt-1 pb-2">
                    <div className="bg-[#e5e5ea] dark:bg-[#2c2c2e] rounded-xl h-9 flex items-center px-3 gap-2">
                      <span className="text-[10px] text-muted-foreground truncate flex-1">socialscope.app</span>
                      <RotateCcw className="w-3 h-3 text-[#007aff]" />
                    </div>
                  </div>
                  
                  {/* Page content */}
                  <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-md">
                      <span className="text-primary-foreground font-serif text-base">S</span>
                    </div>
                    <p className="text-[10px] text-foreground mt-2 font-medium">SocialScope</p>
                  </div>
                  
                  {/* Safari Bottom Toolbar */}
                  <div className="h-12 bg-[#f2f2f7]/80 dark:bg-[#1c1c1e]/80 backdrop-blur-md border-t border-[#c6c6c8] dark:border-[#38383a] flex items-center justify-around px-4">
                    <ChevronLeft className="w-5 h-5 text-[#007aff]" />
                    <ChevronRight className="w-5 h-5 text-[#c7c7cc]" />
                    <div className="relative">
                      <Share className="w-5 h-5 text-[#007aff]" />
                      {/* Pulse ring */}
                      <div className="absolute -inset-3 rounded-full border-2 border-[#007aff] animate-ping opacity-75" />
                      <div className="absolute -inset-2 rounded-full bg-[#007aff]/20 animate-pulse" />
                    </div>
                    <Bookmark className="w-5 h-5 text-[#007aff]" />
                    <div className="w-5 h-5 border border-[#007aff] rounded flex items-center justify-center">
                      <div className="w-3 h-3 border border-[#007aff] rounded-sm" />
                    </div>
                  </div>
                  
                  {/* Home indicator */}
                  <div className="h-5 flex items-center justify-center">
                    <div className="w-28 h-1 bg-foreground/20 rounded-full" />
                  </div>
                </div>
              )}
              
              {/* Step 1: Share sheet with Add to Home Screen */}
              {activeStep === 1 && (
                <div className="w-full h-full flex flex-col animate-fade-in">
                  {/* Dimmed background */}
                  <div className="absolute inset-0 bg-black/40" />
                  
                  {/* Share Sheet */}
                  <div className="absolute bottom-0 left-0 right-0 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-t-2xl overflow-hidden animate-slide-up">
                    {/* Handle */}
                    <div className="flex justify-center py-2">
                      <div className="w-9 h-1 bg-[#c7c7cc] rounded-full" />
                    </div>
                    
                    {/* App row */}
                    <div className="px-3 py-2 overflow-x-auto flex gap-3">
                      {['Messages', 'Mail', 'Notes'].map((app, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 min-w-[50px]">
                          <div className={`w-10 h-10 rounded-xl ${
                            i === 0 ? 'bg-[#34c759]' : i === 1 ? 'bg-[#007aff]' : 'bg-[#ffcc00]'
                          }`} />
                          <span className="text-[8px] text-foreground">{app}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Divider */}
                    <div className="h-px bg-[#c6c6c8] dark:bg-[#38383a] mx-3" />
                    
                    {/* Actions list */}
                    <div className="py-1">
                      {[
                        { icon: Copy, label: 'Copy' },
                        { icon: Bookmark, label: 'Add Bookmark' },
                        { icon: PlusSquare, label: 'Add to Home Screen', highlight: true },
                        { icon: Printer, label: 'Print' },
                        { icon: Search, label: 'Find on Page' },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-3 px-4 py-2 relative ${
                            item.highlight ? 'bg-[#007aff]/10' : ''
                          }`}
                        >
                          <item.icon className={`w-4 h-4 ${item.highlight ? 'text-[#007aff]' : 'text-foreground'}`} />
                          <span className={`text-[11px] ${item.highlight ? 'text-[#007aff] font-medium' : 'text-foreground'}`}>
                            {item.label}
                          </span>
                          {item.highlight && (
                            <>
                              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#007aff] rounded-r" />
                              <div className="absolute inset-0 border border-[#007aff]/50 rounded animate-pulse" />
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Cancel button */}
                    <div className="p-3 pt-0">
                      <div className="bg-white dark:bg-[#3a3a3c] rounded-xl py-2 text-center">
                        <span className="text-[12px] text-[#007aff] font-medium">Cancel</span>
                      </div>
                    </div>
                    
                    {/* Home indicator */}
                    <div className="h-5 flex items-center justify-center">
                      <div className="w-28 h-1 bg-foreground/20 rounded-full" />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 2: Add to Home Screen confirmation */}
              {activeStep === 2 && (
                <div className="w-full h-full flex flex-col animate-fade-in bg-[#f2f2f7] dark:bg-[#1c1c1e]">
                  {/* iOS Status Bar */}
                  <div className="h-10 flex items-end justify-between px-6 pb-1">
                    <span className="text-[10px] font-semibold text-foreground">9:41</span>
                    <div className="flex gap-1 items-center">
                      <div className="w-6 h-3 border border-foreground rounded-sm relative">
                        <div className="absolute inset-[2px] bg-foreground rounded-[1px]" style={{ width: '70%' }} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Navigation bar */}
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-[12px] text-[#007aff]">Cancel</span>
                    <span className="text-[13px] font-semibold text-foreground">Add to Home Screen</span>
                    <div className="relative">
                      <span className="text-[12px] text-[#007aff] font-semibold">Add</span>
                      {/* Highlight */}
                      <div className="absolute -inset-2 rounded-lg bg-[#007aff]/20 animate-pulse" />
                      <div className="absolute -inset-2 rounded-lg border-2 border-[#007aff] animate-ping opacity-50" />
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="h-px bg-[#c6c6c8] dark:bg-[#38383a]" />
                  
                  {/* App preview */}
                  <div className="flex-1 p-6 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg">
                      <span className="text-primary-foreground font-serif text-xl">S</span>
                    </div>
                    
                    {/* Name input */}
                    <div className="mt-4 w-full bg-white dark:bg-[#2c2c2e] rounded-xl p-3">
                      <input
                        type="text"
                        value="SocialScope"
                        readOnly
                        className="w-full text-center text-[13px] bg-transparent text-foreground outline-none"
                      />
                    </div>
                    
                    <p className="text-[10px] text-muted-foreground mt-3 text-center px-4">
                      This will add an icon to your Home Screen
                    </p>
                  </div>
                  
                  {/* Home indicator */}
                  <div className="h-5 flex items-center justify-center">
                    <div className="w-28 h-1 bg-foreground/20 rounded-full" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Tap indicator finger */}
        {activeStep === 0 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30">
            <div className="relative animate-bounce">
              <div className="w-8 h-8 rounded-full bg-white/90 shadow-lg flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-[#007aff]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step indicators */}
      <div className="flex justify-center gap-2">
        {steps.map((step, index) => (
          <button
            key={index}
            onClick={() => setActiveStep(index)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 ${
              activeStep === index 
                ? 'bg-[#007aff]/10 border border-[#007aff]/30' 
                : 'opacity-50 hover:opacity-75'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              activeStep === index ? 'bg-[#007aff] text-white' : 'bg-muted text-muted-foreground'
            }`}>
              {index + 1}
            </div>
            <span className="text-[9px] font-medium text-foreground">{step.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Add slide-up animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
`;
document.head.appendChild(style);

export default IOSInstallGuide;
