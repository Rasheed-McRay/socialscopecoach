import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Target, Lightbulb, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FocusExamplesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  focusArea: string;
}

interface FocusExamples {
  examples: string[];
  whyItHelps: string;
}

// Cache storage for focus examples
const focusCache = new Map<string, FocusExamples>();

export const FocusExamplesDialog = ({ open, onOpenChange, focusArea }: FocusExamplesDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FocusExamples | null>(null);

  useEffect(() => {
    if (open && focusArea) {
      // Check cache first
      const cached = focusCache.get(focusArea);
      if (cached) {
        setData(cached);
        return;
      }

      // Generate if not cached
      generateExamples();
    }
  }, [open, focusArea]);

  const generateExamples = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-focus-examples", {
        body: { focusArea },
      });

      if (error) throw error;

      // Cache the result
      focusCache.set(focusArea, result);
      setData(result);
    } catch (error) {
      console.error("Error generating examples:", error);
      toast.error("Failed to generate examples");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Your Main Focus
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Focus Area - full text display */}
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-sm md:text-base font-medium text-primary leading-relaxed">{focusArea}</p>
          </div>

          {/* Examples Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Try it like this
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : data?.examples ? (
              <div className="space-y-2">
                {data.examples.map((example, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground border border-border/50"
                  >
                    "{example}"
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Why It Helps */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              Why this helps
            </div>

            {loading ? (
              <Skeleton className="h-16 w-full rounded-lg" />
            ) : data?.whyItHelps ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {data.whyItHelps}
              </p>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
