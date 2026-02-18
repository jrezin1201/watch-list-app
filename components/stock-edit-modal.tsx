"use client";

import { useState, useEffect, useReducer } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import type { StockWithDetails, StockTag, TriggerAlert } from "@/lib/db";

interface StockEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  editingStock?: StockWithDetails | null;
}

// Form state
interface FormState {
  // Basics
  ticker: string;
  company_name: string;
  sector: string;
  fair_value: string;
  bear_case_fv: string;
  bull_case_fv: string;
  buy_target: string;
  peg_ratio: string;
  ps_ratio: string;
  ps_ratio_5y_avg: string;
  macro_gated: boolean;
  // Scores
  revenue_growth: number;
  fcf_margin: number;
  roic: number;
  dilution: number;
  net_cash: number;
  interest_coverage: number;
  balance_dilution_risk: number;
  organic_growth: number;
  fcf_conversion: number;
  gross_margin_stability: number;
  // Thesis
  thesis: string;
  what_would_break_it: string;
  buy_triggers: string;
  sell_triggers: string;
  notes: string;
  risk_notes: string;
  // Tags & Sizing
  conviction: number;
  allocation_hint: string;
  macro_sensitivity: string[];
  narrative_phase: string;
  ownership_quality: string;
  shares_outstanding_current: string;
  shares_outstanding_prior: string;
  // Options
  iv_percentile: string;
  covered_call_yield: string;
  leap_score: string;
  // Triggers
  triggers: { id?: string; trigger_text: string; is_active: boolean }[];
  newTriggerText: string;
}

type FormAction =
  | { type: "SET_FIELD"; field: string; value: unknown }
  | { type: "SET_ALL"; state: FormState }
  | { type: "ADD_TRIGGER" }
  | { type: "REMOVE_TRIGGER"; index: number }
  | { type: "TOGGLE_TRIGGER"; index: number }
  | { type: "TOGGLE_MACRO_TAG"; value: string };

const defaultForm: FormState = {
  ticker: "",
  company_name: "",
  sector: "",
  fair_value: "",
  bear_case_fv: "",
  bull_case_fv: "",
  buy_target: "",
  peg_ratio: "",
  ps_ratio: "",
  ps_ratio_5y_avg: "",
  macro_gated: false,
  revenue_growth: 5,
  fcf_margin: 5,
  roic: 5,
  dilution: 5,
  net_cash: 5,
  interest_coverage: 5,
  balance_dilution_risk: 5,
  organic_growth: 5,
  fcf_conversion: 5,
  gross_margin_stability: 5,
  thesis: "",
  what_would_break_it: "",
  buy_triggers: "",
  sell_triggers: "",
  notes: "",
  risk_notes: "",
  conviction: 0,
  allocation_hint: "",
  macro_sensitivity: [],
  narrative_phase: "",
  ownership_quality: "",
  shares_outstanding_current: "",
  shares_outstanding_prior: "",
  iv_percentile: "",
  covered_call_yield: "",
  leap_score: "",
  triggers: [],
  newTriggerText: "",
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_ALL":
      return action.state;
    case "ADD_TRIGGER":
      if (!state.newTriggerText.trim()) return state;
      return {
        ...state,
        triggers: [...state.triggers, { trigger_text: state.newTriggerText.trim(), is_active: true }],
        newTriggerText: "",
      };
    case "REMOVE_TRIGGER":
      return { ...state, triggers: state.triggers.filter((_, i) => i !== action.index) };
    case "TOGGLE_TRIGGER":
      return {
        ...state,
        triggers: state.triggers.map((t, i) =>
          i === action.index ? { ...t, is_active: !t.is_active } : t
        ),
      };
    case "TOGGLE_MACRO_TAG": {
      const has = state.macro_sensitivity.includes(action.value);
      return {
        ...state,
        macro_sensitivity: has
          ? state.macro_sensitivity.filter((v) => v !== action.value)
          : [...state.macro_sensitivity, action.value],
      };
    }
    default:
      return state;
  }
}

