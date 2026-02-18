import { NextRequest, NextResponse } from "next/server";
import {
  getTriggersByStockId,
  createTrigger,
  updateTrigger,
  deleteTrigger,
  initDB,
} from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDB();
    const { id } = await params;
    const triggers = await getTriggersByStockId(id);
    return NextResponse.json(triggers);
  } catch (error) {
    console.error("Failed to fetch triggers:", error);
    return NextResponse.json({ error: "Failed to fetch triggers" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDB();
    const { id } = await params;
    const body = await request.json();
    if (!body.trigger_text) {
      return NextResponse.json({ error: "trigger_text required" }, { status: 400 });
    }
    const trigger = await createTrigger(id, body.trigger_text);
    return NextResponse.json(trigger, { status: 201 });
  } catch (error) {
    console.error("Failed to create trigger:", error);
    return NextResponse.json({ error: "Failed to create trigger" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest
) {
  try {
    await initDB();
    const body = await request.json();
    if (!body.triggerId) {
      return NextResponse.json({ error: "triggerId required" }, { status: 400 });
    }
    const trigger = await updateTrigger(body.triggerId, body);
    return NextResponse.json(trigger);
  } catch (error) {
    console.error("Failed to update trigger:", error);
    return NextResponse.json({ error: "Failed to update trigger" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    await initDB();
    const { searchParams } = new URL(request.url);
    const triggerId = searchParams.get("triggerId");
    if (!triggerId) {
      return NextResponse.json({ error: "triggerId required" }, { status: 400 });
    }
    await deleteTrigger(triggerId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete trigger:", error);
    return NextResponse.json({ error: "Failed to delete trigger" }, { status: 500 });
  }
}
