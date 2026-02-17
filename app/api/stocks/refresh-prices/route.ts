import { NextResponse } from "next/server";
import { getAllStocks, updateStockPrice, initDB } from "@/lib/db";
import { fetchStockPrice } from "@/lib/alpha-vantage";

export async function POST() {
  try {
    await initDB();
    const stocks = await getAllStocks();

    if (stocks.length === 0) {
      return NextResponse.json({ message: "No stocks to refresh", updated: 0 });
    }

    const results: { ticker: string; price: number | null; error?: string }[] = [];

    for (let i = 0; i < stocks.length; i++) {
      const stock = stocks[i];
      try {
        const price = await fetchStockPrice(stock.ticker);
        if (price !== null) {
          await updateStockPrice(stock.ticker, price);
          results.push({ ticker: stock.ticker, price });
        } else {
          results.push({ ticker: stock.ticker, price: null, error: "No price data or rate limited" });
        }
      } catch (error) {
        console.error(`Error fetching price for ${stock.ticker}:`, error);
        results.push({ ticker: stock.ticker, price: null, error: "Fetch failed" });
      }

      // Delay between requests to respect Alpha Vantage rate limits (5/min free tier)
      if (i < stocks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 12000));
      }
    }

    const updated = results.filter((r) => r.price !== null).length;

    return NextResponse.json({
      message: `Refreshed ${updated} of ${stocks.length} stock prices`,
      updated,
      total: stocks.length,
      results,
    });
  } catch (error) {
    console.error("Failed to refresh prices:", error);
    return NextResponse.json(
      { error: "Failed to refresh prices" },
      { status: 500 }
    );
  }
}
