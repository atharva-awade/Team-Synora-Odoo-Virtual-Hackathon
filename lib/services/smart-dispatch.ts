import { prisma } from "@/lib/db";
import { CITIES } from "@/lib/constants";
import { haversineKm } from "@/lib/utils";

// Deterministic recommendation engine. Given a route and cargo, it scores every
// eligible vehicle and driver and returns the optimal pairing with a short
// explanation. No ML, fully explainable.
export async function recommend(input: { source: string; destination: string; cargoWeightKg: number }) {
  const [vehicles, drivers] = await Promise.all([
    prisma.vehicle.findMany({ where: { status: "AVAILABLE" } }),
    prisma.driver.findMany({ where: { status: "AVAILABLE", licenseExpiry: { gte: new Date() } } }),
  ]);

  const distance = CITIES[input.source] && CITIES[input.destination] ? haversineKm(CITIES[input.source], CITIES[input.destination]) : 0;
  const cargo = input.cargoWeightKg || 0;

  const scoredVehicles = vehicles
    .filter((v) => v.maxLoadKg >= cargo)
    .map((v) => {
      const utilization = cargo > 0 ? Math.min(1, cargo / v.maxLoadKg) : 0.5; // tighter fit = less wasted capacity
      const sinceService = Math.max(0, v.odometer - v.lastServiceOdo);
      const serviceHealth = 1 - Math.min(1, sinceService / (v.serviceIntervalKm || 10000));
      const score = utilization * 0.6 + serviceHealth * 0.4;
      return { v, score, utilization, serviceHealth };
    })
    .sort((a, b) => b.score - a.score);

  const scoredDrivers = drivers
    .map((d) => {
      const days = (new Date(d.licenseExpiry).getTime() - Date.now()) / 86400000;
      const licenceBuffer = Math.min(1, Math.max(0, days) / 365);
      const score = (d.safetyScore / 100) * 0.7 + licenceBuffer * 0.3;
      return { d, score };
    })
    .sort((a, b) => b.score - a.score);

  const bestV = scoredVehicles[0];
  const bestD = scoredDrivers[0];
  if (!bestV || !bestD) {
    return { ok: false, distance, reason: "No eligible vehicle or driver is currently available." };
  }

  const matchPct = Math.round(((bestV.score + bestD.score) / 2) * 100);
  const reason = `${bestV.v.regNo} uses ${Math.round(bestV.utilization * 100)}% of its capacity for this load with a healthy service window. ${bestD.d.name} has the best safety score (${bestD.d.safetyScore}) among available drivers with a valid licence.`;

  return {
    ok: true,
    distance,
    matchPct,
    vehicle: { id: bestV.v.id, regNo: bestV.v.regNo, name: bestV.v.name, maxLoadKg: bestV.v.maxLoadKg },
    driver: { id: bestD.d.id, name: bestD.d.name, safetyScore: bestD.d.safetyScore },
    reason,
  };
}
