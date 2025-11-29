import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkillCardProps {
  title: string;
  skills: string[];
  isMatched: boolean;
  className?: string;
}

export const SkillCard = ({ title, skills, isMatched, className }: SkillCardProps) => {
  console.log("🏷️ SkillCard: Rendering", title, "with skills:", skills, "isMatched:", isMatched);
  
  return (
    <div
      key={`skillcard-${title}-${skills.join('-')}-${Date.now()}`}
      className={cn(
        "p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] animate-slide-up",
        isMatched
          ? "bg-gradient-to-br from-success/5 to-success/10 border-success/30"
          : "bg-gradient-to-br from-warning/5 to-warning/10 border-warning/30",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        {isMatched ? (
          <CheckCircle2 className="w-6 h-6 text-success" />
        ) : (
          <XCircle className="w-6 h-6 text-warning" />
        )}
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
      </div>
      <div className="space-y-2">
        {skills.map((skill, index) => (
          <div
            key={`skill-${skill}-${index}-${isMatched}-${Date.now()}`}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium",
              isMatched
                ? "bg-success/10 text-success border border-success/20"
                : "bg-warning/10 text-warning border border-warning/20"
            )}
          >
            {skill}
          </div>
        ))}
      </div>
    </div>
  );
};
