"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { ConvictionBar } from "@/components/conviction-bar";
import { AllocationChip } from "@/components/allocation-chip";
import { ScoreCard } from "@/components/score-card";
import { UpsideBadge } from "@/components/upside-badge";
import { Pencil, Trash2, Download } from "lucide-react";
import type { StockWithDetails } from "@/lib/db";

interface ThesisDrawerProps {
  stock: StockWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (stock: StockWithDetails) => void;
  onDelete: (id: string) => void;
  onFetchFundamentals?: (stock: StockWithDetails) => void;
}

function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return "—";
  return `$${Number(price).toFixed(2)}`;
}

export function ThesisDrawer({ stock, open, onOpenChange, onEdit, onDelete, onFetchFundamentals }: ThesisDrawerProps) {
  if (!stock) return null;

  const thesis = stock.stock_thesis;
  const scores = stock.stock_scores;

  // Price position bar
  const bearFV = stock.bear_case_fv ? Number(stock.bear_case_fv) : null;
  const baseFV = Number(stock.fair_value);
  const bullFV = stock.bull_case_fv ? Number(stock.bull_case_fv) : null;
  const currentPrice = stock.current_price ? Number(stock.current_price) : null;

  // Buy zone memory stats
  const totalEntries = stock.buy_zone_entries.length;
  const exits = stock.buy_zone_entries.filter((e) => e.exited_at);
  const wins = exits.filter(
    (e) => e.exit_price && e.entry_price && Number(e.exit_price) > Number(e.entry_price)
  );
  const winRate = exits.length > 0 ? ((wins.length / exits.length) * 100).toFixed(0) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl font-bold">
                {stock.ticker}
                <span className="ml-2 text-sm font-normal text-muted-foreground">{stock.company_name}</span>
              </SheetTitle>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={stock.status} />
            <ConvictionBar value={stock.conviction ?? 0} />
            <AllocationChip allocation={stock.allocation_hint} />
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Price & Valuation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Price</span>
              <span className="font-mono text-lg font-bold">{formatPrice(currentPrice)}</span>
            </div>

            {/* Price position bar */}
            {bearFV && bullFV && currentPrice && (
              <div className="space-y-1">
                <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                  {(() => {
                    const range = bullFV - bearFV;
                    if (range <= 0) return null;
                    const pricePct = Math.max(0, Math.min(100, ((currentPrice - bearFV) / range) * 100));
                    const basePct = ((baseFV - bearFV) / range) * 100;
                    return (
                      <>
                        <div
                          className="absolute top-0 h-full w-0.5 bg-yellow-400"
                          style={{ left: `${basePct}%` }}
                        />
                        <div
                          className="absolute top-0 h-full w-1.5 rounded-full bg-white"
                          style={{ left: `${pricePct}%`, transform: "translateX(-50%)" }}
                        />
                        <div
                          className="absolute top-0 h-full bg-gradient-to-r from-green-500/30 to-red-500/30"
                          style={{ width: "100%" }}
                        />
                      </>
                    );
                  })()}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Bear {formatPrice(bearFV)}</span>
                  <span>Base {formatPrice(baseFV)}</span>
                  <span>Bull {formatPrice(bullFV)}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Upside</p>
                <UpsideBadge pct={stock.upside_pct} />
              </div>
              <div>
                <p className="text-muted-foreground">Buy Target</p>
                <p className="font-mono">{formatPrice(stock.buy_target)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Asymmetry</p>
                <p className="font-mono">{stock.asymmetry_ratio !== null ? `${stock.asymmetry_ratio}x` : "—"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Score Cards */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Quality Scores</h3>
            <div className="grid grid-cols-1 gap-2">
              <ScoreCard
                title="Execution"
                score={stock.execution_score}
                subScores={scores ? [
                  { label: "Revenue Growth", value: scores.revenue_growth },
                  { label: "FCF Margin", value: scores.fcf_margin },
                  { label: "ROIC", value: scores.roic },
                  { label: "Dilution", value: scores.dilution },
                ] : undefined}
              />
              <ScoreCard
                title="Balance Sheet"
                score={stock.balance_sheet_score}
                subScores={scores ? [
                  { label: "Net Cash", value: scores.net_cash },
                  { label: "Interest Coverage", value: scores.interest_coverage },
                  { label: "Dilution Risk", value: scores.balance_dilution_risk },
                ] : undefined}
              />
              <ScoreCard
                title="Growth Quality"
                score={stock.growth_quality_score}
                subScores={scores ? [
                  { label: "Organic Growth", value: scores.organic_growth },
                  { label: "FCF Conversion", value: scores.fcf_conversion },
                  { label: "Margin Stability", value: scores.gross_margin_stability },
                ] : undefined}
              />
            </div>
          </div>

          <Separator />

          {/* Thesis Sections */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Investment Thesis</h3>
            {(thesis?.thesis || stock.thesis) && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Thesis</p>
                <p className="text-sm">{thesis?.thesis || stock.thesis}</p>
              </div>
            )}
            {thesis?.what_would_break_it && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">What Would Break It</p>
                <p className="text-sm">{thesis.what_would_break_it}</p>
              </div>
            )}
            {thesis?.buy_triggers && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Buy Triggers</p>
                <p className="text-sm">{thesis.buy_triggers}</p>
              </div>
            )}
            {thesis?.sell_triggers && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sell Triggers</p>
                <p className="text-sm">{thesis.sell_triggers}</p>
              </div>
            )}
            {(thesis?.notes) && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{thesis.notes}</p>
              </div>
            )}
            {(thesis?.risk_notes || stock.risk_notes) && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Risks</p>
                <p className="text-sm">{thesis?.risk_notes || stock.risk_notes}</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {stock.tags.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {stock.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline" className="text-xs">
                      {tag.tag_type === "macro_sensitivity" && "Macro: "}
                      {tag.tag_type === "narrative_phase" && "Phase: "}
                      {tag.tag_type === "ownership_quality" && "Ownership: "}
                      {tag.tag_value}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Buy Zone Memory */}
          {totalEntries > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Buy Zone Memory</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Times Entered</p>
                    <p className="font-mono font-bold">{totalEntries}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Win Rate</p>
                    <p className="font-mono font-bold">{winRate ? `${winRate}%` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Completed</p>
                    <p className="font-mono font-bold">{exits.length}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Trigger Alerts */}
          {stock.triggers.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Trigger Alerts</h3>
                {stock.triggers.map((t) => (
                  <div
                    key={t.id}
                    className={`rounded border border-border/50 px-3 py-2 text-sm ${
                      !t.is_active ? "text-muted-foreground line-through" : ""
                    }`}
                  >
                    {t.trigger_text}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Last Thesis Update */}
          {stock.last_thesis_update && (
            <p className="text-xs text-muted-foreground">
              Thesis last updated: {new Date(stock.last_thesis_update).toLocaleDateString()}
            </p>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(stock)}>
              <Pencil className="mr-1 h-3 w-3" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-400 hover:text-red-400"
              onClick={() => {
                onDelete(stock.id);
                onOpenChange(false);
              }}
            >
              <Trash2 className="mr-1 h-3 w-3" /> Delete
            </Button>
            {onFetchFundamentals && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFetchFundamentals(stock)}
              >
                <Download className="mr-1 h-3 w-3" /> Fetch Fundamentals
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
