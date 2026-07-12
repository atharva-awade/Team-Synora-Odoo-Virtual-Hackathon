import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createTrip, dispatchTrip, RuleError } from "@/lib/services/fleet";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const where: any = {};
  if (status && status !== "ALL") where.status = status;
  const trips = await prisma.trip.findMany({
    where,
    include: { vehicle: true, driver: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ trips });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  try {
    const trip = await createTrip(
      {
        source: b.source,
        destination: b.destination,
        vehicleId: b.vehicleId || null,
        driverId: b.driverId || null,
        cargoWeightKg: Number(b.cargoWeightKg) || 0,
        plannedDistanceKm: b.plannedDistanceKm ? Number(b.plannedDistanceKm) : undefined,
        revenue: Number(b.revenue) || 0,
      },
      user.name,
    );
    if (b.dispatch) {
      const dispatched = await dispatchTrip(trip.id, user.name);
      return NextResponse.json({ trip: dispatched }, { status: 201 });
    }
    return NextResponse.json({ trip }, { status: 201 });
  } catch (e) {
    if (e instanceof RuleError) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: "Failed to create trip" }, { status: 400 });
  }
}
