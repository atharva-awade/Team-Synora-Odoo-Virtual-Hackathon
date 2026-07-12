import { prisma } from "@/lib/db";
import { CITIES, DIESEL_CO2_PER_L, statusLabel } from "@/lib/constants";
import { haversineKm } from "@/lib/utils";

// Domain rule violation. Route handlers map this to an HTTP 400 with the message.
export class RuleError extends Error {}

const DIESEL_PRICE_PER_L = 95; // approx INR per litre, used to estimate fuel cost

async function activity(actor: string, action: string, entity: string, detail = "") {
  try {
    await prisma.activityLog.create({ data: { actor, action, entity, detail } });
  } catch {
    // activity logging is best effort
  }
}

function licenceExpired(expiry: Date): boolean {
  return new Date(expiry).getTime() < Date.now();
}

// ---------------------------------------------------------------------------
// Trips
// ---------------------------------------------------------------------------

export type CreateTripInput = {
  source: string;
  destination: string;
  vehicleId?: string | null;
  driverId?: string | null;
  cargoWeightKg: number;
  plannedDistanceKm?: number;
  revenue?: number;
};

export async function createTrip(input: CreateTripInput, actor: string) {
  if (input.source === input.destination) {
    throw new RuleError("Source and destination must be different");
  }

  // Rule 5: cargo must not exceed capacity (checked at creation if a vehicle is chosen).
  if (input.vehicleId) {
    const v = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (v && input.cargoWeightKg > v.maxLoadKg) {
      throw new RuleError(
        `Cargo weight ${input.cargoWeightKg} kg exceeds ${v.regNo} capacity of ${v.maxLoadKg} kg`,
      );
    }
  }

  const count = await prisma.trip.count();
  const code = "TR" + String(count + 1).padStart(3, "0");

  const src = CITIES[input.source];
  const dst = CITIES[input.destination];
  const planned =
    input.plannedDistanceKm && input.plannedDistanceKm > 0
      ? input.plannedDistanceKm
      : src && dst
        ? haversineKm(src, dst)
        : 0;
  const waypoints = src && dst ? JSON.stringify([[src.lng, src.lat], [dst.lng, dst.lat]]) : "[]";

  const trip = await prisma.trip.create({
    data: {
      code,
      source: input.source,
      destination: input.destination,
      vehicleId: input.vehicleId || null,
      driverId: input.driverId || null,
      cargoWeightKg: input.cargoWeightKg,
      plannedDistanceKm: planned,
      revenue: input.revenue || 0,
      status: "DRAFT",
      srcLat: src?.lat ?? null,
      srcLng: src?.lng ?? null,
      destLat: dst?.lat ?? null,
      destLng: dst?.lng ?? null,
      routeWaypoints: waypoints,
    },
  });
  await activity(actor, "Created trip", trip.code, `${input.source} to ${input.destination}`);
  return trip;
}

// Rule 6: dispatch sets both vehicle and driver to ON_TRIP, after enforcing
// rules 2, 3, 4 and 5.
export async function dispatchTrip(tripId: string, actor: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { vehicle: true, driver: true },
  });
  if (!trip) throw new RuleError("Trip not found");
  if (trip.status !== "DRAFT") throw new RuleError("Only draft trips can be dispatched");
  if (!trip.vehicleId || !trip.driverId || !trip.vehicle || !trip.driver) {
    throw new RuleError("Assign an available vehicle and driver before dispatching");
  }

  const v = trip.vehicle;
  const d = trip.driver;

  // Rules 2 and 4: retired / in-shop / already on-trip vehicles cannot dispatch.
  if (v.status !== "AVAILABLE") {
    throw new RuleError(`Vehicle ${v.regNo} is ${statusLabel(v.status)} and cannot be dispatched`);
  }
  // Rules 3 and 4: suspended / off-duty / on-trip / expired-licence drivers are blocked.
  if (d.status === "SUSPENDED") throw new RuleError(`Driver ${d.name} is suspended and cannot be assigned`);
  if (d.status !== "AVAILABLE") {
    throw new RuleError(`Driver ${d.name} is ${statusLabel(d.status)} and cannot be assigned`);
  }
  if (licenceExpired(d.licenseExpiry)) {
    throw new RuleError(`Driver ${d.name}'s licence has expired and cannot be assigned`);
  }
  // Rule 5: cargo capacity.
  if (trip.cargoWeightKg > v.maxLoadKg) {
    throw new RuleError(
      `Cargo weight ${trip.cargoWeightKg} kg exceeds ${v.regNo} capacity of ${v.maxLoadKg} kg`,
    );
  }

  await prisma.$transaction([
    prisma.trip.update({ where: { id: tripId }, data: { status: "DISPATCHED", dispatchedAt: new Date() } }),
    prisma.vehicle.update({ where: { id: v.id }, data: { status: "ON_TRIP" } }),
    prisma.driver.update({ where: { id: d.id }, data: { status: "ON_TRIP" } }),
  ]);
  await activity(actor, "Dispatched trip", trip.code, `${v.regNo} with ${d.name}`);
  return prisma.trip.findUnique({ where: { id: tripId }, include: { vehicle: true, driver: true } });
}

