import { NextRequest, NextResponse } from "next/server";
import {
  getStockById,
  updateStock,
  deleteStock,
  upsertThesis,
  upsertScores,
  setTagsForStock,
  createTrigger,
  deleteTrigger,
  getTriggersByStockId,
  initDB,
} from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDB();
    const { id } = await params;
    const body = await request.json();

    // Support both flat payload and nested payload
    const stockData = body.stock || body;
    const thesisData = body.thesis;
    const scoresData = body.scores;
    const tagsData = body.tags;
    const triggersData = body.triggers;

    const stock = await updateStock(id, stockData);
    if (!stock) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    // Save related data
    if (thesisData) {
      await upsertThesis(id, thesisData);
    }
    if (scoresData) {
      await upsertScores(id, scoresData);
    }
    if (tagsData && Array.isArray(tagsData)) {
      await setTagsForStock(id, tagsData);
    }
    if (triggersData && Array.isArray(triggersData)) {
      // Delete existing triggers and re-create
      const existing = await getTriggersByStockId(id);
      for (const t of existing) {
        await deleteTrigger(t.id);
      }
      for (const t of triggersData) {
        if (t.trigger_text) {
          await createTrigger(id, t.trigger_text);
        }
      }
    }

    return NextResponse.json(stock);
  } catch (error) {
    console.error("Failed to update stock:", error);
    return NextResponse.json(
      { error: "Failed to update stock" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDB();
    const { id } = await params;

    const deleted = await deleteStock(id);
    if (!deleted) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete stock:", error);
    return NextResponse.json(
      { error: "Failed to delete stock" },
      { status: 500 }
    );
  }
}

export async function GET(
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

    return NextResponse.json(stock);
  } catch (error) {
    console.error("Failed to fetch stock:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock" },
      { status: 500 }
    );
  }
}
