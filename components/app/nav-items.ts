import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
  Globe2,
} from "lucide-react";
import { RBAC, type Role } from "@/lib/constants";

export const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, section: null },
  { href: "/fleet", label: "Fleet", icon: Truck, section: "fleet" },
  { href: "/drivers", label: "Drivers", icon: Users, section: "drivers" },
  { href: "/trips", label: "Trips", icon: Route, section: "trips" },
  { href: "/command", label: "Live Map", icon: Globe2, section: null },
  { href: "/maintenance", label: "Maintenance", icon: Wrench, section: "maintenance" },
  { href: "/fuel", label: "Fuel & Expenses", icon: Fuel, section: "fuel" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, section: "analytics" },
  { href: "/settings", label: "Settings", icon: Settings, section: null },
] as const;

// Filter the nav by what the role is allowed to see.
export function navFor(role: Role) {
  const denied = new Set(RBAC[role].filter((r) => r.access === "none").map((r) => r.section));
  return NAV.filter((n) => !n.section || !denied.has(n.section));
}
