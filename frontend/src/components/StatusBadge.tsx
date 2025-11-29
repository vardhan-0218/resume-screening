import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  isShortlisted: boolean;
  className?: string;
}

export const StatusBadge = ({ isShortlisted, className }: StatusBadgeProps) => {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-base animate-scale-in",
        isShortlisted
          ? "bg-gradient-success text-success-foreground shadow-lg shadow-success/30"
          : "bg-gradient-to-r from-warning to-destructive text-warning-foreground shadow-lg shadow-destructive/30",
        className
      )}
    >
      {isShortlisted ? (
        <>
          <CheckCircle2 className="w-5 h-5" />
          <span>Shortlisted ✅</span>
        </>
      ) : (
        <>
          <XCircle className="w-5 h-5" />
          <span>Needs Improvement ❌</span>
        </>
      )}
    </div>
  );
};
