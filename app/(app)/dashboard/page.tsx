import { Truck, CheckCircle2, Wrench, Route, Clock, Users, Gauge } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getDashboardStats } from "@/lib/services/stats";
import { KpiCard } from "@/components/ui/Kpi";
import { StatusPill } from "@/components/ui/StatusPill";
import { Card } from "@/components/ui/primitives";
import { formatKm } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSession();
  const s = await getDashboardStats();

  const statusBars = [
    { label: "Available", value: s.available, color: "#34d399" },
    { label: "On Trip", value: s.onTrip, color: "#38bdf8" },
    { label: "In Shop", value: s.inShop, color: "#f5a623" },
    { label: "Retired", value: s.retired, color: "#fb7185" },
  ];
  const maxBar = Math.max(1, ...statusBars.map((b) => b.value));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back, {user?.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-muted">Live operational snapshot of your fleet.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
          <span className="live-dot" /> Live
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="Active Vehicles" value={s.activeVehicles} accent="#e8793a" icon={<Truck className="h-4 w-4" />} />
        <KpiCard label="Available" value={s.available} accent="#34d399" icon={<CheckCircle2 className="h-4 w-4" />} />
        <KpiCard label="In Maintenance" value={s.inShop} accent="#f5a623" icon={<Wrench className="h-4 w-4" />} />
        <KpiCard label="Active Trips" value={s.activeTrips} accent="#38bdf8" icon={<Route className="h-4 w-4" />} />
        <KpiCard label="Pending Trips" value={s.pendingTrips} accent="#a78bfa" icon={<Clock className="h-4 w-4" />} />
        <KpiCard label="Drivers On Duty" value={s.driversOnDuty} accent="#f472b6" icon={<Users className="h-4 w-4" />} />
        <KpiCard label="Fleet Utilization" value={s.utilization} suffix="%" accent="#e8793a" icon={<Gauge className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent Trips</h2>
            <span className="text-xs text-muted">{s.recentTrips.length} shown</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
                  <th className="pb-2 font-medium">Trip</th>
                  <th className="pb-2 font-medium">Vehicle</th>
                  <th className="pb-2 font-medium">Driver</th>
                  <th className="pb-2 font-medium">Route</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {s.recentTrips.map((t) => (
                  <tr key={t.id} className="border-b border-line/50 last:border-0">
                    <td className="py-2.5 font-medium">{t.code}</td>
                    <td className="py-2.5 mono text-xs text-muted">{t.vehicle?.regNo ?? "-"}</td>
                    <td className="py-2.5">{t.driver?.name ?? "-"}</td>
                    <td className="py-2.5 text-muted">{t.source} to {t.destination}</td>
                    <td className="py-2.5"><StatusPill status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Vehicle Status</h2>
          <div className="space-y-3">
            {statusBars.map((b) => (
              <div key={b.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted">{b.label}</span>
                  <span className="font-medium">{b.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full" style={{ width: `${(b.value / maxBar) * 100}%`, background: b.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-line pt-4 text-xs text-muted">
            Total fleet distance planned across recent trips:{" "}
            <span className="font-medium text-ink">
              {formatKm(s.recentTrips.reduce((a, t) => a + (t.plannedDistanceKm || 0), 0))}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
