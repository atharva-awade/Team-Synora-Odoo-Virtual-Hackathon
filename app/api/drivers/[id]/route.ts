import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = await req.json();

  const existing = await prisma.driver.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  if (b.status && existing.status === "ON_TRIP" && b.status !== "ON_TRIP") {
    return NextResponse.json({ error: "Driver is on a trip; complete or cancel the trip first" }, { status: 400 });
  }

  const data: any = {};
  for (const f of ["name", "category", "contact", "status", "region"]) if (b[f] !== undefined) data[f] = b[f];
  if (b.safetyScore !== undefined) data.safetyScore = Number(b.safetyScore);
  if (b.licenseExpiry !== undefined) data.licenseExpiry = new Date(b.licenseExpiry);

  const driver = await prisma.driver.update({ where: { id }, data });
  return NextResponse.json({ driver });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const trips = await prisma.trip.count({ where: { driverId: id, status: { in: ["DRAFT", "DISPATCHED"] } } });
  if (trips > 0) return NextResponse.json({ error: "Driver has active trips and cannot be deleted" }, { status: 400 });
  await prisma.trip.updateMany({ where: { driverId: id }, data: { driverId: null } });
  await prisma.driver.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
