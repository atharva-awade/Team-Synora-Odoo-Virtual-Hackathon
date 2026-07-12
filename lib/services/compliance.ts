import { prisma } from "@/lib/db";

// Compliance radar + predictive maintenance data for the dashboard.
export async function getCompliance() {
  const [drivers, vehicles] = await Promise.all([
    prisma.driver.findMany(),
    prisma.vehicle.findMany({ where: { status: { not: "RETIRED" } } }),
  ]);

  const now = Date.now();
  const licenceAlerts = drivers
    .map((d) => ({ id: d.id, name: d.name, licenseNo: d.licenseNo, status: d.status, days: Math.ceil((new Date(d.licenseExpiry).getTime() - now) / 86400000) }))
    .filter((d) => d.days <= 60)
    .sort((a, b) => a.days - b.days);

  const serviceAlerts = vehicles
    .map((v) => {
      const since = Math.max(0, v.odometer - v.lastServiceOdo);
      const remaining = (v.serviceIntervalKm || 10000) - since;
      return { id: v.id, regNo: v.regNo, name: v.name, remaining };
    })
    .filter((v) => v.remaining <= 3000)
    .sort((a, b) => a.remaining - b.remaining);

  return { licenceAlerts, serviceAlerts };
}
