import { NextRequest, NextResponse } from "next/server";
import { getTagsByStockId, setTagsForStock, deleteTag, initDB } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDB();
    const { id } = await params;
    const tags = await getTagsByStockId(id);
    return NextResponse.json(tags);
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDB();
    const { id } = await params;
    const body = await request.json();
    const tags = await setTagsForStock(id, body.tags || []);
    return NextResponse.json(tags);
  } catch (error) {
    console.error("Failed to update tags:", error);
    return NextResponse.json({ error: "Failed to update tags" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDB();
    await params;
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get("tagId");
    if (!tagId) {
      return NextResponse.json({ error: "tagId required" }, { status: 400 });
    }
    await deleteTag(tagId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete tag:", error);
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }
}
