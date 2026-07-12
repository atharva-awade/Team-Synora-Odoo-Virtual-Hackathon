import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const targets = await prisma.vehicleArTarget.findMany({
    include: {
      vehicle: { select: { regNo: true, name: true, status: true } },
    },
  });

  return NextResponse.json(
    targets.map((t) => ({
      vehicleId: t.vehicleId,
      regNo: t.vehicle.regNo,
      name: t.vehicle.name,
      status: t.vehicle.status,
      pngUrl: `/api/ar/targets/${t.vehicleId}/image`,
      mindUrl: `/api/ar/targets/${t.vehicleId}/mind`,
    }))
  );
}