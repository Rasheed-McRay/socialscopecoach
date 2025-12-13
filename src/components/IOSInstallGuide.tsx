import { useState, useEffect } from 'react';
import { Share, Plus, Check } from 'lucide-react';

const IOSInstallGuide = () => {
  const [activeStep, setActiveStep] = useState(0);

  // Auto-cycle through steps
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      icon: Share,
      label: 'Tap Share',
      description: 'Bottom of Safari',
    },
    {
      icon: Plus,
      label: 'Add to Home',
      description: 'Scroll to find it',
    },
    {
      icon: Check,
      label: 'Tap Add',
      description: 'Confirm install',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Phone Mockup */}
      <div className="relative mx-auto w-40 h-72 md:w-48 md:h-80">
        {/* Phone frame */}
        <div className="absolute inset-0 bg-foreground/10 rounded-[2rem] border-4 border-foreground/20 overflow-hidden">
          {/* Screen */}
          <div className="absolute inset-2 bg-background rounded-[1.5rem] overflow-hidden">
            {/* Status bar */}
            <div className="h-6 bg-muted/50 flex items-center justify-center">
              <div className="w-16 h-4 bg-foreground/20 rounded-full" />
            </div>
            
            {/* Content area */}
            <div className="flex-1 p-3 flex flex-col items-center justify-center h-[calc(100%-4rem)]">
              {/* App icon preview */}
              <div 
                className={`w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-3 transition-all duration-500 ${
                  activeStep === 2 ? 'scale-110 animate-pulse' : ''
                }`}
              >
                <span className="text-primary-foreground font-serif text-lg">S</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">SocialScope</p>
              
              {/* Animated indicator based on step */}
              <div className="mt-4 flex items-center justify-center">
                {activeStep === 0 && (
                  <div className="animate-fade-in flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                      <Share className="w-4 h-4 text-primary" />
                    </div>
                    <div className="mt-2 h-8 w-0.5 bg-primary/30 animate-pulse" />
                  </div>
                )}
                {activeStep === 1 && (
                  <div className="animate-fade-in bg-muted/80 rounded-lg p-2 w-full max-w-[120px]">
                    <div className="flex items-center gap-2 p-1.5 rounded bg-primary/20 animate-pulse">
                      <Plus className="w-3 h-3 text-primary" />
                      <span className="text-[10px] text-foreground">Add to Home</span>
                    </div>
                  </div>
                )}
                {activeStep === 2 && (
                  <div className="animate-fade-in flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium animate-pulse">
                      Add
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Safari bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-muted/50 flex items-center justify-around px-4">
              <div className="w-5 h-5 rounded bg-foreground/10" />
              <div className="w-5 h-5 rounded bg-foreground/10" />
              <div 
                className={`w-6 h-6 rounded flex items-center justify-center transition-all duration-300 ${
                  activeStep === 0 ? 'bg-primary/30 scale-125' : 'bg-foreground/10'
                }`}
              >
                <Share className={`w-3 h-3 ${activeStep === 0 ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="w-5 h-5 rounded bg-foreground/10" />
              <div className="w-5 h-5 rounded bg-foreground/10" />
            </div>
          </div>
        </div>
        
        {/* Tap indicator */}
        {activeStep === 0 && (
          <div className="absolute bottom-8 right-8 animate-bounce">
            <div className="w-6 h-6 rounded-full bg-primary/50 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-primary" />
            </div>
          </div>
        )}
      </div>

      {/* Step indicators */}
      <div className="flex justify-center gap-3">
        {steps.map((step, index) => (
          <button
            key={index}
            onClick={() => setActiveStep(index)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-300 ${
              activeStep === index 
                ? 'bg-primary/10 scale-105' 
                : 'opacity-50 hover:opacity-75'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              activeStep === index ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              <step.icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium">{step.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default IOSInstallGuide;
