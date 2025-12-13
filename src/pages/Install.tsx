import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Download, Check, Smartphone, AudioWaveform, ArrowRight } from 'lucide-react';
import IOSInstallGuide from '@/components/IOSInstallGuide';
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
      {/* Background Effects - hidden on mobile for cleaner look */}
      <div className="fixed inset-0 pointer-events-none hidden md:block">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] animate-pulse-slow" style={{
        animationDelay: '1.5s'
      }} />
      </div>

      <header className="relative z-20 border-b border-border/30 backdrop-blur-md">
        <div className="container py-3 md:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-primary flex items-center justify-center">
              <AudioWaveform className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
            </div>
            <span className="text-lg md:text-xl font-serif font-semibold text-foreground">SocialScope</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 container py-6 md:py-20 px-4">
        <div className="max-w-lg mx-auto text-center space-y-5 md:space-y-8">
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-gradient-primary flex items-center justify-center mx-auto shadow-lg">
            <Smartphone className="w-8 h-8 md:w-12 md:h-12 text-primary-foreground" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl font-serif">Install SocialScope</h1>
            <p className="text-sm md:text-lg text-muted-foreground">
              Add to your home screen for the best experience
            </p>
          </div>

          {/* Native Install Button (Chrome/Edge) */}
          {isInstallable && <div className="space-y-3">
              <Button variant="gradient" size="lg" onClick={handleInstallClick} className="w-full">
                <Download className="w-5 h-5" />
                Install Now
              </Button>
              <p className="text-xs md:text-sm text-muted-foreground">
                One tap to install — no app store needed
              </p>
            </div>}

          {/* iOS Instructions with Animated Guide */}
          {isIOS && !isInstallable && <IOSInstallGuide />}

          {/* Android Instructions (fallback if beforeinstallprompt didn't fire) */}
          {!isIOS && !isInstallable && <div className="glass rounded-xl md:rounded-2xl p-4 md:p-6 text-left space-y-4">
              <h2 className="text-base md:text-lg font-medium text-center">How to Install</h2>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Tap ⋮ menu in your browser</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Tap "Install app" or "Add to Home Screen"</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Confirm the installation</p>
                  </div>
                </div>
              </div>
            </div>}

          {/* Done Button */}
          <div className="pt-2 md:pt-4 space-y-2 md:space-y-4">
            <Button variant="gradient" size="lg" onClick={handleDone} className="w-full">
              <Check className="w-5 h-5" />
              Continue to Sign In
            </Button>
            <p className="text-xs md:text-sm text-muted-foreground">
              Already installed? Tap above to continue.
            </p>
          </div>
        </div>
      </main>
    </div>;
};
export default Install;