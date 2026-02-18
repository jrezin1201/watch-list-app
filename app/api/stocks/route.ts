import { NextRequest, NextResponse } from "next/server";
import {
  getAllStocksWithDetails,
  createStock,
  upsertThesis,
  upsertScores,
  setTagsForStock,
  createTrigger,
  initDB,
} from "@/lib/db";

export async function GET() {
  try {
    await initDB();
    const stocks = await getAllStocksWithDetails();
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

    // Support both flat payload (backward compat) and nested payload
    const stockData = body.stock || body;
    const thesisData = body.thesis;
    const scoresData = body.scores;
    const tagsData = body.tags;
    const triggersData = body.triggers;

    const { ticker, company_name, fair_value, buy_target } = stockData;

    if (!ticker || !company_name || fair_value == null || buy_target == null) {
      return NextResponse.json(
        { error: "Missing required fields: ticker, company_name, fair_value, buy_target" },
        { status: 400 }
      );
    }

    const stock = await createStock({
      ...stockData,
      fair_value: Number(fair_value),
      buy_target: Number(buy_target),
      peg_ratio: stockData.peg_ratio ? Number(stockData.peg_ratio) : undefined,
    });

    // Save related data
    if (thesisData) {
      await upsertThesis(stock.id, thesisData);
    }
    if (scoresData) {
      await upsertScores(stock.id, scoresData);
    }
    if (tagsData && Array.isArray(tagsData)) {
      await setTagsForStock(stock.id, tagsData);
    }
    if (triggersData && Array.isArray(triggersData)) {
      for (const t of triggersData) {
        if (t.trigger_text) {
          await createTrigger(stock.id, t.trigger_text);
        }
      }
    }

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
