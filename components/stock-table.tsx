"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { ConvictionBar } from "@/components/conviction-bar";
import { AllocationChip } from "@/components/allocation-chip";
import { UpsideBadge } from "@/components/upside-badge";
import { Sparkline } from "@/components/sparkline";
import { DilutionMeter } from "@/components/dilution-meter";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { MoreHorizontal, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { StockWithDetails, StockStatus } from "@/lib/db";

const headerTooltips: Record<string, string> = {
  ticker: "Stock ticker symbol and sector",
  spark: "30-day price trend",
  price: "Current market price",
  fair_value: "Your estimated fair value (base case DCF)",
  upside: "Upside to your base fair value",
  buy_target: "Price at which you'd buy",
  pct_above: "How far above your buy target",
  status: "Buy Zone / Watch Zone / Extended / Avoid",
  conviction: "Your conviction score (0-10)",
  size: "Target allocation size",
  macro_tags: "Macro sensitivity factors",
  narrative: "Company narrative phase",
  ownership: "Ownership quality assessment",
  asymmetry: "Bull upside / Bear downside ratio",
  dilution: "Share count dilution YoY",
  gated: "Macro gated = forced Avoid status",
  iv_pct: "Implied volatility percentile",
  cc_yield: "Covered call yield %",
  leap: "LEAP attractiveness score",
};

type ViewMode = "valuation" | "macro" | "options";

interface StockTableProps {
  stocks: StockWithDetails[];
  onEdit: (stock: StockWithDetails) => void;
  onDelete: (id: string) => void;
  onRowClick: (stock: StockWithDetails) => void;
  viewMode: ViewMode;
}

type SortField =
  | "status"
  | "pct_above"
  | "sector"
  | "ticker"
  | "current_price"
  | "fair_value"
  | "buy_target"
  | "conviction"
  | "upside";
type SortDirection = "asc" | "desc";

const statusOrder: Record<StockStatus, number> = { buy_zone: 0, watch_zone: 1, extended: 2, avoid: 3 };

function getPctAboveTarget(stock: StockWithDetails): number | null {
  if (stock.current_price === null) return null;
  return (
    ((Number(stock.current_price) - Number(stock.buy_target)) /
      Number(stock.buy_target)) *
    100
  );
}

function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return "—";
  return `$${Number(price).toFixed(2)}`;
}

