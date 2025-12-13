import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Download, Share, PlusSquare, Check, Smartphone, AudioWaveform, ArrowRight } from 'lucide-react';
const Install = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    isInstalled,
    isInstallable,
    isIOS,
    promptInstall
  } = usePwaInstall();

  // Auto-redirect if already installed and logged in
  useEffect(() => {
    if (isInstalled && user) {
      navigate('/record');
    }
  }, [isInstalled, user, navigate]);
  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await promptInstall();
      if (success) {
        // Give time for the install to complete, then redirect
        setTimeout(() => navigate('/auth'), 1000);
      }
    }
  };
  const handleDone = () => {
    navigate('/auth');
  };

  // Already installed - redirect to auth
  if (isInstalled) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-serif">App Already Installed!</h1>
          <p className="text-muted-foreground">
            SocialScope is ready to use. Let's get you signed in.
          </p>
          <Button variant="gradient" size="lg" onClick={handleDone} className="w-full">
            Continue to Sign In
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] animate-pulse-slow" style={{
        animationDelay: '1.5s'
      }} />
      </div>

      <header className="relative z-20 border-b border-border/30 backdrop-blur-md">
        <div className="container py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <AudioWaveform className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-serif font-semibold text-foreground">SocialScope</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 container py-12 md:py-20">
        <div className="max-w-lg mx-auto text-center space-y-8">
          <div className="w-24 h-24 rounded-3xl bg-gradient-primary flex items-center justify-center mx-auto shadow-lg">
            <Smartphone className="w-12 h-12 text-primary-foreground" />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-serif">Install SocialScope</h1>
            <p className="text-lg text-muted-foreground">
              Add the app to your home screen for the best experience
            </p>
          </div>

          {/* Native Install Button (Chrome/Edge) */}
          {isInstallable && <div className="space-y-4">
              <Button variant="gradient" size="xl" onClick={handleInstallClick} className="w-full">
                <Download className="w-5 h-5" />
                Install Now
              </Button>
              <p className="text-sm text-muted-foreground">
                One tap to install — no app store needed
              </p>
            </div>}

          {/* iOS Instructions */}
          {isIOS && !isInstallable && <div className="glass rounded-2xl p-6 text-left space-y-6">
              <h2 className="text-lg font-medium text-center">How to Install on iPhone</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Tap the Share button</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      Look for <Share className="w-4 h-4" /> at the bottom of Safari
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Tap "Add to Home Screen"</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      Look for <PlusSquare className="w-4 h-4" /> in the menu
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Tap "Add" to confirm</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The app will appear on your home screen
                    </p>
                  </div>
                </div>
              </div>
            </div>}

          {/* Android Instructions (fallback if beforeinstallprompt didn't fire) */}
          {!isIOS && !isInstallable && <div className="glass rounded-2xl p-6 text-left space-y-6">
              <h2 className="text-lg font-medium text-center">How to Install</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Open browser menu</p>
                    <p className="text-sm text-muted-foreground mt-1">Tap the three dots (⋮) in your browser</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Tap "Install app" or "Add to Home Screen"</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      This will add the app to your device
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Confirm the installation</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The app will appear on your home screen
                    </p>
                  </div>
                </div>
              </div>
            </div>}

          {/* Done Button */}
          <div className="pt-4 space-y-4">
            <Button variant="gradient" size="lg" onClick={handleDone} className="w-full">
              <Check className="w-5 h-5" />
              Done — Continue to Sign In
            </Button>
            <p className="text-sm text-muted-foreground">
              Already installed the app? Tap above to continue.
            </p>
          </div>
        </div>
      </main>
    </div>;
};
export default Install;