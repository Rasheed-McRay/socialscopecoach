import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function BottomNav() {
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { icon: Home, label: 'Home', path: '/app' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
        <button
          onClick={signOut}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs font-medium">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
