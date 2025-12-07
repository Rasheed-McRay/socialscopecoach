import { usePWA } from '@/hooks/use-pwa';
import { Smartphone, Monitor } from 'lucide-react';

export function DevPWAToggle() {
  const { isPWA, isRealPWA, forcePWA, setForcePWA } = usePWA();

  // Don't show toggle if running as real PWA
  if (isRealPWA) return null;

  return (
    <button
      onClick={() => setForcePWA(!forcePWA)}
      className="fixed bottom-4 right-4 z-[100] flex items-center gap-2 px-3 py-2 rounded-full bg-secondary/90 backdrop-blur-sm border border-border shadow-lg hover:bg-secondary transition-colors text-xs font-medium"
      title={isPWA ? 'Switch to Website mode' : 'Switch to PWA mode'}
    >
      {isPWA ? (
        <>
          <Smartphone className="w-4 h-4 text-primary" />
          <span className="text-foreground">PWA Mode</span>
        </>
      ) : (
        <>
          <Monitor className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Website Mode</span>
        </>
      )}
    </button>
  );
}
