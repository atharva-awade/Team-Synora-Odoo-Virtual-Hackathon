import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CITIES, DIESEL_CO2_PER_L } from "../lib/constants";
import { haversineKm } from "../lib/utils";

const prisma = new PrismaClient();

function dist(a: string, b: string): number {
  return haversineKm(CITIES[a], CITIES[b]);
}
function daysFromNow(d: number): Date {
  return new Date(Date.now() + d * 86400000);
}
function route(a: string, b: string): string {
  return JSON.stringify([[CITIES[a].lng, CITIES[a].lat], [CITIES[b].lng, CITIES[b].lat]]);
}

async function main() {
  await prisma.fuelLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.user.deleteMany();
  await prisma.activityLog.deleteMany();

  const pw = await bcrypt.hash("synora123", 10);
  await prisma.user.createMany({
    data: [
      { email: "fleet@synora.in", name: "Aarav Mehta", role: "FLEET_MANAGER", passwordHash: pw },
      { email: "dispatch@synora.in", name: "Raven Kapoor", role: "DISPATCHER", passwordHash: pw },
      { email: "safety@synora.in", name: "Diya Nair", role: "SAFETY_OFFICER", passwordHash: pw },
      { email: "finance@synora.in", name: "Kabir Rao", role: "FINANCIAL_ANALYST", passwordHash: pw },
    ],
  });

  // Vehicles (one RETIRED, one IN_SHOP, two ON_TRIP set below via dispatched trips).
  const mk = (d: {
    regNo: string; name: string; type: string; maxLoadKg: number; odometer: number;
    acquisitionCost: number; status: string; region: string; modelKey: string;
    lastServiceOdo?: number; serviceIntervalKm?: number;
  }) =>
    prisma.vehicle.create({
      data: {
        ...d,
        homeLat: CITIES[d.region]?.lat ?? null,
        homeLng: CITIES[d.region]?.lng ?? null,
        lastServiceOdo: d.lastServiceOdo ?? d.odometer - 4000,
        serviceIntervalKm: d.serviceIntervalKm ?? 10000,
      },
    });

  const v1 = await mk({ regNo: "GJ01AB4521", name: "Tata Ace Gold", type: "Mini", maxLoadKg: 750, odometer: 74000, acquisitionCost: 620000, status: "AVAILABLE", region: "Gandhinagar", modelKey: "van" });
  const v2 = await mk({ regNo: "GJ01AB9981", name: "Ashok Leyland 1920", type: "Truck", maxLoadKg: 12000, odometer: 182000, acquisitionCost: 2450000, status: "ON_TRIP", region: "Ahmedabad", modelKey: "truck" });
  const v3 = await mk({ regNo: "GJ05CD1120", name: "Mahindra Bolero Pickup", type: "Pickup", maxLoadKg: 1500, odometer: 66000, acquisitionCost: 910000, status: "IN_SHOP", region: "Rajkot", modelKey: "pickup" });
  const v4 = await mk({ regNo: "GJ01AB0087", name: "Eicher Pro 2049", type: "Truck", maxLoadKg: 5000, odometer: 241900, acquisitionCost: 1890000, status: "RETIRED", region: "Gandhinagar", modelKey: "truck" });
  const v5 = await mk({ regNo: "GJ06EF3345", name: "Tata 407", type: "Mini", maxLoadKg: 2500, odometer: 120500, acquisitionCost: 1150000, status: "AVAILABLE", region: "Surat", modelKey: "truck", lastServiceOdo: 111000 });
  const v6 = await mk({ regNo: "GJ05CD7788", name: "Mahindra Furio 7", type: "Truck", maxLoadKg: 9000, odometer: 54000, acquisitionCost: 2100000, status: "ON_TRIP", region: "Rajkot", modelKey: "truck" });
  const v7 = await mk({ regNo: "GJ01AB2299", name: "Maruti Super Carry", type: "Van", maxLoadKg: 740, odometer: 33000, acquisitionCost: 560000, status: "AVAILABLE", region: "Gandhinagar", modelKey: "van" });
  const v8 = await mk({ regNo: "GJ06EF5567", name: "BharatBenz 1415R", type: "Truck", maxLoadKg: 10000, odometer: 98000, acquisitionCost: 2600000, status: "AVAILABLE", region: "Surat", modelKey: "truck", lastServiceOdo: 89500 });

  // Drivers (one expired licence + suspended, one licence expiring soon).
  const dk = ({ expiry, ...rest }: { name: string; licenseNo: string; category: string; expiry: Date; contact: string; safetyScore: number; status: string; region: string }) =>
    prisma.driver.create({ data: { ...rest, licenseExpiry: expiry } });

  const d1 = await dk({ name: "Alex Fernandes", licenseNo: "DL-GJ-88213", category: "HMV", expiry: daysFromNow(600), contact: "98765 43210", safetyScore: 96, status: "ON_TRIP", region: "Ahmedabad" });
  const d2 = await dk({ name: "Suresh Patel", licenseNo: "DL-GJ-44120", category: "HMV", expiry: daysFromNow(-120), contact: "98220 11234", safetyScore: 74, status: "SUSPENDED", region: "Rajkot" });
  const d3 = await dk({ name: "Priya Shah", licenseNo: "DL-GJ-77031", category: "LMV", expiry: daysFromNow(400), contact: "99110 55678", safetyScore: 99, status: "AVAILABLE", region: "Gandhinagar" });
  const d4 = await dk({ name: "Rajesh Kumar", licenseNo: "DL-GJ-90045", category: "HMV", expiry: daysFromNow(210), contact: "97440 22190", safetyScore: 88, status: "ON_TRIP", region: "Rajkot" });
  const d5 = await dk({ name: "Imran Sheikh", licenseNo: "DL-GJ-33067", category: "HMV", expiry: daysFromNow(13), contact: "90999 33221", safetyScore: 90, status: "AVAILABLE", region: "Surat" });
  const d6 = await dk({ name: "Neha Joshi", licenseNo: "DL-GJ-55201", category: "LMV", expiry: daysFromNow(1000), contact: "93280 77654", safetyScore: 93, status: "OFF_DUTY", region: "Gandhinagar" });

  // Open maintenance for the in-shop vehicle.
  await prisma.maintenanceLog.create({
    data: { vehicleId: v3.id, type: "Engine Repair", description: "Coolant leak and timing belt", cost: 18500, priority: "HIGH", status: "OPEN", openedAt: daysFromNow(-1) },
  });
  await prisma.maintenanceLog.create({
    data: { vehicleId: v5.id, type: "Oil Change", description: "Routine service", cost: 2500, priority: "LOW", status: "CLOSED", openedAt: daysFromNow(-20), closedAt: daysFromNow(-19) },
  });

  // Two active dispatched trips (their vehicle + driver are ON_TRIP above).
  await prisma.trip.create({
    data: { code: "TR001", source: "Ahmedabad", destination: "Vadodara", vehicleId: v2.id, driverId: d1.id, cargoWeightKg: 8000, plannedDistanceKm: dist("Ahmedabad", "Vadodara"), revenue: 18000, status: "DISPATCHED", dispatchedAt: daysFromNow(0), srcLat: CITIES["Ahmedabad"].lat, srcLng: CITIES["Ahmedabad"].lng, destLat: CITIES["Vadodara"].lat, destLng: CITIES["Vadodara"].lng, routeWaypoints: route("Ahmedabad", "Vadodara") },
  });
  await prisma.trip.create({
    data: { code: "TR002", source: "Rajkot", destination: "Jamnagar", vehicleId: v6.id, driverId: d4.id, cargoWeightKg: 7000, plannedDistanceKm: dist("Rajkot", "Jamnagar"), revenue: 15000, status: "DISPATCHED", dispatchedAt: daysFromNow(0), srcLat: CITIES["Rajkot"].lat, srcLng: CITIES["Rajkot"].lng, destLat: CITIES["Jamnagar"].lat, destLng: CITIES["Jamnagar"].lng, routeWaypoints: route("Rajkot", "Jamnagar") },
  });

  // Historical completed trips for analytics, with fuel logs.
  const completed = [
    { code: "TR003", a: "Gandhinagar", b: "Surat", vehicle: v1, driver: d3, cargo: 600, revenue: 9000, fuel: 34, days: -3 },
    { code: "TR004", a: "Surat", b: "Bharuch", vehicle: v5, driver: d5, cargo: 2100, revenue: 7600, fuel: 22, days: -4 },
    { code: "TR005", a: "Gandhinagar", b: "Rajkot", vehicle: v8, driver: d3, cargo: 8500, revenue: 21000, fuel: 61, days: -5 },
    { code: "TR006", a: "Ahmedabad", b: "Mehsana", vehicle: v1, driver: d6, cargo: 500, revenue: 5200, fuel: 12, days: -6 },
    { code: "TR007", a: "Surat", b: "Vadodara", vehicle: v8, driver: d5, cargo: 9000, revenue: 17500, fuel: 44, days: -8 },
    { code: "TR008", a: "Rajkot", b: "Gandhidham", vehicle: v5, driver: d3, cargo: 2400, revenue: 12800, fuel: 39, days: -10 },
  ];
  for (const t of completed) {
    const distance = dist(t.a, t.b);
    await prisma.trip.create({
      data: {
        code: t.code, source: t.a, destination: t.b, vehicleId: t.vehicle.id, driverId: t.driver.id,
        cargoWeightKg: t.cargo, plannedDistanceKm: distance, actualDistanceKm: distance, revenue: t.revenue,
        status: "COMPLETED", dispatchedAt: daysFromNow(t.days), completedAt: daysFromNow(t.days + 1),
        fuelUsedL: t.fuel, co2Kg: Number((t.fuel * DIESEL_CO2_PER_L).toFixed(1)),
        srcLat: CITIES[t.a].lat, srcLng: CITIES[t.a].lng, destLat: CITIES[t.b].lat, destLng: CITIES[t.b].lng,
        routeWaypoints: route(t.a, t.b),
      },
    });
    await prisma.fuelLog.create({
      data: { vehicleId: t.vehicle.id, liters: t.fuel, cost: Math.round(t.fuel * 95), efficiency: Number((distance / t.fuel).toFixed(2)), date: daysFromNow(t.days + 1) },
    });
    await prisma.expense.create({
      data: { vehicleId: t.vehicle.id, type: "TOLL", amount: Math.round(distance * 2.2), note: `Toll ${t.a} to ${t.b}`, date: daysFromNow(t.days + 1) },
    });
  }

  // One draft trip waiting in the dispatcher queue.
  await prisma.trip.create({
    data: { code: "TR009", source: "Gandhinagar", destination: "Mehsana", cargoWeightKg: 500, plannedDistanceKm: dist("Gandhinagar", "Mehsana"), revenue: 4800, status: "DRAFT", srcLat: CITIES["Gandhinagar"].lat, srcLng: CITIES["Gandhinagar"].lng, destLat: CITIES["Mehsana"].lat, destLng: CITIES["Mehsana"].lng, routeWaypoints: route("Gandhinagar", "Mehsana") },
  });

  const counts = {
    users: await prisma.user.count(),
    vehicles: await prisma.vehicle.count(),
    drivers: await prisma.driver.count(),
    trips: await prisma.trip.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
