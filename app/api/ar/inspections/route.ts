import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowedRoles = ["FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER"];
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      vehicleId,
      tirePressureFl,
      tirePressureFr,
      tirePressureRl,
      tirePressureRr,
      fuelLevelPct,
      odometerReading,
      damageItems,
      notes,
      overallStatus,
    } = body;

    if (!vehicleId) {
      return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 });
    }

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, status: true, regNo: true },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Create inspection record
    const inspection = await prisma.vehicleInspection.create({
      data: {
        vehicleId,
        inspectorId: user.id,
        tirePressureFl,
        tirePressureFr,
        tirePressureRl,
        tirePressureRr,
        fuelLevelPct,
        odometerReading,
        damageItems: JSON.stringify(damageItems || []),
        notes,
        overallStatus: overallStatus || "OK",
      },
    });

    // Update vehicle odometer if provided
    if (odometerReading !== null && odometerReading > 0) {
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { odometer: odometerReading },
      });
    }

    // If inspection requires maintenance, create maintenance log and update vehicle status
    if (overallStatus === "REQUIRES_MAINTENANCE" && vehicle.status !== "IN_SHOP") {
      await prisma.maintenanceLog.create({
        data: {
          vehicleId,
          type: "Inspection Finding",
          description: notes || "Issues found during AR inspection",
          cost: 0,
          priority: "HIGH",
          status: "OPEN",
        },
      });
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: "IN_SHOP" },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        actor: user.email,
        action: "AR_INSPECTION",
        entity: "Vehicle",
        detail: `AR inspection logged for ${vehicle.regNo} - Status: ${overallStatus}`,
      },
    });

    return NextResponse.json({ inspectionId: inspection.id, vehicle: vehicle.regNo });
  } catch (e: any) {
    console.error("Inspection submit error:", e);
    return NextResponse.json({ error: e.message || "Failed to save inspection" }, { status: 500 });
  }
}

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const inspections = await prisma.vehicleInspection.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      vehicle: { select: { regNo: true, name: true } },
      inspector: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(inspections);
}