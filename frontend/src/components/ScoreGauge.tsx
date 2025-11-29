import { useEffect, useState } from "react";

interface ScoreGaugeProps {
  score: number;
  label?: string;
  key?: string;
}

export const ScoreGauge = ({ score, label = "Match Score" }: ScoreGaugeProps) => {
  // Validate and clamp score between 0 and 100
  const validScore = Math.max(0, Math.min(100, Math.round(score) || 0));
  
  // Force animation restart on score change
  const [animationKey, setAnimationKey] = useState<number>(0);
  
  useEffect(() => {
    console.log("🎯 ScoreGauge: New score received:", validScore);
    setAnimationKey(prev => prev + 1);
  }, [validScore]);
  
  const strokeWidth = 12;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (validScore / 100) * circumference;

  const getScoreColorVar = (score: number) => {
    if (score >= 80) return "hsl(var(--success))";
    if (score >= 60) return "hsl(var(--accent))";
    return "hsl(var(--warning))";
  };

  console.log("🔄 ScoreGauge: Rendering with score:", validScore, "Animation Key:", animationKey, "Timestamp:", Date.now());
  console.log("🎯 ScoreGauge: Stroke offset calculated:", offset, "Circumference:", circumference);
  
  return (
    <div className="flex flex-col items-center gap-4" key={`score-gauge-${validScore}-${animationKey}-${Date.now()}`}>
      <div className="relative w-52 h-52" key={`gauge-svg-${validScore}-${animationKey}`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200" key={`svg-${validScore}-${animationKey}`}>
          {/* Background circle */}
          <circle
            key={`bg-circle-${animationKey}`}
            cx="100"
            cy="100"
            r={radius}
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            key={`progress-circle-${validScore}-${animationKey}`}
            cx="100"
            cy="100"
            r={radius}
            stroke={getScoreColorVar(validScore)}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out drop-shadow-lg"
            data-animation-key={animationKey}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" key={`score-text-${validScore}-${animationKey}`}>
          <span className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent" key={`score-value-${validScore}`}>
            {validScore}%
          </span>
          <span className="text-sm text-muted-foreground mt-1" key={`score-label-${animationKey}`}>{label}</span>
        </div>
      </div>
    </div>
  );
};
