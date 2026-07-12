import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { closeMaintenance, RuleError } from "@/lib/services/fleet";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const log = await closeMaintenance(id, user.name);
    return NextResponse.json({ log });
  } catch (e) {
    if (e instanceof RuleError) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: "Failed to close service" }, { status: 400 });
  }
}
