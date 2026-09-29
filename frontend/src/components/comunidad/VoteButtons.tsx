import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoteButtonsProps {
  upCount: number;
  downCount: number;
  score: number;
  currentUserVote?: "UP" | "DOWN" | null;
  onVote: (tipo: "UP" | "DOWN") => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function VoteButtons({
  upCount,
  downCount,
  score,
  currentUserVote,
  onVote,
  disabled = false,
  size = "md",
}: VoteButtonsProps) {
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const btnSize = size === "sm" ? "h-7 w-7" : "h-8 w-8";

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          btnSize,
          "p-0",
          currentUserVote === "UP"
            ? "text-green-500 hover:text-green-600"
            : "text-muted-foreground hover:text-green-500"
        )}
        onClick={() => onVote("UP")}
        disabled={disabled}
      >
        <ChevronUp className={iconSize} />
      </Button>
      <span
        className={cn(
          "text-sm font-medium min-w-[24px] text-center",
          score > 0 && "text-green-500",
          score < 0 && "text-red-500"
        )}
      >
        {score}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          btnSize,
          "p-0",
          currentUserVote === "DOWN"
            ? "text-red-500 hover:text-red-600"
            : "text-muted-foreground hover:text-red-500"
        )}
        onClick={() => onVote("DOWN")}
        disabled={disabled}
      >
        <ChevronDown className={iconSize} />
      </Button>
    </div>
  );
}
