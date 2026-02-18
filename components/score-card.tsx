"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ScoreCardProps {
  title: string;
  score: number | null;
  subScores?: { label: string; value: number }[];
}

export function ScoreCard({ title, score, subScores }: ScoreCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (score === null) {
    return (
      <div className="rounded-lg border border-border/50 p-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-lg font-bold text-muted-foreground">—</p>
      </div>
    );
  }

  const color =
    score >= 7 ? "text-green-400" : score >= 5 ? "text-yellow-400" : "text-red-400";
  const barColor =
    score >= 7 ? "bg-green-500" : score >= 5 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="rounded-lg border border-border/50 p-3">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => subScores && setExpanded(!expanded)}
      >
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${color}`}>{score.toFixed(1)}</span>
          {subScores && (
            expanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${(score / 10) * 100}%` }} />
      </div>
      {expanded && subScores && (
        <div className="mt-2 space-y-1">
          {subScores.map((s) => (
            <div key={s.label} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="font-mono">{s.value}/10</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
