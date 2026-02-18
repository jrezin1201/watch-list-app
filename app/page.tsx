"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SummaryStats } from "@/components/summary-stats";
import { StockTable } from "@/components/stock-table";
import { StockEditModal } from "@/components/stock-edit-modal";
import { ThesisDrawer } from "@/components/thesis-drawer";
import { MacroBanner } from "@/components/macro-banner";
import { MacroEditModal } from "@/components/macro-edit-modal";
import { ViewToggle, type ViewMode } from "@/components/view-toggle";
import { RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import type { StockWithDetails, MacroRegime } from "@/lib/db";

export default function Dashboard() {
  const [stocks, setStocks] = useState<StockWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<StockWithDetails | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("valuation");

  // Thesis drawer
  const [drawerStock, setDrawerStock] = useState<StockWithDetails | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Macro
  const [macro, setMacro] = useState<MacroRegime | null>(null);
  const [macroEditOpen, setMacroEditOpen] = useState(false);

  const fetchStocks = useCallback(async () => {
    try {
      const res = await fetch("/api/stocks");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStocks(data);
    } catch {
      toast.error("Failed to load stocks");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMacro = useCallback(async () => {
    try {
      const res = await fetch("/api/macro");
      if (res.ok) {
        const data = await res.json();
        setMacro(data);
      }
    } catch {
      // silently fail for macro
    }
  }, []);

  useEffect(() => {
    fetchStocks();
    fetchMacro();
  }, [fetchStocks, fetchMacro]);

  const handleRefreshPrices = async () => {
    setRefreshing(true);
    toast.info("Refreshing stock prices...", {
      description: "This may take a moment due to API rate limits.",
    });
    try {
      const res = await fetch("/api/stocks/refresh-prices", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      await fetchStocks();
    } catch {
      toast.error("Failed to refresh prices");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/stocks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Stock removed from watchlist");
      await fetchStocks();
    } catch {
      toast.error("Failed to delete stock");
    }
  };

  const handleEdit = (stock: StockWithDetails) => {
    setEditingStock(stock);
    setModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) setEditingStock(null);
  };

  const handleRowClick = (stock: StockWithDetails) => {
    setDrawerStock(stock);
    setDrawerOpen(true);
  };

  const handleFetchFundamentals = async (stock: StockWithDetails) => {
    toast.info(`Fetching fundamentals for ${stock.ticker}...`);
    try {
      const res = await fetch(`/api/stocks/${stock.id}/fetch-fundamentals`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      await fetchStocks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch fundamentals");
    }
  };

  const sectors = Array.from(
    new Set(stocks.map((s) => s.sector).filter(Boolean))
  ).sort() as string[];

  const filteredStocks = stocks.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (sectorFilter !== "all" && s.sector !== sectorFilter) return false;
    return true;
  });

  const lastUpdated = stocks
    .map((s) => s.price_updated_at)
    .filter(Boolean)
    .sort()
    .pop();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              BuyZone
            </h1>
            <p className="text-sm text-muted-foreground">
              Personal Investment OS
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefreshPrices}
              disabled={refreshing || stocks.length === 0}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh Prices"}
            </Button>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Stock
            </Button>
          </div>
        </div>

        {/* Macro Banner */}
        <div className="mb-4">
          <MacroBanner macro={macro} onEdit={() => setMacroEditOpen(true)} />
        </div>

        {/* Summary Stats */}
        <div className="mb-6">
          <SummaryStats stocks={stocks} />
        </div>

        {/* Filters + View Toggle */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <ViewToggle value={viewMode} onChange={setViewMode} />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="buy_zone">Buy Zone</SelectItem>
                <SelectItem value="watch_zone">Watch Zone</SelectItem>
                <SelectItem value="extended">Extended</SelectItem>
                <SelectItem value="avoid">Avoid</SelectItem>
              </SelectContent>
            </Select>
            {sectors.length > 0 && (
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  {sectors.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Prices last updated:{" "}
              {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <StockTable
            stocks={filteredStocks}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRowClick={handleRowClick}
            viewMode={viewMode}
          />
        )}
      </div>

      {/* Add/Edit Modal */}
      <StockEditModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        onSave={fetchStocks}
        editingStock={editingStock}
      />

      {/* Thesis Drawer */}
      <ThesisDrawer
        stock={drawerStock}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onEdit={(stock) => {
          setDrawerOpen(false);
          handleEdit(stock);
        }}
        onDelete={handleDelete}
        onFetchFundamentals={handleFetchFundamentals}
      />

      {/* Macro Edit Modal */}
      <MacroEditModal
        open={macroEditOpen}
        onOpenChange={setMacroEditOpen}
        macro={macro}
        onSave={() => {
          fetchMacro();
        }}
      />
    </div>
  );
}