// Rule 7: completing a trip returns both vehicle and driver to AVAILABLE and
// records the fuel log + derived metrics.
export async function completeTrip(
  tripId: string,
  input: { finalOdometer?: number; fuelUsedL?: number },
  actor: string,
) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { vehicle: true, driver: true },
  });
  if (!trip) throw new RuleError("Trip not found");
  if (trip.status !== "DISPATCHED") throw new RuleError("Only dispatched trips can be completed");

  const v = trip.vehicle!;
  const d = trip.driver!;
  const finalOdo = input.finalOdometer && input.finalOdometer > v.odometer ? input.finalOdometer : null;
  const actualDistance = finalOdo ? finalOdo - v.odometer : trip.plannedDistanceKm;
  const fuel = input.fuelUsedL && input.fuelUsedL > 0 ? input.fuelUsedL : 0;
  const co2 = fuel * DIESEL_CO2_PER_L;
  const efficiency = fuel > 0 ? Number((actualDistance / fuel).toFixed(2)) : null;

  const ops: any[] = [
    prisma.trip.update({
      where: { id: tripId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        actualDistanceKm: actualDistance,
        fuelUsedL: fuel || null,
        co2Kg: co2 || null,
      },
    }),
    prisma.vehicle.update({
      where: { id: v.id },
      data: { status: "AVAILABLE", odometer: finalOdo ?? v.odometer },
    }),
    prisma.driver.update({
      where: { id: d.id },
      data: { status: "AVAILABLE", safetyScore: Math.min(100, d.safetyScore + 1) },
    }),
  ];
  if (fuel > 0) {
    ops.push(
      prisma.fuelLog.create({
        data: {
          vehicleId: v.id,
          tripId: tripId,
          liters: fuel,
          cost: Math.round(fuel * DIESEL_PRICE_PER_L),
          odometer: finalOdo ?? undefined,
          efficiency,
        },
      }),
    );
  }
  await prisma.$transaction(ops);
  await activity(actor, "Completed trip", trip.code, `${actualDistance} km`);
  return prisma.trip.findUnique({ where: { id: tripId }, include: { vehicle: true, driver: true } });
}

// Rule 8: cancelling a dispatched trip restores the vehicle and driver.
export async function cancelTrip(tripId: string, actor: string) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new RuleError("Trip not found");
  if (trip.status === "COMPLETED") throw new RuleError("Completed trips cannot be cancelled");
  if (trip.status === "CANCELLED") throw new RuleError("Trip is already cancelled");

  const ops: any[] = [prisma.trip.update({ where: { id: tripId }, data: { status: "CANCELLED" } })];
  if (trip.status === "DISPATCHED") {
    if (trip.vehicleId) ops.push(prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "AVAILABLE" } }));
    if (trip.driverId) ops.push(prisma.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } }));
  }
  await prisma.$transaction(ops);
  await activity(actor, "Cancelled trip", trip.code);
  return prisma.trip.findUnique({ where: { id: tripId } });
}

// ---------------------------------------------------------------------------
// Maintenance
// ---------------------------------------------------------------------------

// Rule 9: opening a maintenance record moves the vehicle to IN_SHOP.
export async function openMaintenance(
  input: { vehicleId: string; type: string; description?: string; cost?: number; priority?: string },
  actor: string,
) {
  const v = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!v) throw new RuleError("Vehicle not found");
  if (v.status === "RETIRED") throw new RuleError("Retired vehicles cannot enter maintenance");
  if (v.status === "ON_TRIP") throw new RuleError(`${v.regNo} is on a trip; complete or cancel it first`);

  const [log] = await prisma.$transaction([
    prisma.maintenanceLog.create({
      data: {
        vehicleId: v.id,
        type: input.type,
        description: input.description || "",
        cost: input.cost || 0,
        priority: input.priority || "MEDIUM",
        status: "OPEN",
      },
    }),
    prisma.vehicle.update({ where: { id: v.id }, data: { status: "IN_SHOP" } }),
  ]);
  await activity(actor, "Opened maintenance", v.regNo, input.type);
  return log;
}

// Rule 10: closing maintenance returns the vehicle to AVAILABLE unless retired.
export async function closeMaintenance(id: string, actor: string) {
  const m = await prisma.maintenanceLog.findUnique({ where: { id }, include: { vehicle: true } });
  if (!m) throw new RuleError("Maintenance record not found");
  if (m.status === "CLOSED") throw new RuleError("Maintenance record is already closed");

  const ops: any[] = [
    prisma.maintenanceLog.update({ where: { id }, data: { status: "CLOSED", closedAt: new Date() } }),
  ];
  if (m.vehicle.status !== "RETIRED") {
    ops.push(prisma.vehicle.update({ where: { id: m.vehicleId }, data: { status: "AVAILABLE" } }));
  }
  await prisma.$transaction(ops);
  await activity(actor, "Closed maintenance", m.vehicle.regNo, m.type);
  return prisma.maintenanceLog.findUnique({ where: { id } });
}
