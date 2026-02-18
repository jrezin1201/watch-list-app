"use client";

interface UpsideBadgeProps {
  pct: number | null;
}

export function UpsideBadge({ pct }: UpsideBadgeProps) {
  if (pct === null) return <span className="text-xs text-muted-foreground">—</span>;
  const color =
    pct >= 20 ? "text-green-400" : pct >= 0 ? "text-yellow-400" : pct >= -10 ? "text-orange-400" : "text-red-400";

  return (
    <span className={`font-mono text-sm font-medium ${color}`}>
      {pct > 0 ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}