export function StockTable({ stocks, onEdit, onDelete, onRowClick, viewMode }: StockTableProps) {
  const [sortField, setSortField] = useState<SortField>("status");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [deleteConfirm, setDeleteConfirm] = useState<StockWithDetails | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sorted = [...stocks].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortField) {
      case "status":
        return (statusOrder[a.status] - statusOrder[b.status]) * dir;
      case "pct_above": {
        const pctA = getPctAboveTarget(a) ?? 999;
        const pctB = getPctAboveTarget(b) ?? 999;
        return (pctA - pctB) * dir;
      }
      case "sector":
        return ((a.sector || "").localeCompare(b.sector || "")) * dir;
      case "ticker":
        return a.ticker.localeCompare(b.ticker) * dir;
      case "current_price":
        return ((Number(a.current_price) || 0) - (Number(b.current_price) || 0)) * dir;
      case "fair_value":
        return (Number(a.fair_value) - Number(b.fair_value)) * dir;
      case "buy_target":
        return (Number(a.buy_target) - Number(b.buy_target)) * dir;
      case "conviction":
        return ((a.conviction ?? 0) - (b.conviction ?? 0)) * dir;
      case "upside":
        return ((a.upside_pct ?? -999) - (b.upside_pct ?? -999)) * dir;
      default:
        return 0;
    }
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ChevronDown className="ml-1 inline h-3 w-3" />
    );
  };

  const TH = ({ label, tooltip, field, className }: { label: string; tooltip: string; field?: SortField; className?: string }) => (
    <TableHead
      className={`${field ? "cursor-pointer" : ""} ${className || ""}`}
      onClick={field ? () => handleSort(field) : undefined}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <span>{label}{field && <SortIcon field={field} />}</span>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TableHead>
  );

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  if (stocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 py-16">
        <p className="text-muted-foreground">No stocks in your watchlist yet.</p>
        <p className="text-sm text-muted-foreground/70">
          Add your first stock to get started.
        </p>
      </div>
    );
  }

  // --- Valuation View ---
  if (viewMode === "valuation") {
    return (
      <>
        <div className="hidden overflow-x-auto rounded-lg border border-border/50 md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TH label="Ticker" tooltip={headerTooltips.ticker} field="ticker" />
                <TH label="Spark" tooltip={headerTooltips.spark} />
                <TH label="Price" tooltip={headerTooltips.price} field="current_price" className="text-right" />
                <TH label="Fair Value" tooltip={headerTooltips.fair_value} field="fair_value" className="text-right" />
                <TH label="Upside" tooltip={headerTooltips.upside} field="upside" className="text-right" />
                <TH label="Buy Target" tooltip={headerTooltips.buy_target} field="buy_target" className="text-right" />
                <TH label="% Above" tooltip={headerTooltips.pct_above} field="pct_above" className="text-right" />
                <TH label="Status" tooltip={headerTooltips.status} field="status" />
                <TH label="Conviction" tooltip={headerTooltips.conviction} field="conviction" />
                <TH label="Size" tooltip={headerTooltips.size} />
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((stock) => {
                const pct = getPctAboveTarget(stock);
                return (
                  <TableRow
                    key={stock.id}
                    className="cursor-pointer"
                    onClick={() => onRowClick(stock)}
                  >
                    <TableCell className="font-mono font-bold">
                      {stock.ticker}
                      {stock.sector && (
                        <span className="ml-1 text-xs text-muted-foreground">{stock.sector}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Sparkline data={stock.price_history.map(p => Number(p.price))} />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPrice(stock.current_price)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPrice(stock.fair_value)}
                    </TableCell>
                    <TableCell className="text-right">
                      <UpsideBadge pct={stock.upside_pct} />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPrice(stock.buy_target)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {pct !== null ? (
                        <span
                          className={
                            pct <= 0
                              ? "text-green-400"
                              : pct <= 15
                                ? "text-yellow-400"
                                : "text-red-400"
                          }
                        >
                          {pct > 0 ? "+" : ""}
                          {pct.toFixed(1)}%
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={stock.status} />
                    </TableCell>
                    <TableCell>
                      <ConvictionBar value={stock.conviction ?? 0} />
                    </TableCell>
                    <TableCell>
                      <AllocationChip allocation={stock.allocation_hint} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(stock)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirm(stock)}
                            className="text-red-400 focus:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {renderMobileCards(sorted, onRowClick, onEdit, setDeleteConfirm, expandedId, setExpandedId)}
        {renderDeleteDialog(deleteConfirm, setDeleteConfirm, handleDeleteConfirm)}
      </>
    );
  }

  // --- Macro-Aware View ---
  if (viewMode === "macro") {
    return (
      <>
        <div className="hidden overflow-x-auto rounded-lg border border-border/50 md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TH label="Ticker" tooltip={headerTooltips.ticker} field="ticker" />
                <TH label="Price" tooltip={headerTooltips.price} field="current_price" className="text-right" />
                <TH label="Status" tooltip={headerTooltips.status} field="status" />
                <TH label="Macro Tags" tooltip={headerTooltips.macro_tags} />
                <TH label="Narrative" tooltip={headerTooltips.narrative} />
                <TH label="Ownership" tooltip={headerTooltips.ownership} />
                <TH label="Asymmetry" tooltip={headerTooltips.asymmetry} className="text-right" />
                <TH label="Dilution" tooltip={headerTooltips.dilution} className="text-right" />
                <TH label="Gated" tooltip={headerTooltips.gated} />
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((stock) => {
                const macroTags = stock.tags.filter(t => t.tag_type === "macro_sensitivity");
                const narrativeTag = stock.tags.find(t => t.tag_type === "narrative_phase");
                const ownershipTag = stock.tags.find(t => t.tag_type === "ownership_quality");

                return (
                  <TableRow key={stock.id} className="cursor-pointer" onClick={() => onRowClick(stock)}>
                    <TableCell className="font-mono font-bold">{stock.ticker}</TableCell>
                    <TableCell className="text-right font-mono">{formatPrice(stock.current_price)}</TableCell>
                    <TableCell><StatusBadge status={stock.status} /></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {macroTags.map(t => (
                          <span key={t.id} className="rounded bg-blue-500/20 px-1.5 py-0.5 text-xs text-blue-400">{t.tag_value}</span>
                        ))}
                        {macroTags.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{narrativeTag?.tag_value || "—"}</TableCell>
                    <TableCell className="text-sm">{ownershipTag?.tag_value || "—"}</TableCell>
                    <TableCell className="text-right font-mono">
                      {stock.asymmetry_ratio !== null ? `${stock.asymmetry_ratio}x` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DilutionMeter pct={stock.dilution_risk_pct} />
                    </TableCell>
                    <TableCell>
                      {stock.macro_gated ? (
                        <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-xs text-red-400">Gated</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(stock)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteConfirm(stock)} className="text-red-400 focus:text-red-400">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {renderMobileCards(sorted, onRowClick, onEdit, setDeleteConfirm, expandedId, setExpandedId)}
        {renderDeleteDialog(deleteConfirm, setDeleteConfirm, handleDeleteConfirm)}
      </>
    );
  }

  // --- Options View ---
  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border border-border/50 md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TH label="Ticker" tooltip={headerTooltips.ticker} field="ticker" />
              <TH label="Price" tooltip={headerTooltips.price} field="current_price" className="text-right" />
              <TH label="IV Percentile" tooltip={headerTooltips.iv_pct} className="text-right" />
              <TH label="CC Yield" tooltip={headerTooltips.cc_yield} className="text-right" />
              <TH label="LEAP Score" tooltip={headerTooltips.leap} className="text-right" />
              <TH label="Status" tooltip={headerTooltips.status} field="status" />
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((stock) => (
              <TableRow key={stock.id} className="cursor-pointer" onClick={() => onRowClick(stock)}>
                <TableCell className="font-mono font-bold">{stock.ticker}</TableCell>
                <TableCell className="text-right font-mono">{formatPrice(stock.current_price)}</TableCell>
                <TableCell className="text-right font-mono">
                  {stock.iv_percentile !== null ? `${Number(stock.iv_percentile).toFixed(0)}%` : "—"}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {stock.covered_call_yield !== null ? `${Number(stock.covered_call_yield).toFixed(1)}%` : "—"}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {stock.leap_score !== null ? Number(stock.leap_score).toFixed(1) : "—"}
                </TableCell>
                <TableCell><StatusBadge status={stock.status} /></TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(stock)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteConfirm(stock)} className="text-red-400 focus:text-red-400">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {renderMobileCards(sorted, onRowClick, onEdit, setDeleteConfirm, expandedId, setExpandedId)}
      {renderDeleteDialog(deleteConfirm, setDeleteConfirm, handleDeleteConfirm)}
    </>
  );
}

// --- Shared Helpers ---

function renderMobileCards(
  sorted: StockWithDetails[],
  onRowClick: (stock: StockWithDetails) => void,
  onEdit: (stock: StockWithDetails) => void,
  setDeleteConfirm: (stock: StockWithDetails | null) => void,
  expandedId: string | null,
  setExpandedId: (id: string | null) => void,
) {
  return (
    <div className="space-y-3 md:hidden">
      {sorted.map((stock) => {
        const pct = getPctAboveTarget(stock);
        const isExpanded = expandedId === stock.id;
        return (
          <div
            key={stock.id}
            className="rounded-lg border border-border/50 bg-card/50 p-4"
          >
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : stock.id)}
            >
              <div className="flex items-center gap-3">
                <div>
                  <span className="font-mono font-bold">{stock.ticker}</span>
                  <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                    {stock.company_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-mono">{formatPrice(stock.current_price)}</p>
                  {pct !== null && (
                    <p
                      className={`text-sm font-mono ${
                        pct <= 0
                          ? "text-green-400"
                          : pct <= 15
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {pct > 0 ? "+" : ""}
                      {pct.toFixed(1)}%
                    </p>
                  )}
                </div>
                <StatusBadge status={stock.status} />
              </div>
            </div>
            {isExpanded && (
              <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Fair Value</p>
                    <p className="font-mono">{formatPrice(stock.fair_value)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Buy Target</p>
                    <p className="font-mono">{formatPrice(stock.buy_target)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Conviction</p>
                    <ConvictionBar value={stock.conviction ?? 0} />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRowClick(stock)}
                  >
                    Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(stock)}
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-400 hover:text-red-400"
                    onClick={() => setDeleteConfirm(stock)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function renderDeleteDialog(
  deleteConfirm: StockWithDetails | null,
  setDeleteConfirm: (stock: StockWithDetails | null) => void,
  handleDeleteConfirm: () => void,
) {
  return (
    <Dialog
      open={!!deleteConfirm}
      onOpenChange={(open) => !open && setDeleteConfirm(null)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {deleteConfirm?.ticker}?</DialogTitle>
          <DialogDescription>
            This will permanently remove {deleteConfirm?.company_name} from
            your watchlist. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setDeleteConfirm(null)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteConfirm}
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