const MACRO_SENSITIVITY_OPTIONS = ["Interest Rates", "Oil", "USD", "China", "Tariffs", "Consumer", "Enterprise", "Crypto"];
const NARRATIVE_PHASES = ["Pre-Revenue", "Hyper Growth", "Growth", "Mature Growth", "Value", "Turnaround", "Cyclical"];
const OWNERSHIP_OPTIONS = ["Founder-Led", "Insider Heavy", "Institutional", "Retail-Heavy", "Mixed"];
const ALLOCATION_OPTIONS = [
  { value: "starter", label: "Starter" },
  { value: "half", label: "Half" },
  { value: "full_send", label: "Full Send" },
  { value: "options_only", label: "Options Only" },
];

export function StockEditModal({
  open,
  onOpenChange,
  onSave,
  editingStock,
}: StockEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, dispatch] = useReducer(formReducer, defaultForm);

  useEffect(() => {
    if (!open) return;
    if (editingStock) {
      const macroTags = editingStock.tags
        ?.filter((t: StockTag) => t.tag_type === "macro_sensitivity")
        .map((t: StockTag) => t.tag_value) || [];
      const narrativeTag = editingStock.tags?.find((t: StockTag) => t.tag_type === "narrative_phase");
      const ownershipTag = editingStock.tags?.find((t: StockTag) => t.tag_type === "ownership_quality");

      dispatch({
        type: "SET_ALL",
        state: {
          ticker: editingStock.ticker,
          company_name: editingStock.company_name,
          sector: editingStock.sector || "",
          fair_value: String(editingStock.fair_value),
          bear_case_fv: editingStock.bear_case_fv ? String(editingStock.bear_case_fv) : "",
          bull_case_fv: editingStock.bull_case_fv ? String(editingStock.bull_case_fv) : "",
          buy_target: String(editingStock.buy_target),
          peg_ratio: editingStock.peg_ratio ? String(editingStock.peg_ratio) : "",
          ps_ratio: editingStock.ps_ratio ? String(editingStock.ps_ratio) : "",
          ps_ratio_5y_avg: editingStock.ps_ratio_5y_avg ? String(editingStock.ps_ratio_5y_avg) : "",
          macro_gated: editingStock.macro_gated,
          revenue_growth: editingStock.stock_scores?.revenue_growth ?? 5,
          fcf_margin: editingStock.stock_scores?.fcf_margin ?? 5,
          roic: editingStock.stock_scores?.roic ?? 5,
          dilution: editingStock.stock_scores?.dilution ?? 5,
          net_cash: editingStock.stock_scores?.net_cash ?? 5,
          interest_coverage: editingStock.stock_scores?.interest_coverage ?? 5,
          balance_dilution_risk: editingStock.stock_scores?.balance_dilution_risk ?? 5,
          organic_growth: editingStock.stock_scores?.organic_growth ?? 5,
          fcf_conversion: editingStock.stock_scores?.fcf_conversion ?? 5,
          gross_margin_stability: editingStock.stock_scores?.gross_margin_stability ?? 5,
          thesis: editingStock.stock_thesis?.thesis || editingStock.thesis || "",
          what_would_break_it: editingStock.stock_thesis?.what_would_break_it || "",
          buy_triggers: editingStock.stock_thesis?.buy_triggers || "",
          sell_triggers: editingStock.stock_thesis?.sell_triggers || "",
          notes: editingStock.stock_thesis?.notes || "",
          risk_notes: editingStock.stock_thesis?.risk_notes || editingStock.risk_notes || "",
          conviction: editingStock.conviction ?? 0,
          allocation_hint: editingStock.allocation_hint || "",
          macro_sensitivity: macroTags,
          narrative_phase: narrativeTag?.tag_value || "",
          ownership_quality: ownershipTag?.tag_value || "",
          shares_outstanding_current: editingStock.shares_outstanding_current ? String(editingStock.shares_outstanding_current) : "",
          shares_outstanding_prior: editingStock.shares_outstanding_prior ? String(editingStock.shares_outstanding_prior) : "",
          iv_percentile: editingStock.iv_percentile ? String(editingStock.iv_percentile) : "",
          covered_call_yield: editingStock.covered_call_yield ? String(editingStock.covered_call_yield) : "",
          leap_score: editingStock.leap_score ? String(editingStock.leap_score) : "",
          triggers: editingStock.triggers?.map((t: TriggerAlert) => ({
            id: t.id,
            trigger_text: t.trigger_text,
            is_active: t.is_active,
          })) || [],
          newTriggerText: "",
        },
      });
    } else {
      dispatch({ type: "SET_ALL", state: defaultForm });
    }
    setError(null);
  }, [editingStock, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Build stock payload
      const stockPayload = {
        ticker: form.ticker.toUpperCase(),
        company_name: form.company_name,
        sector: form.sector || undefined,
        fair_value: Number(form.fair_value),
        buy_target: Number(form.buy_target),
        peg_ratio: form.peg_ratio ? Number(form.peg_ratio) : undefined,
        bear_case_fv: form.bear_case_fv ? Number(form.bear_case_fv) : undefined,
        bull_case_fv: form.bull_case_fv ? Number(form.bull_case_fv) : undefined,
        macro_gated: form.macro_gated,
        conviction: form.conviction,
        allocation_hint: form.allocation_hint || undefined,
        ps_ratio: form.ps_ratio ? Number(form.ps_ratio) : undefined,
        ps_ratio_5y_avg: form.ps_ratio_5y_avg ? Number(form.ps_ratio_5y_avg) : undefined,
        shares_outstanding_current: form.shares_outstanding_current ? Number(form.shares_outstanding_current) : undefined,
        shares_outstanding_prior: form.shares_outstanding_prior ? Number(form.shares_outstanding_prior) : undefined,
        iv_percentile: form.iv_percentile ? Number(form.iv_percentile) : undefined,
        covered_call_yield: form.covered_call_yield ? Number(form.covered_call_yield) : undefined,
        leap_score: form.leap_score ? Number(form.leap_score) : undefined,
        thesis: form.thesis || undefined,
        risk_notes: form.risk_notes || undefined,
        last_thesis_update: form.thesis ? new Date().toISOString() : undefined,
      };

      // Build thesis payload
      const thesisPayload = {
        thesis: form.thesis || null,
        what_would_break_it: form.what_would_break_it || null,
        buy_triggers: form.buy_triggers || null,
        sell_triggers: form.sell_triggers || null,
        notes: form.notes || null,
        risk_notes: form.risk_notes || null,
      };

      // Build scores payload
      const scoresPayload = {
        revenue_growth: form.revenue_growth,
        fcf_margin: form.fcf_margin,
        roic: form.roic,
        dilution: form.dilution,
        net_cash: form.net_cash,
        interest_coverage: form.interest_coverage,
        balance_dilution_risk: form.balance_dilution_risk,
        organic_growth: form.organic_growth,
        fcf_conversion: form.fcf_conversion,
        gross_margin_stability: form.gross_margin_stability,
      };

      // Build tags
      const tags: { tag_type: string; tag_value: string }[] = [];
      for (const ms of form.macro_sensitivity) {
        tags.push({ tag_type: "macro_sensitivity", tag_value: ms });
      }
      if (form.narrative_phase) {
        tags.push({ tag_type: "narrative_phase", tag_value: form.narrative_phase });
      }
      if (form.ownership_quality) {
        tags.push({ tag_type: "ownership_quality", tag_value: form.ownership_quality });
      }

      const fullPayload = {
        stock: stockPayload,
        thesis: thesisPayload,
        scores: scoresPayload,
        tags,
        triggers: form.triggers,
      };

      const url = editingStock
        ? `/api/stocks/${editingStock.id}`
        : "/api/stocks";
      const method = editingStock ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullPayload),
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

  const set = (field: string, value: unknown) => dispatch({ type: "SET_FIELD", field, value });

  // Computed aggregate scores
  const executionScore = (form.revenue_growth + form.fcf_margin + form.roic + form.dilution) / 4;
  const balanceSheetScore = (form.net_cash + form.interest_coverage + form.balance_dilution_risk) / 3;
  const growthQualityScore = (form.organic_growth + form.fcf_conversion + form.gross_margin_stability) / 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingStock ? `Edit ${editingStock.ticker}` : "Add Stock to Watchlist"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="mb-4 w-full grid grid-cols-5">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="scores">Scores</TabsTrigger>
              <TabsTrigger value="thesis">Thesis</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
              <TabsTrigger value="triggers">Triggers</TabsTrigger>
            </TabsList>

            {/* Tab 1: Basics */}
            <TabsContent value="basics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ticker">Ticker *</Label>
                  <Input
                    id="ticker"
                    placeholder="AAPL"
                    value={form.ticker}
                    onChange={(e) => set("ticker", e.target.value)}
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
                    onChange={(e) => set("sector", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  placeholder="Apple Inc."
                  value={form.company_name}
                  onChange={(e) => set("company_name", e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fair_value">Fair Value (Base) *</Label>
                  <Input
                    id="fair_value"
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    value={form.fair_value}
                    onChange={(e) => set("fair_value", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bear_case_fv">Bear Case FV</Label>
                  <Input
                    id="bear_case_fv"
                    type="number"
                    step="0.01"
                    placeholder="100.00"
                    value={form.bear_case_fv}
                    onChange={(e) => set("bear_case_fv", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bull_case_fv">Bull Case FV</Label>
                  <Input
                    id="bull_case_fv"
                    type="number"
                    step="0.01"
                    placeholder="200.00"
                    value={form.bull_case_fv}
                    onChange={(e) => set("bull_case_fv", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buy_target">Buy Target *</Label>
                  <Input
                    id="buy_target"
                    type="number"
                    step="0.01"
                    placeholder="130.00"
                    value={form.buy_target}
                    onChange={(e) => set("buy_target", e.target.value)}
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
                    onChange={(e) => set("peg_ratio", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ps_ratio">P/S Ratio</Label>
                  <Input
                    id="ps_ratio"
                    type="number"
                    step="0.01"
                    placeholder="8.5"
                    value={form.ps_ratio}
                    onChange={(e) => set("ps_ratio", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ps_ratio_5y_avg">P/S 5Y Avg</Label>
                  <Input
                    id="ps_ratio_5y_avg"
                    type="number"
                    step="0.01"
                    value={form.ps_ratio_5y_avg}
                    onChange={(e) => set("ps_ratio_5y_avg", e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    id="macro_gated"
                    checked={form.macro_gated}
                    onCheckedChange={(v) => set("macro_gated", v)}
                  />
                  <Label htmlFor="macro_gated">Macro Gated (force Avoid status)</Label>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Scores */}
            <TabsContent value="scores" className="space-y-4">
              <div className="grid grid-cols-3 gap-4 rounded-lg border border-border/50 p-3 mb-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Execution</p>
                  <p className="text-lg font-bold">{executionScore.toFixed(1)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Balance Sheet</p>
                  <p className="text-lg font-bold">{balanceSheetScore.toFixed(1)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Growth Quality</p>
                  <p className="text-lg font-bold">{growthQualityScore.toFixed(1)}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground font-medium">Execution (4 metrics)</p>
              {renderSlider("Revenue Growth", form.revenue_growth, (v) => set("revenue_growth", v))}
              {renderSlider("FCF Margin", form.fcf_margin, (v) => set("fcf_margin", v))}
              {renderSlider("ROIC", form.roic, (v) => set("roic", v))}
              {renderSlider("Dilution", form.dilution, (v) => set("dilution", v))}

              <p className="text-xs text-muted-foreground font-medium pt-2">Balance Sheet (3 metrics)</p>
              {renderSlider("Net Cash", form.net_cash, (v) => set("net_cash", v))}
              {renderSlider("Interest Coverage", form.interest_coverage, (v) => set("interest_coverage", v))}
              {renderSlider("Balance Dilution Risk", form.balance_dilution_risk, (v) => set("balance_dilution_risk", v))}

              <p className="text-xs text-muted-foreground font-medium pt-2">Growth Quality (3 metrics)</p>
              {renderSlider("Organic Growth", form.organic_growth, (v) => set("organic_growth", v))}
              {renderSlider("FCF Conversion", form.fcf_conversion, (v) => set("fcf_conversion", v))}
              {renderSlider("Gross Margin Stability", form.gross_margin_stability, (v) => set("gross_margin_stability", v))}
            </TabsContent>

            {/* Tab 3: Thesis */}
            <TabsContent value="thesis" className="space-y-4">
              <div className="space-y-2">
                <Label>Investment Thesis</Label>
                <Textarea
                  placeholder="Why do you like this company?"
                  value={form.thesis}
                  onChange={(e) => set("thesis", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>What Would Break It</Label>
                <Textarea
                  placeholder="What would invalidate the thesis?"
                  value={form.what_would_break_it}
                  onChange={(e) => set("what_would_break_it", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Buy Triggers</Label>
                  <Textarea
                    placeholder="What would make you buy more?"
                    value={form.buy_triggers}
                    onChange={(e) => set("buy_triggers", e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sell Triggers</Label>
                  <Textarea
                    placeholder="What would make you sell?"
                    value={form.sell_triggers}
                    onChange={(e) => set("sell_triggers", e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Risk Notes</Label>
                <Textarea
                  placeholder="Key risks and what could go wrong..."
                  value={form.risk_notes}
                  onChange={(e) => set("risk_notes", e.target.value)}
                  rows={2}
                />
              </div>
            </TabsContent>

            {/* Tab 4: Tags & Sizing */}
            <TabsContent value="tags" className="space-y-4">
              <div className="space-y-2">
                <Label>Conviction (0-10): {form.conviction}</Label>
                <Slider
                  value={[form.conviction]}
                  onValueChange={(v) => set("conviction", v[0])}
                  min={0}
                  max={10}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Allocation</Label>
                <Select
                  value={form.allocation_hint}
                  onValueChange={(v) => set("allocation_hint", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select allocation size" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALLOCATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Macro Sensitivity</Label>
                <div className="flex flex-wrap gap-2">
                  {MACRO_SENSITIVITY_OPTIONS.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={`cursor-pointer ${
                        form.macro_sensitivity.includes(tag)
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          : "text-muted-foreground"
                      }`}
                      onClick={() => dispatch({ type: "TOGGLE_MACRO_TAG", value: tag })}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Narrative Phase</Label>
                  <Select
                    value={form.narrative_phase}
                    onValueChange={(v) => set("narrative_phase", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select phase" />
                    </SelectTrigger>
                    <SelectContent>
                      {NARRATIVE_PHASES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ownership Quality</Label>
                  <Select
                    value={form.ownership_quality}
                    onValueChange={(v) => set("ownership_quality", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      {OWNERSHIP_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Shares Outstanding (Current)</Label>
                  <Input
                    type="number"
                    placeholder="1000000000"
                    value={form.shares_outstanding_current}
                    onChange={(e) => set("shares_outstanding_current", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shares Outstanding (Prior Year)</Label>
                  <Input
                    type="number"
                    placeholder="980000000"
                    value={form.shares_outstanding_prior}
                    onChange={(e) => set("shares_outstanding_prior", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>IV Percentile</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="45"
                    value={form.iv_percentile}
                    onChange={(e) => set("iv_percentile", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CC Yield %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="2.5"
                    value={form.covered_call_yield}
                    onChange={(e) => set("covered_call_yield", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>LEAP Score</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="7.5"
                    value={form.leap_score}
                    onChange={(e) => set("leap_score", e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab 5: Triggers */}
            <TabsContent value="triggers" className="space-y-4">
              <div className="space-y-2">
                {form.triggers.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No triggers yet. Add one below.
                  </p>
                )}
                {form.triggers.map((trigger, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-border/50 p-2"
                  >
                    <Switch
                      checked={trigger.is_active}
                      onCheckedChange={() => dispatch({ type: "TOGGLE_TRIGGER", index: i })}
                    />
                    <span className={`flex-1 text-sm ${!trigger.is_active ? "text-muted-foreground line-through" : ""}`}>
                      {trigger.trigger_text}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => dispatch({ type: "REMOVE_TRIGGER", index: i })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Earnings miss > 10%"
                  value={form.newTriggerText}
                  onChange={(e) => set("newTriggerText", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      dispatch({ type: "ADD_TRIGGER" });
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => dispatch({ type: "ADD_TRIGGER" })}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          )}

          <div className="mt-4 flex justify-end gap-3">
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

function renderSlider(label: string, value: number, onChange: (v: number) => void) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 text-sm text-muted-foreground">{label}</span>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={0}
        max={10}
        step={1}
        className="flex-1"
      />
      <span className="w-6 text-right text-sm font-mono">{value}</span>
    </div>
  );
}
