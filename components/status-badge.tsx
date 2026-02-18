"use client";

import { Badge } from "@/components/ui/badge";
import type { StockStatus } from "@/lib/db";

interface StatusBadgeProps {
  status: StockStatus;
}

const statusConfig: Record<StockStatus, { label: string; className: string }> = {
  buy_zone: {
    label: "Buy Zone",
    className: "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30",
  },
  watch_zone: {
    label: "Watch Zone",
    className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30",
  },
  extended: {
    label: "Extended",
    className: "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30",
  },
  avoid: {
    label: "Avoid",
    className: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30 hover:bg-zinc-500/30",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.extended;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
