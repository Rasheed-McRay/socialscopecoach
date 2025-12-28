import { useState } from 'react';
import { Copy, Check, ExternalLink, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isInAppBrowser, getInAppBrowserName, isIOSDevice } from '@/lib/browserDetection';

export const InAppBrowserWarning = () => {
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !isInAppBrowser()) {
    return null;
  }

  const browserName = getInAppBrowserName();
  const isIOS = isIOSDevice();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-sm w-full space-y-6">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
          {isIOS ? (
            <Compass className="w-10 h-10 text-primary" />
          ) : (
            <ExternalLink className="w-10 h-10 text-primary" />
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Open in {isIOS ? 'Safari' : 'Browser'}
          </h1>
          <p className="text-muted-foreground">
            You're viewing this in {browserName}. For the best experience and to install the app, please open in {isIOS ? 'Safari' : 'your browser'}.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-3 text-left">
          <p className="text-sm font-medium text-foreground">How to open:</p>
          <ol className="text-sm text-muted-foreground space-y-2">
            <li className="flex gap-2">
              <span className="font-semibold text-primary">1.</span>
              <span>Tap the button below to copy the link</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-primary">2.</span>
              <span>Open {isIOS ? 'Safari' : 'Chrome or your browser'}</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-primary">3.</span>
              <span>Paste the link in the address bar</span>
            </li>
          </ol>
        </div>

        {/* Copy Button */}
        <Button 
          onClick={handleCopyLink} 
          className="w-full h-12 text-base gap-2"
          size="lg"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5" />
              Link Copied!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              Copy Link
            </>
          )}
        </Button>

        {/* Dismiss option */}
        <button
          onClick={() => setDismissed(true)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Continue anyway
        </button>
      </div>
    </div>
  );
};
