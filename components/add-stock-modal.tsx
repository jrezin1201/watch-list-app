"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Stock } from "@/lib/db";

interface AddStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  editingStock?: Stock | null;
}

export function AddStockModal({
  open,
  onOpenChange,
  onSave,
  editingStock,
}: AddStockModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    ticker: "",
    company_name: "",
    sector: "",
    fair_value: "",
    buy_target: "",
    peg_ratio: "",
    thesis: "",
    risk_notes: "",
  });

  useEffect(() => {
    if (editingStock) {
      setForm({
        ticker: editingStock.ticker,
        company_name: editingStock.company_name,
        sector: editingStock.sector || "",
        fair_value: String(editingStock.fair_value),
        buy_target: String(editingStock.buy_target),
        peg_ratio: editingStock.peg_ratio ? String(editingStock.peg_ratio) : "",
        thesis: editingStock.thesis || "",
        risk_notes: editingStock.risk_notes || "",
      });
    } else {
      setForm({
        ticker: "",
        company_name: "",
        sector: "",
        fair_value: "",
        buy_target: "",
        peg_ratio: "",
        thesis: "",
        risk_notes: "",
      });
    }
    setError(null);
  }, [editingStock, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ticker: form.ticker.toUpperCase(),
        company_name: form.company_name,
        sector: form.sector || undefined,
        fair_value: Number(form.fair_value),
        buy_target: Number(form.buy_target),
        peg_ratio: form.peg_ratio ? Number(form.peg_ratio) : undefined,
        thesis: form.thesis || undefined,
        risk_notes: form.risk_notes || undefined,
      };

      const url = editingStock
        ? `/api/stocks/${editingStock.id}`
        : "/api/stocks";
      const method = editingStock ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save stock");
      }

      onSave();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingStock ? "Edit Stock" : "Add Stock to Watchlist"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticker">Ticker *</Label>
              <Input
                id="ticker"
                placeholder="AAPL"
                value={form.ticker}
                onChange={(e) => setForm({ ...form, ticker: e.target.value })}
                required
                disabled={!!editingStock}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Input
                id="sector"
                placeholder="Technology"
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name *</Label>
            <Input
              id="company_name"
              placeholder="Apple Inc."
              value={form.company_name}
              onChange={(e) =>
                setForm({ ...form, company_name: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fair_value">Fair Value *</Label>
              <Input
                id="fair_value"
                type="number"
                step="0.01"
                placeholder="150.00"
                value={form.fair_value}
                onChange={(e) =>
                  setForm({ ...form, fair_value: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buy_target">Buy Target *</Label>
              <Input
                id="buy_target"
                type="number"
                step="0.01"
                placeholder="130.00"
                value={form.buy_target}
                onChange={(e) =>
                  setForm({ ...form, buy_target: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="peg_ratio">PEG Ratio</Label>
              <Input
                id="peg_ratio"
                type="number"
                step="0.01"
                placeholder="1.50"
                value={form.peg_ratio}
                onChange={(e) =>
                  setForm({ ...form, peg_ratio: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thesis">Investment Thesis</Label>
            <Textarea
              id="thesis"
              placeholder="Why do you like this company?"
              value={form.thesis}
              onChange={(e) => setForm({ ...form, thesis: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="risk_notes">Risk Notes</Label>
            <Textarea
              id="risk_notes"
              placeholder="Key risks and what could go wrong..."
              value={form.risk_notes}
              onChange={(e) =>
                setForm({ ...form, risk_notes: e.target.value })
              }
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : editingStock
                  ? "Update Stock"
                  : "Add Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
