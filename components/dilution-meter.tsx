"use client";

interface DilutionMeterProps {
  pct: number | null;
}

export function DilutionMeter({ pct }: DilutionMeterProps) {
  if (pct === null) return <span className="text-xs text-muted-foreground">—</span>;

  const color =
    pct <= 0
      ? "bg-green-500/20 text-green-400"
      : pct <= 2
        ? "bg-yellow-500/20 text-yellow-400"
        : "bg-red-500/20 text-red-400";

  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-mono ${color}`}>
      {pct > 0 ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}
