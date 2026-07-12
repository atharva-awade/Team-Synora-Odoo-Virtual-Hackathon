import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { dispatchTrip, completeTrip, cancelTrip, RuleError } from "@/lib/services/fleet";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  try {
    switch (b.action) {
      case "dispatch": {
        const trip = await dispatchTrip(id, user.name);
        return NextResponse.json({ trip });
      }
      case "complete": {
        const trip = await completeTrip(
          id,
          { finalOdometer: b.finalOdometer ? Number(b.finalOdometer) : undefined, fuelUsedL: b.fuelUsedL ? Number(b.fuelUsedL) : undefined },
          user.name,
        );
        return NextResponse.json({ trip });
      }
      case "cancel": {
        const trip = await cancelTrip(id, user.name);
        return NextResponse.json({ trip });
      }
      case "assign": {
        await prisma.trip.update({ where: { id }, data: { vehicleId: b.vehicleId || null, driverId: b.driverId || null } });
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    if (e instanceof RuleError) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: "Action failed" }, { status: 400 });
  }
}
