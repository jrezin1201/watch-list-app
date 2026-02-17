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
import { AddStockModal } from "@/components/add-stock-modal";
import { RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Stock } from "@/lib/db";

export default function Dashboard() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");

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

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

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

  const handleEdit = (stock: Stock) => {
    setEditingStock(stock);
    setModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) setEditingStock(null);
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
              Stocks you like, waiting for the right price.
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

        {/* Summary Stats */}
        <div className="mb-6">
          <SummaryStats stocks={stocks} />
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="buy_zone">Buy Zone</SelectItem>
                <SelectItem value="approaching">Approaching</SelectItem>
                <SelectItem value="overvalued">Overvalued</SelectItem>
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
          />
        )}
      </div>

      {/* Add/Edit Modal */}
      <AddStockModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        onSave={fetchStocks}
        editingStock={editingStock}
      />
    </div>
  );
}
