import { Link } from "react-router-dom";
import { AudioWaveform } from "lucide-react";

export function AppHeader() {
  return (
    <header className="relative z-10 border-b border-primary/10 backdrop-blur-sm safe-area-top">
      <div className="px-4 py-3">
        <div className="flex items-center justify-center">
          <Link to="/app" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center glow-primary">
              <AudioWaveform className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-serif font-semibold text-foreground">
                SocialScope
              </h1>
              <p className="text-[9px] text-muted-foreground">
                AI Conversation Coach
              </p>
            </div>
          </Link>
        </div>
      </div>
      <div className="h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </header>
  );
}
