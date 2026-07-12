import { prisma } from "@/lib/db";

export async function getAnalytics() {
  const [vehicles, trips, fuelLogs, maint, expenses] = await Promise.all([
    prisma.vehicle.findMany(),
    prisma.trip.findMany(),
    prisma.fuelLog.findMany(),
    prisma.maintenanceLog.findMany(),
    prisma.expense.findMany(),
  ]);

  const perVehicle = vehicles.map((v) => {
    const vTrips = trips.filter((t) => t.vehicleId === v.id && t.status === "COMPLETED");
    const revenue = vTrips.reduce((a, t) => a + t.revenue, 0);
    const distance = vTrips.reduce((a, t) => a + (t.actualDistanceKm || 0), 0);
    const vFuel = fuelLogs.filter((f) => f.vehicleId === v.id);
    const fuelCost = vFuel.reduce((a, f) => a + f.cost, 0);
    const fuelUsed = vFuel.reduce((a, f) => a + f.liters, 0);
    const maintCost = maint.filter((m) => m.vehicleId === v.id).reduce((a, m) => a + m.cost, 0);
    const expenseCost = expenses.filter((e) => e.vehicleId === v.id).reduce((a, e) => a + e.amount, 0);
    const opCost = fuelCost + maintCost + expenseCost;
    const roi = v.acquisitionCost > 0 ? ((revenue - (maintCost + fuelCost)) / v.acquisitionCost) * 100 : 0;
    const efficiency = fuelUsed > 0 ? distance / fuelUsed : 0;
    return {
      id: v.id, regNo: v.regNo, name: v.name, status: v.status,
      revenue, distance, fuelCost, fuelUsed, maintCost, expenseCost, opCost,
      roi: Number(roi.toFixed(1)), efficiency: Number(efficiency.toFixed(1)),
    };
  });

  const totalDistance = perVehicle.reduce((a, x) => a + x.distance, 0);
  const totalFuel = perVehicle.reduce((a, x) => a + x.fuelUsed, 0);
  const totalOpCost = perVehicle.reduce((a, x) => a + x.opCost, 0);
  const totalRevenue = perVehicle.reduce((a, x) => a + x.revenue, 0);
  const totalCo2 = trips.reduce((a, t) => a + (t.co2Kg || 0), 0);

  const operational = vehicles.filter((v) => v.status !== "RETIRED").length;
  const onTrip = vehicles.filter((v) => v.status === "ON_TRIP").length;

  const completed = trips
    .filter((t) => t.status === "COMPLETED" && t.completedAt)
    .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());
  const revenueSeries = completed.map((t) => ({ label: t.code, revenue: t.revenue }));

  return {
    perVehicle,
    revenueSeries,
    totals: {
      totalDistance,
      totalFuel,
      totalOpCost,
      totalRevenue,
      totalCo2: Number(totalCo2.toFixed(0)),
      fleetEfficiency: totalFuel > 0 ? Number((totalDistance / totalFuel).toFixed(1)) : 0,
      avgRoi: perVehicle.length ? Number((perVehicle.reduce((a, x) => a + x.roi, 0) / perVehicle.length).toFixed(1)) : 0,
      utilization: operational ? Math.round((onTrip / operational) * 100) : 0,
    },
  };
}
