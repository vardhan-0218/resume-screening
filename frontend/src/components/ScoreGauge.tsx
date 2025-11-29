interface ScoreGaugeProps {
  score: number;
  label?: string;
  key?: string;
}

export const ScoreGauge = ({ score, label = "Match Score" }: ScoreGaugeProps) => {
  // Validate and clamp score between 0 and 100
  const validScore = Math.max(0, Math.min(100, Math.round(score) || 0));
  
  console.log("🎯 ScoreGauge: Rendering score:", validScore);
  
  const strokeWidth = 12;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (validScore / 100) * circumference;

  const getScoreColorVar = (score: number) => {
    if (score >= 80) return "hsl(var(--success))";
    if (score >= 60) return "hsl(var(--accent))";
    return "hsl(var(--warning))";
  };
  
  return (
    <div className="flex flex-col items-center gap-4 animate-scale-in">
      <div className="relative w-52 h-52">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
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
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {validScore}%
          </span>
          <span className="text-sm text-muted-foreground mt-1">{label}</span>
        </div>
      </div>
    </div>
  );
};