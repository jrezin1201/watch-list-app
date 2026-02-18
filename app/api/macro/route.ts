import { NextRequest, NextResponse } from "next/server";
import { getMacroRegime, updateMacroRegime, initDB } from "@/lib/db";

export async function GET() {
  try {
    await initDB();
    const macro = await getMacroRegime();
    return NextResponse.json(macro);
  } catch (error) {
    console.error("Failed to fetch macro regime:", error);
    return NextResponse.json(
      { error: "Failed to fetch macro regime" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await initDB();
    const body = await request.json();
    const macro = await updateMacroRegime(body);
    return NextResponse.json(macro);
  } catch (error) {
    console.error("Failed to update macro regime:", error);
    return NextResponse.json(
      { error: "Failed to update macro regime" },
      { status: 500 }
    );
  }
}
