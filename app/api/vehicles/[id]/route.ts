import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = await req.json();

  const existing = await prisma.vehicle.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

  if (b.status === "RETIRED" && existing.status === "ON_TRIP") {
    return NextResponse.json({ error: "Cannot retire a vehicle that is currently on a trip" }, { status: 400 });
  }

  const data: any = {};
  for (const f of ["name", "type", "region", "fuelType", "modelKey", "status"]) {
    if (b[f] !== undefined) data[f] = b[f];
  }
  for (const f of ["maxLoadKg", "odometer", "acquisitionCost", "serviceIntervalKm"]) {
    if (b[f] !== undefined) data[f] = Number(b[f]);
  }

  const vehicle = await prisma.vehicle.update({ where: { id }, data });
  return NextResponse.json({ vehicle });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const trips = await prisma.trip.count({ where: { vehicleId: id, status: { in: ["DRAFT", "DISPATCHED"] } } });
  if (trips > 0) {
    return NextResponse.json({ error: "Vehicle has active trips and cannot be deleted" }, { status: 400 });
  }
  await prisma.fuelLog.deleteMany({ where: { vehicleId: id } });
  await prisma.expense.deleteMany({ where: { vehicleId: id } });
  await prisma.maintenanceLog.deleteMany({ where: { vehicleId: id } });
  await prisma.trip.updateMany({ where: { vehicleId: id }, data: { vehicleId: null } });
  await prisma.vehicle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
