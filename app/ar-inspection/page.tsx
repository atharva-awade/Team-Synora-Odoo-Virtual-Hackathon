import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ARInspectionClient from "@/components/inspection/ARInspectionClient";

export const dynamic = "force-dynamic";

export default async function ARInspectionPage() {
  const user = await getSession();
  if (!user) return null;

  const allowedRoles = ["FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"];
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 text-center text-muted">
        Access denied
      </div>
    );
  }

  const vehicles = await prisma.vehicle.findMany({
    where: {
      status: { in: ["AVAILABLE", "ON_TRIP", "IN_SHOP"] },
    },
    select: {
      id: true,
      regNo: true,
      name: true,
      type: true,
      maxLoadKg: true,
      odometer: true,
      acquisitionCost: true,
      status: true,
      region: true,
      lastServiceOdo: true,
      serviceIntervalKm: true,
    },
    orderBy: { regNo: "asc" },
  });

  const vehiclesForClient = vehicles.map((v) => ({
    ...v,
    vehicleId: v.id,
  }));

  return <ARInspectionClient vehicles={vehiclesForClient} user={user} />;
}