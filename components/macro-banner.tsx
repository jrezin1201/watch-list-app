"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import type { MacroRegime } from "@/lib/db";

interface MacroBannerProps {
  macro: MacroRegime | null;
  onEdit: () => void;
}

function getLiquidityColor(v: string) {
  if (v === "Expanding") return "bg-green-500/20 text-green-400 border-green-500/30";
  if (v === "Contracting") return "bg-red-500/20 text-red-400 border-red-500/30";
  return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
}

function getCreditColor(v: string) {
  if (v === "Healthy") return "bg-green-500/20 text-green-400 border-green-500/30";
  if (v === "Stressed") return "bg-red-500/20 text-red-400 border-red-500/30";
  return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
}

function getRiskOnColor(pct: number) {
  if (pct >= 70) return "bg-green-500/20 text-green-400 border-green-500/30";
  if (pct >= 40) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
}

export function MacroBanner({ macro, onEdit }: MacroBannerProps) {
  if (!macro) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/50 bg-card/30 px-4 py-2">
      <Badge variant="outline" className={getRiskOnColor(macro.risk_on_pct)}>
        Risk-On {macro.risk_on_pct}%
      </Badge>
      <Badge variant="outline" className={getLiquidityColor(macro.liquidity)}>
        Liquidity: {macro.liquidity}
      </Badge>
      <Badge variant="outline" className={getCreditColor(macro.credit)}>
        Credit: {macro.credit}
      </Badge>
      <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
        BTC: {macro.btc_status}
      </Badge>
      <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={onEdit}>
        <Settings className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
