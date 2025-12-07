import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  AudioWaveform, 
  ArrowRight, 
  Mic, 
  Brain, 
  TrendingUp, 
  Shield, 
  Sparkles,
  CheckCircle,
  Loader2,
  Mail,
  Lock
} from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Landing = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(email);
    const passwordResult = passwordSchema.safeParse(password);
    
    if (!emailResult.success) {
      toast({ title: 'Invalid email', description: emailResult.error.errors[0].message, variant: 'destructive' });
      return;
    }
    if (!passwordResult.success) {
      toast({ title: 'Invalid password', description: passwordResult.error.errors[0].message, variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
          return;
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
          return;
        }
        toast({ title: 'Welcome!', description: 'Your account has been created.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Mic,
      title: "Record or Upload",
      description: "Capture any conversation in seconds. Record live or upload existing audio."
    },
    {
      icon: Brain,
      title: "AI Analysis",
      description: "Our AI dissects every nuance—tone, confidence, word choice, and emotional impact."
    },
    {
      icon: TrendingUp,
      title: "Get Your Score",
      description: "Receive a detailed breakdown with actionable insights to level up your social game."
    }
  ];

  const benefits = [
    "Understand how others perceive you",
    "Identify nervous habits holding you back",
    "Master the art of confident communication",
    "Build deeper, more meaningful connections"
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-border/30 backdrop-blur-md">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <AudioWaveform className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-serif font-semibold text-foreground">SocialScope</span>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={() => { setShowAuth(true); setIsLogin(true); }}
            className="text-muted-foreground hover:text-foreground"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium animate-fade-in">
            <Sparkles className="w-4 h-4" />
            AI-Powered Conversation Intelligence
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Stop <span className="text-gradient-primary">Wondering</span> What People{" "}
            <span className="italic">Really</span> Think of You
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Every conversation is a chance to connect—or a missed opportunity. 
            Finally see yourself through others' eyes and unlock the confidence you deserve.
          </p>

          {/* Quick Auth Form */}
          {!showAuth ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Button 
                variant="gradient" 
                size="xl"
                onClick={() => setShowAuth(true)}
                className="group"
              >
                Analyze Your First Conversation
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="text-sm text-muted-foreground">Free to start • No credit card</p>
            </div>
          ) : (
            <div className="max-w-md mx-auto animate-scale-in">
              <div className="glass p-8 rounded-2xl shadow-elevated">
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !isLogin ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Sign Up
                  </button>
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isLogin ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Sign In
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-secondary/50"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-secondary/50"
                      required
                    />
                  </div>
                  <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Please wait...</>
                    ) : (
                      isLogin ? 'Sign In' : 'Create Free Account'
                    )}
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="relative z-10 py-20 bg-gradient-card">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6 mb-16">
            <h2 className="text-3xl md:text-4xl font-serif">
              Have You Ever Left a Conversation Thinking...
            </h2>
            <div className="space-y-4 text-lg text-muted-foreground italic">
              <p>"Did I talk too much?"</p>
              <p>"Why did things get awkward?"</p>
              <p>"I wish I knew what they were really thinking..."</p>
            </div>
            <p className="text-xl text-foreground pt-4 not-italic">
              <strong className="text-primary">You're not alone.</strong> Most of us navigate social situations blind—
              guessing, hoping, but never really <em>knowing</em>.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-20 container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif mb-4">
            How <span className="text-gradient-primary">SocialScope</span> Works
          </h2>
          <p className="text-muted-foreground text-lg">Three simple steps to social clarity</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="glass p-8 rounded-2xl text-center group hover:border-primary/30 transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="text-sm text-primary font-medium mb-2">Step {index + 1}</div>
              <h3 className="text-xl font-serif mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-20 bg-gradient-card">
        <div className="container">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-serif">
                Imagine Knowing <span className="text-gradient-primary">Exactly</span> How You Come Across
              </h2>
              <p className="text-lg text-muted-foreground">
                No more second-guessing. No more social anxiety keeping you up at night. 
                Just clear, actionable feedback that transforms how you connect with others.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3 text-foreground">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="glass p-8 rounded-2xl">
              <div className="text-center space-y-4">
                <div className="text-6xl font-serif text-gradient-primary">87%</div>
                <p className="text-muted-foreground">
                  of users report feeling more confident in conversations after just one week
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="relative z-10 py-16 container">
        <div className="max-w-2xl mx-auto text-center glass p-8 rounded-2xl">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-serif mb-3">Your Privacy is Sacred</h3>
          <p className="text-muted-foreground">
            Your audio is processed and immediately deleted. We never store your conversations. 
            Your insights are yours alone.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20 container">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-serif">
            Ready to <span className="text-gradient-primary">Transform</span> Your Conversations?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands who are building stronger connections and unshakeable confidence.
          </p>
          <Button 
            variant="gradient" 
            size="xl"
            onClick={() => { setShowAuth(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="group"
          >
            Start Your Free Analysis
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Built with care for better human connection</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
