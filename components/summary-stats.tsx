"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Stock } from "@/lib/db";

interface SummaryStatsProps {
  stocks: Stock[];
}

export function SummaryStats({ stocks }: SummaryStatsProps) {
  const total = stocks.length;
  const extended = stocks.filter((s) => s.status === "extended").length;
  const watchZone = stocks.filter((s) => s.status === "watch_zone").length;
  const buyZone = stocks.filter((s) => s.status === "buy_zone").length;
  const avoid = stocks.filter((s) => s.status === "avoid").length;

  const avgPctAbove =
    total > 0
      ? stocks.reduce((acc, s) => {
          if (s.current_price === null) return acc;
          const pct =
            ((Number(s.current_price) - Number(s.buy_target)) /
              Number(s.buy_target)) *
            100;
          return acc + pct;
        }, 0) /
        (stocks.filter((s) => s.current_price !== null).length || 1)
      : 0;

  const stats = [
    { label: "Total Tracked", value: total, color: "text-foreground" },
    { label: "Extended", value: extended, color: "text-red-400" },
    { label: "Watch Zone", value: watchZone, color: "text-yellow-400" },
    { label: "Buy Zone", value: buyZone, color: "text-green-400" },
    { label: "Avoid", value: avoid, color: "text-zinc-400" },
    {
      label: "Avg % Above Target",
      value: isNaN(avgPctAbove) ? "N/A" : `${avgPctAbove.toFixed(1)}%`,
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
