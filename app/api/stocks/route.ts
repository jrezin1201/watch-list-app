import { NextRequest, NextResponse } from "next/server";
import { getAllStocks, createStock, initDB } from "@/lib/db";

export async function GET() {
  try {
    await initDB();
    const stocks = await getAllStocks();
    return NextResponse.json(stocks);
  } catch (error) {
    console.error("Failed to fetch stocks:", error);
    return NextResponse.json(
      { error: "Failed to fetch stocks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDB();
    const body = await request.json();

    const { ticker, company_name, sector, fair_value, buy_target, peg_ratio, thesis, risk_notes } = body;

    if (!ticker || !company_name || fair_value == null || buy_target == null) {
      return NextResponse.json(
        { error: "Missing required fields: ticker, company_name, fair_value, buy_target" },
        { status: 400 }
      );
    }

    const stock = await createStock({
      ticker,
      company_name,
      sector,
      fair_value: Number(fair_value),
      buy_target: Number(buy_target),
      peg_ratio: peg_ratio ? Number(peg_ratio) : undefined,
      thesis,
      risk_notes,
    });

    return NextResponse.json(stock, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create stock:", error);
    const message =
      error instanceof Error && error.message.includes("unique")
        ? "A stock with this ticker already exists"
        : "Failed to create stock";
    const status =
      error instanceof Error && error.message.includes("unique") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
