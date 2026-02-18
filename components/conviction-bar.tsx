"use client";

interface ConvictionBarProps {
  value: number; // 0-10
}

export function ConvictionBar({ value }: ConvictionBarProps) {
  const pct = Math.min(Math.max(value, 0), 10) * 10;
  const color =
    pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-1.5">
      <div className="h-2 w-12 rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{value}</span>
    </div>
  );
}
