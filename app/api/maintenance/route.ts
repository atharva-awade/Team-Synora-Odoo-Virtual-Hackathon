import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { openMaintenance, RuleError } from "@/lib/services/fleet";

export const dynamic = "force-dynamic";

export async function GET() {
  const logs = await prisma.maintenanceLog.findMany({
    include: { vehicle: true },
    orderBy: { openedAt: "desc" },
  });
  return NextResponse.json({ logs });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.vehicleId || !b.type) return NextResponse.json({ error: "Vehicle and service type are required" }, { status: 400 });
  try {
    const log = await openMaintenance(
      { vehicleId: b.vehicleId, type: b.type, description: b.description, cost: Number(b.cost) || 0, priority: b.priority || "MEDIUM" },
      user.name,
    );
    return NextResponse.json({ log }, { status: 201 });
  } catch (e) {
    if (e instanceof RuleError) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: "Failed to log service" }, { status: 400 });
  }
}
