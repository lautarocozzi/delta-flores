import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DirectAccessButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  className?: string;
}

export const DirectAccessButton = ({
  icon: Icon,
  label,
  onClick,
  className,
}: DirectAccessButtonProps) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-3 p-6 rounded-xl",
        "bg-card border-2 border-border",
        "hover:border-primary hover:shadow-lg hover:shadow-primary/20",
        "min-h-[120px] w-full overflow-hidden",
        "transition-colors duration-200",
        className
      )}
    >
      {/* Animated background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:via-primary/5 group-hover:to-transparent transition-all duration-300" />

      {/* Shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      </div>

      {/* Icon with enhanced hover */}
      <div className="relative">
        <Icon
          className={cn(
            "w-8 h-8 transition-all duration-300",
            "text-primary group-hover:text-primary",
            "group-hover:drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]"
          )}
          strokeWidth={2}
        />
        {/* Icon glow */}
        <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-150" />
      </div>

      {/* Label */}
      <span className={cn(
        "relative text-sm font-semibold text-center transition-colors duration-200",
        "text-foreground group-hover:text-primary"
      )}>
        {label}
      </span>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary group-hover:w-2/3 transition-all duration-300 rounded-full" />
    </motion.button>
  );
};
