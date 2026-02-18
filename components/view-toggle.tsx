"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChart3, Globe, TrendingUp } from "lucide-react";

export type ViewMode = "valuation" | "macro" | "options";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as ViewMode)}
      className="border border-border/50 rounded-lg p-0.5"
    >
      <ToggleGroupItem value="valuation" aria-label="Valuation View" className="gap-1.5 text-xs px-3">
        <BarChart3 className="h-3.5 w-3.5" />
        Valuation
      </ToggleGroupItem>
      <ToggleGroupItem value="macro" aria-label="Macro-Aware View" className="gap-1.5 text-xs px-3">
        <Globe className="h-3.5 w-3.5" />
        Macro
      </ToggleGroupItem>
      <ToggleGroupItem value="options" aria-label="Options View" className="gap-1.5 text-xs px-3">
        <TrendingUp className="h-3.5 w-3.5" />
        Options
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
