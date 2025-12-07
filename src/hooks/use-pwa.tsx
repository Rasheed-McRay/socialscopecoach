import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface PWAContextType {
  isPWA: boolean;
  isRealPWA: boolean;
  forcePWA: boolean;
  setForcePWA: (value: boolean) => void;
}

const PWAContext = createContext<PWAContextType | null>(null);

export function PWAProvider({ children }: { children: ReactNode }) {
  const [isRealPWA, setIsRealPWA] = useState(false);
  const [forcePWA, setForcePWA] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('forcePWA') === 'true';
    }
    return false;
  });

  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsRealPWA(isStandalone || isIOSStandalone);
    };

    checkPWA();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkPWA);

    return () => mediaQuery.removeEventListener('change', checkPWA);
  }, []);

  useEffect(() => {
    localStorage.setItem('forcePWA', String(forcePWA));
  }, [forcePWA]);

  const isPWA = isRealPWA || forcePWA;

  return (
    <PWAContext.Provider value={{ isPWA, isRealPWA, forcePWA, setForcePWA }}>
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    // Fallback for components not wrapped in provider
    return { isPWA: false, isRealPWA: false, forcePWA: false, setForcePWA: () => {} };
  }
  return context;
}
