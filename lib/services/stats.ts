import { prisma } from "@/lib/db";

export async function getDashboardStats() {
  const [vehicles, trips, drivers, openMaintenance] = await Promise.all([
    prisma.vehicle.findMany(),
    prisma.trip.findMany({ include: { vehicle: true, driver: true }, orderBy: { createdAt: "desc" } }),
    prisma.driver.findMany(),
    prisma.maintenanceLog.count({ where: { status: "OPEN" } }),
  ]);

  const count = (s: string) => vehicles.filter((v) => v.status === s).length;
  const available = count("AVAILABLE");
  const onTrip = count("ON_TRIP");
  const inShop = count("IN_SHOP");
  const retired = count("RETIRED");
  const operational = available + onTrip + inShop;

  return {
    activeVehicles: vehicles.length - retired,
    totalVehicles: vehicles.length,
    available,
    onTrip,
    inShop,
    retired,
    activeTrips: trips.filter((t) => t.status === "DISPATCHED").length,
    pendingTrips: trips.filter((t) => t.status === "DRAFT").length,
    driversOnDuty: drivers.filter((d) => d.status === "ON_TRIP").length,
    totalDrivers: drivers.length,
    openMaintenance,
    utilization: operational ? Math.round((onTrip / operational) * 100) : 0,
    recentTrips: trips.slice(0, 6),
    vehicles,
  };
}
