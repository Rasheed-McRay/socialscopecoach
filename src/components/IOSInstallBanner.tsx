import { useState, useEffect } from 'react';
import { X, Share, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/usePwaInstall';

interface IOSInstallBannerProps {
  onDismiss?: () => void;
}

const IOSInstallBanner = ({ onDismiss }: IOSInstallBannerProps) => {
  const { isInstalled, isIOS } = usePwaInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if user is on iOS Safari (not in-app browser)
  const isIOSSafari = isIOS && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|OPiOS|mercury/.test(navigator.userAgent);

  useEffect(() => {
    // Don't show if already installed, not iOS, or previously dismissed this session
    const wasDismissed = sessionStorage.getItem('ios-install-banner-dismissed');
    if (isInstalled || !isIOS || wasDismissed) {
      return;
    }

    // Show after a short delay for better UX
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isInstalled, isIOS]);

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    sessionStorage.setItem('ios-install-banner-dismissed', 'true');
    onDismiss?.();
  };

  if (!isVisible || dismissed || isInstalled || !isIOS) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-fade-in safe-area-inset-bottom">
      <div className="mx-3 mb-3 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-lg overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="p-4 pr-12">
          <div className="flex items-start gap-4">
            {/* App Icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-md flex-shrink-0">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-base">
                Install SocialScope
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Add to your home screen for faster access
              </p>

              {/* Quick instruction based on browser */}
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                {isIOSSafari ? (
                  <>
                    <span>Tap</span>
                    <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#007aff]/10">
                      <Share className="w-4 h-4 text-[#007aff]" />
                    </div>
                    <span>then</span>
                    <div className="inline-flex items-center justify-center px-2 py-1 rounded bg-muted text-foreground font-medium">
                      <Plus className="w-3 h-3 mr-1" />
                      Add to Home Screen
                    </div>
                  </>
                ) : (
                  <span className="text-amber-500">
                    Open in Safari for the best experience
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action button for non-Safari browsers */}
        {!isIOSSafari && (
          <div className="px-4 pb-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                // Copy URL to clipboard for easy pasting in Safari
                navigator.clipboard.writeText(window.location.href);
                handleDismiss();
              }}
            >
              Copy Link to Open in Safari
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IOSInstallBanner;
