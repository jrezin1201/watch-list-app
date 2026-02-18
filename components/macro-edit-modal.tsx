"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MacroRegime } from "@/lib/db";

interface MacroEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  macro: MacroRegime | null;
  onSave: () => void;
}

export function MacroEditModal({ open, onOpenChange, macro, onSave }: MacroEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [riskOnPct, setRiskOnPct] = useState(50);
  const [liquidity, setLiquidity] = useState("Neutral");
  const [credit, setCredit] = useState("Healthy");
  const [btcStatus, setBtcStatus] = useState("Unknown");

  useEffect(() => {
    if (macro) {
      setRiskOnPct(macro.risk_on_pct);
      setLiquidity(macro.liquidity);
      setCredit(macro.credit);
      setBtcStatus(macro.btc_status);
    }
  }, [macro, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/macro", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          risk_on_pct: riskOnPct,
          liquidity,
          credit,
          btc_status: btcStatus,
        }),
      });
      onSave();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Macro Regime</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Risk-On %: {riskOnPct}%</Label>
            <Slider
              value={[riskOnPct]}
              onValueChange={(v) => setRiskOnPct(v[0])}
              min={0}
              max={100}
              step={5}
            />
          </div>
          <div className="space-y-2">
            <Label>Liquidity</Label>
            <Select value={liquidity} onValueChange={setLiquidity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Expanding">Expanding</SelectItem>
                <SelectItem value="Neutral">Neutral</SelectItem>
                <SelectItem value="Contracting">Contracting</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Credit</Label>
            <Select value={credit} onValueChange={setCredit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Healthy">Healthy</SelectItem>
                <SelectItem value="Cautious">Cautious</SelectItem>
                <SelectItem value="Stressed">Stressed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>BTC Status</Label>
            <Input
              value={btcStatus}
              onChange={(e) => setBtcStatus(e.target.value)}
              placeholder="Above 200D"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
