import { Check, Minus, Eye } from "lucide-react";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/primitives";
import { ROLES, ROLE_LABELS, RBAC } from "@/lib/constants";

export const dynamic = "force-dynamic";

const SECTIONS = [
  { key: "fleet", label: "Fleet" },
  { key: "drivers", label: "Drivers" },
  { key: "trips", label: "Trips" },
  { key: "maintenance", label: "Maintenance" },
  { key: "fuel", label: "Fuel / Exp." },
  { key: "analytics", label: "Analytics" },
];

function access(role: (typeof ROLES)[number], section: string) {
  return RBAC[role].find((r) => r.section === section)?.access ?? "view";
}

export default async function SettingsPage() {
  const user = await getSession();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Settings &amp; Access</h1>
        <p className="mt-1 text-sm text-muted">Organization configuration and role based access control.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-4 p-5">
          <h2 className="font-semibold">Organization</h2>
          <Row label="Depot" value="Gandhinagar Depot, GJ" />
          <Row label="Currency" value="INR (Rs.)" />
          <Row label="Distance Unit" value="Kilometres" />
          <Row label="Signed in as" value={`${user?.name} (${user ? ROLE_LABELS[user.role] : ""})`} />
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Role Based Access</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
                  <th className="pb-2 font-medium">Role</th>
                  {SECTIONS.map((s) => (<th key={s.key} className="pb-2 text-center font-medium">{s.label}</th>))}
                </tr>
              </thead>
              <tbody>
                {ROLES.map((role) => (
                  <tr key={role} className="border-b border-line/50 last:border-0">
                    <td className="py-2.5 font-medium">{ROLE_LABELS[role]}</td>
                    {SECTIONS.map((s) => {
                      const a = access(role, s.key);
                      return (
                        <td key={s.key} className="py-2.5 text-center">
                          {a === "full" && <Check className="mx-auto h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                          {a === "view" && <Eye className="mx-auto h-4 w-4 text-sky-600 dark:text-sky-400" />}
                          {a === "none" && <Minus className="mx-auto h-4 w-4 text-muted/50" />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-4 text-xs text-muted">
            <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Full access</span>
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" /> View only</span>
            <span className="flex items-center gap-1"><Minus className="h-3.5 w-3.5 text-muted/50" /> No access</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line/50 pb-2 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
