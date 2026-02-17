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
import { MoreHorizontal, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { Stock } from "@/lib/db";

interface StockTableProps {
  stocks: Stock[];
  onEdit: (stock: Stock) => void;
  onDelete: (id: string) => void;
}

type SortField =
  | "status"
  | "pct_above"
  | "sector"
  | "ticker"
  | "current_price"
  | "fair_value"
  | "buy_target";
type SortDirection = "asc" | "desc";

const statusOrder = { buy_zone: 0, approaching: 1, overvalued: 2 };

function getPctAboveTarget(stock: Stock): number | null {
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

export function StockTable({ stocks, onEdit, onDelete }: StockTableProps) {
  const [sortField, setSortField] = useState<SortField>("status");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [deleteConfirm, setDeleteConfirm] = useState<Stock | null>(null);
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

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border border-border/50 md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("ticker")}
              >
                Ticker
                <SortIcon field="ticker" />
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => handleSort("current_price")}
              >
                Price
                <SortIcon field="current_price" />
              </TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => handleSort("fair_value")}
              >
                Fair Value
                <SortIcon field="fair_value" />
              </TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => handleSort("buy_target")}
              >
                Buy Target
                <SortIcon field="buy_target" />
              </TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => handleSort("pct_above")}
              >
                % Above
                <SortIcon field="pct_above" />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("status")}
              >
                Status
                <SortIcon field="status" />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("sector")}
              >
                Sector
                <SortIcon field="sector" />
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((stock) => {
              const pct = getPctAboveTarget(stock);
              return (
                <TableRow key={stock.id}>
                  <TableCell className="font-mono font-bold">
                    {stock.ticker}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {stock.company_name}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPrice(stock.current_price)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPrice(stock.fair_value)}
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
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={stock.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {stock.sector || "—"}
                  </TableCell>
                  <TableCell>
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

      {/* Mobile card view */}
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
                      <p className="text-muted-foreground">Sector</p>
                      <p>{stock.sector || "—"}</p>
                    </div>
                  </div>
                  {stock.thesis && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Thesis</p>
                      <p>{stock.thesis}</p>
                    </div>
                  )}
                  {stock.risk_notes && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Risks</p>
                      <p>{stock.risk_notes}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
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

      {/* Delete confirmation dialog */}
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
    </>
  );
}
