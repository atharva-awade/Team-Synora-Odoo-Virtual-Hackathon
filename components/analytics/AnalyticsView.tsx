"use client";

import { Download, Gauge, TrendingUp, Wallet, Leaf } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Button, Card } from "@/components/ui/primitives";
import { formatINR, formatNumber } from "@/lib/utils";

type PerVehicle = {
  regNo: string; name: string; status: string; revenue: number; distance: number;
  fuelCost: number; maintCost: number; opCost: number; roi: number; efficiency: number;
};
type Data = {
  perVehicle: PerVehicle[];
  revenueSeries: { label: string; revenue: number }[];
  totals: { totalDistance: number; totalFuel: number; totalOpCost: number; totalRevenue: number; totalCo2: number; fleetEfficiency: number; avgRoi: number; utilization: number };
};

export function AnalyticsView({ data }: { data: Data }) {
  const { perVehicle, revenueSeries, totals } = data;
  const costliest = [...perVehicle].filter((v) => v.opCost > 0).sort((a, b) => b.opCost - a.opCost).slice(0, 5);
  const maxCost = Math.max(1, ...costliest.map((v) => v.opCost));
  const roiRanked = [...perVehicle].sort((a, b) => b.roi - a.roi).slice(0, 6);

  function exportCsv() {
    const header = ["Reg No", "Name", "Status", "Revenue", "Distance km", "Fuel Cost", "Maint Cost", "Operational Cost", "ROI %", "Efficiency km/L"];
    const rows = perVehicle.map((r) => [r.regNo, r.name, r.status, r.revenue, r.distance, r.fuelCost, r.maintCost, r.opCost, r.roi, r.efficiency]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transitops-fleet-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="secondary" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={<Gauge className="h-4 w-4" />} label="Fuel Efficiency" value={`${totals.fleetEfficiency} km/L`} accent="#e8793a" />
        <Metric icon={<TrendingUp className="h-4 w-4" />} label="Fleet Utilization" value={`${totals.utilization}%`} accent="#34d399" />
        <Metric icon={<Wallet className="h-4 w-4" />} label="Operational Cost" value={formatINR(totals.totalOpCost)} accent="#38bdf8" />
        <Metric icon={<TrendingUp className="h-4 w-4" />} label="Avg Vehicle ROI" value={`${totals.avgRoi}%`} accent="#a78bfa" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Revenue by Completed Trip</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueSeries} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232329" vertical={false} />
                <XAxis dataKey="label" stroke="#8b8b95" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#8b8b95" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  cursor={{ fill: "rgba(232,121,58,0.08)" }}
                  contentStyle={{ background: "#17171b", border: "1px solid #232329", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: any) => [formatINR(v), "Revenue"]}
                />
                <Bar dataKey="revenue" fill="#e8793a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Top Costliest Vehicles</h2>
          <div className="space-y-3">
            {costliest.map((v) => (
              <div key={v.regNo}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="mono">{v.regNo}</span>
                  <span className="text-muted">{formatINR(v.opCost)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2" style={{ width: `${(v.opCost / maxCost) * 100}%` }} />
                </div>
              </div>
            ))}
            {costliest.length === 0 && <div className="py-6 text-center text-sm text-muted">No cost data yet.</div>}
          </div>
          <div className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-xs text-muted">
            <Leaf className="h-4 w-4 text-emerald-400" />
            Fleet carbon footprint: <span className="font-medium text-ink">{formatNumber(totals.totalCo2)} kg CO2</span>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Vehicle ROI Leaderboard</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
                <th className="pb-2 font-medium">Vehicle</th>
                <th className="pb-2 font-medium">Revenue</th>
                <th className="pb-2 font-medium">Op. Cost</th>
                <th className="pb-2 font-medium">Efficiency</th>
                <th className="pb-2 font-medium">ROI</th>
              </tr>
            </thead>
            <tbody>
              {roiRanked.map((v) => (
                <tr key={v.regNo} className="border-b border-line/50 last:border-0">
                  <td className="py-2.5"><span className="mono text-xs">{v.regNo}</span> <span className="text-muted">{v.name}</span></td>
                  <td className="py-2.5 text-muted">{formatINR(v.revenue)}</td>
                  <td className="py-2.5 text-muted">{formatINR(v.opCost)}</td>
                  <td className="py-2.5 text-muted">{v.efficiency} km/L</td>
                  <td className="py-2.5">
                    <span className={v.roi >= 0 ? "text-emerald-300" : "text-rose-300"}>{v.roi}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost</p>
      </Card>
    </div>
  );
}

function Metric({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="card relative overflow-hidden p-4">
      <div className="absolute left-0 top-0 h-full w-1" style={{ background: accent }} />
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
        <div className="text-muted">{icon}</div>
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
