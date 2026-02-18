import { NextRequest, NextResponse } from "next/server";
import { getStockById, updateStock, initDB } from "@/lib/db";
import { fetchOverviewData } from "@/lib/alpha-vantage";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDB();
    const { id } = await params;

    const stock = await getStockById(id);
    if (!stock) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    const data = await fetchOverviewData(stock.ticker);
    if (!data) {
      return NextResponse.json(
        { error: "Failed to fetch fundamentals (rate limited or no data)" },
        { status: 429 }
      );
    }

    await updateStock(id, {
      ps_ratio: data.ps_ratio,
      shares_outstanding_current: data.shares_outstanding,
    });

    return NextResponse.json({
      message: `Fundamentals updated for ${stock.ticker}`,
      data,
    });
  } catch (error) {
    console.error("Failed to fetch fundamentals:", error);
    return NextResponse.json(
      { error: "Failed to fetch fundamentals" },
      { status: 500 }
    );
  }
}
