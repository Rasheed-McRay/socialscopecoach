import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface UnsavedAnalysisDialogProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export function UnsavedAnalysisDialog({ open, onStay, onLeave }: UnsavedAnalysisDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onStay()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
          </div>
          <AlertDialogTitle className="text-center text-xl">
            Unsaved Analysis
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Your analysis results haven't been saved. If you leave now, you'll lose this analysis.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-3 mt-4">
          <AlertDialogCancel onClick={onStay} className="flex-1 sm:flex-none">
            Stay & Review
          </AlertDialogCancel>
          <AlertDialogAction onClick={onLeave} className="flex-1 sm:flex-none bg-destructive hover:bg-destructive/90">
            Leave Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
