"use client";

import { Badge } from "@/components/ui/badge";

interface AllocationChipProps {
  allocation: string | null;
}

const allocationConfig: Record<string, { label: string; className: string }> = {
  starter: {
    label: "Starter",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  half: {
    label: "Half",
    className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  full_send: {
    label: "Full Send",
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  options_only: {
    label: "Options",
    className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
};

export function AllocationChip({ allocation }: AllocationChipProps) {
  if (!allocation) return <span className="text-xs text-muted-foreground">—</span>;
  const config = allocationConfig[allocation];
  if (!config) return <span className="text-xs text-muted-foreground">{allocation}</span>;

  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
}
