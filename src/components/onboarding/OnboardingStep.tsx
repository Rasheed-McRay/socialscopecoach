import { ReactNode } from "react";
import { motion } from "framer-motion";

interface OnboardingStepProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export const OnboardingStep = ({ title, subtitle, children }: OnboardingStepProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground text-lg">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </motion.div>
  );
};
