import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CITIES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const type = sp.get("type");
  const region = sp.get("region");
  const q = sp.get("q");
  const bookable = sp.get("dispatchable"); // AVAILABLE only, for trip assignment

  const where: any = {};
  if (status && status !== "ALL") where.status = status;
  if (type && type !== "ALL") where.type = type;
  if (region && region !== "ALL") where.region = region;
  if (bookable === "1") where.status = "AVAILABLE";
  if (q) {
    where.OR = [{ regNo: { contains: q.toUpperCase() } }, { name: { contains: q } }];
  }

  const vehicles = await prisma.vehicle.findMany({ where, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ vehicles });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  if (!b.regNo || !b.name || !b.type || !b.maxLoadKg) {
    return NextResponse.json({ error: "Registration number, name, type and capacity are required" }, { status: 400 });
  }
  const region = b.region || "Gandhinagar";
  try {
    const vehicle = await prisma.vehicle.create({
      data: {
        regNo: String(b.regNo).toUpperCase().trim(),
        name: String(b.name).trim(),
        type: b.type,
        maxLoadKg: Number(b.maxLoadKg),
        odometer: Number(b.odometer) || 0,
        acquisitionCost: Number(b.acquisitionCost) || 0,
        region,
        fuelType: b.fuelType || "Diesel",
        modelKey: b.modelKey || "truck",
        homeLat: CITIES[region]?.lat ?? null,
        homeLng: CITIES[region]?.lng ?? null,
        lastServiceOdo: Number(b.odometer) || 0,
      },
    });
    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "A vehicle with this registration number already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to register vehicle" }, { status: 400 });
  }
}
