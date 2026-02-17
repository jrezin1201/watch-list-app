"use client";

import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: "overvalued" | "approaching" | "buy_zone";
}

const statusConfig = {
  overvalued: {
    label: "Overvalued",
    className: "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30",
  },
  approaching: {
    label: "Approaching",
    className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30",
  },
  buy_zone: {
    label: "Buy Zone",
    className: "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
