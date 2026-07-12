// Shared domain constants. SQLite stores these as plain strings, so the app
// layer is the source of truth for allowed values, labels and colors.

export const ROLES = ["FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  FLEET_MANAGER: "Fleet Manager",
  DISPATCHER: "Dispatcher",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
};

export const ROLE_BLURB: Record<Role, string> = {
  FLEET_MANAGER: "Fleet, maintenance and lifecycle oversight",
  DISPATCHER: "Creates trips and assigns vehicles and drivers",
  SAFETY_OFFICER: "Driver compliance, licences and safety scores",
  FINANCIAL_ANALYST: "Expenses, fuel, maintenance cost and profitability",
};

export const VEHICLE_STATUSES = ["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const DRIVER_STATUSES = ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number];

export const TRIP_STATUSES = ["DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const MAINTENANCE_STATUSES = ["OPEN", "CLOSED"] as const;

// Tailwind classes for status pills, keyed by status value.
export const STATUS_STYLE: Record<string, string> = {
  AVAILABLE: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  ON_TRIP: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  DISPATCHED: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  IN_SHOP: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  SUSPENDED: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  RETIRED: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  CANCELLED: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  OFF_DUTY: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  DRAFT: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  COMPLETED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  OPEN: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  CLOSED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

export function statusLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const VEHICLE_TYPES = ["Van", "Truck", "Mini", "Pickup", "Trailer"] as const;
export const DRIVER_CATEGORIES = ["LMV", "HMV", "Trailer"] as const;
export const MAINTENANCE_TYPES = ["Oil Change", "Tyre Replacement", "Engine Repair", "Brake Service", "General Service"] as const;

// 3D model keys mapped to files in /public/models.
export const MODEL_KEYS = ["truck", "pickup", "van", "trailer"] as const;

// Gujarat operating region and known cities with coordinates for routes/maps.
export const REGIONS = ["Gandhinagar", "Ahmedabad", "Surat", "Rajkot"] as const;

export const CITIES: Record<string, { lat: number; lng: number }> = {
  Gandhinagar: { lat: 23.2156, lng: 72.6369 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Vadodara: { lat: 22.3072, lng: 73.1812 },
  Surat: { lat: 21.1702, lng: 72.8311 },
  Rajkot: { lat: 22.3039, lng: 70.8022 },
  Bhavnagar: { lat: 21.7645, lng: 72.1519 },
  Jamnagar: { lat: 22.4707, lng: 70.0577 },
  Mehsana: { lat: 23.588, lng: 72.3693 },
  Anand: { lat: 22.5645, lng: 72.9289 },
  Bharuch: { lat: 21.7051, lng: 72.9959 },
  Gandhidham: { lat: 23.0753, lng: 70.1337 },
  Junagadh: { lat: 21.5222, lng: 70.4579 },
};

export const CITY_NAMES = Object.keys(CITIES);

// kg of CO2 per litre of diesel burned (used for the carbon twin).
export const DIESEL_CO2_PER_L = 2.68;

// Role based access: which primary sections each role can act in.
export const RBAC: Record<Role, { section: string; access: "full" | "view" | "none" }[]> = {
  FLEET_MANAGER: [
    { section: "fleet", access: "full" },
    { section: "drivers", access: "full" },
    { section: "trips", access: "view" },
    { section: "maintenance", access: "full" },
    { section: "fuel", access: "view" },
    { section: "analytics", access: "full" },
  ],
  DISPATCHER: [
    { section: "fleet", access: "view" },
    { section: "drivers", access: "view" },
    { section: "trips", access: "full" },
    { section: "maintenance", access: "view" },
    { section: "fuel", access: "view" },
    { section: "analytics", access: "view" },
  ],
  SAFETY_OFFICER: [
    { section: "fleet", access: "view" },
    { section: "drivers", access: "full" },
    { section: "trips", access: "view" },
    { section: "maintenance", access: "view" },
    { section: "fuel", access: "none" },
    { section: "analytics", access: "view" },
  ],
  FINANCIAL_ANALYST: [
    { section: "fleet", access: "view" },
    { section: "drivers", access: "none" },
    { section: "trips", access: "view" },
    { section: "maintenance", access: "view" },
    { section: "fuel", access: "full" },
    { section: "analytics", access: "full" },
  ],
};
