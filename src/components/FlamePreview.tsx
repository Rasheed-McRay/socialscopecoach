import { Flame } from 'lucide-react';

const flameLevels = [
  { days: 0, label: "0 days", description: "Inactive" },
  { days: 1, label: "1-2 days", description: "Getting started" },
  { days: 3, label: "3-6 days", description: "Building momentum" },
  { days: 7, label: "7-13 days", description: "Week Warrior 🏅" },
  { days: 14, label: "14-29 days", description: "Two-Week Titan ⭐" },
  { days: 30, label: "30+ days", description: "Monthly Master 👑" },
];

function getFlameStyles(days: number) {
  if (days === 0) {
    return {
      className: "text-muted-foreground opacity-40",
      size: 24,
      style: {} as React.CSSProperties,
    };
  }
  if (days <= 2) {
    return {
      className: "text-orange-400 animate-pulse",
      size: 24,
      style: { animationDuration: "2s" } as React.CSSProperties,
    };
  }
  if (days <= 6) {
    return {
      className: "text-orange-500 animate-pulse",
      size: 28,
      style: { 
        animationDuration: "1s",
        filter: "drop-shadow(0 0 4px rgba(249, 115, 22, 0.5))"
      } as React.CSSProperties,
    };
  }
  if (days <= 13) {
    return {
      className: "text-orange-500",
      size: 32,
      style: { 
        animation: "flame-bounce 1s ease-in-out infinite",
        filter: "drop-shadow(0 0 8px rgba(249, 115, 22, 0.7))"
      } as React.CSSProperties,
    };
  }
  if (days <= 29) {
    return {
      className: "text-amber-400",
      size: 36,
      style: { 
        animation: "flame-intense 1s ease-in-out infinite",
        filter: "drop-shadow(0 0 12px rgba(251, 191, 36, 0.8))"
      } as React.CSSProperties,
    };
  }
  // 30+ days - legendary
  return {
    className: "text-violet-400",
    size: 40,
    style: { 
      animation: "flame-legendary 1s ease-in-out infinite",
      filter: "drop-shadow(0 0 16px rgba(167, 139, 250, 0.9))"
    } as React.CSSProperties,
  };
}

export function FlamePreview() {
  return (
    <div className="p-6 space-y-6">
      <style>{`
        @keyframes flame-bounce {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.1) translateY(-2px); }
        }
        @keyframes flame-intense {
          0%, 100% { transform: scale(1) translateY(0) rotate(-2deg); }
          25% { transform: scale(1.15) translateY(-3px) rotate(2deg); }
          50% { transform: scale(1.1) translateY(-1px) rotate(-1deg); }
          75% { transform: scale(1.2) translateY(-4px) rotate(1deg); }
        }
        @keyframes flame-legendary {
          0%, 100% { transform: scale(1) translateY(0); filter: hue-rotate(0deg); }
          25% { transform: scale(1.15) translateY(-3px); filter: hue-rotate(10deg); }
          50% { transform: scale(1.1) translateY(-2px); filter: hue-rotate(-10deg); }
          75% { transform: scale(1.2) translateY(-4px); filter: hue-rotate(5deg); }
        }
      `}</style>
      
      <h2 className="text-xl font-bold text-foreground">Flame Animation Preview</h2>
      <p className="text-sm text-muted-foreground">Preview of flame effects at each streak level</p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {flameLevels.map((level) => {
          const styles = getFlameStyles(level.days);
          const isDouble = level.days >= 14 && level.days < 30;
          const isLegendary = level.days >= 30;
          
          return (
            <div 
              key={level.days}
              className="flex flex-col items-center gap-3 p-4 rounded-xl bg-card border border-border"
            >
              <div className="relative flex items-center justify-center h-16">
                {isDouble && (
                  <Flame 
                    className={`absolute -left-2 ${styles.className}`}
                    size={styles.size * 0.7}
                    style={{ ...styles.style, opacity: 0.6 }}
                  />
                )}
                <Flame 
                  className={styles.className}
                  size={styles.size}
                  style={styles.style}
                />
                {isDouble && (
                  <Flame 
                    className={`absolute -right-2 ${styles.className}`}
                    size={styles.size * 0.7}
                    style={{ ...styles.style, opacity: 0.6 }}
                  />
                )}
                {isLegendary && (
                  <>
                    <Flame 
                      className={`absolute -left-3 ${styles.className}`}
                      size={styles.size * 0.6}
                      style={{ ...styles.style, opacity: 0.5 }}
                    />
                    <Flame 
                      className={`absolute -right-3 ${styles.className}`}
                      size={styles.size * 0.6}
                      style={{ ...styles.style, opacity: 0.5 }}
                    />
                  </>
                )}
              </div>
              
              <div className="text-center">
                <p className="font-semibold text-foreground">{level.label}</p>
                <p className="text-xs text-muted-foreground">{level.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
