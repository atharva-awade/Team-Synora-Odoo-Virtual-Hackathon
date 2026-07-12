"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Wrench, CheckCircle2 } from "lucide-react";
import { jsonFetch } from "@/lib/client";
import { Button, Input, Select, Textarea, Field, Card } from "@/components/ui/primitives";
import { StatusPill } from "@/components/ui/StatusPill";
import { toast } from "@/components/ui/toast";
import { MAINTENANCE_TYPES } from "@/lib/constants";
import { formatINR, formatDate } from "@/lib/utils";

type Log = {
  id: string;
  type: string;
  description: string;
  cost: number;
  priority: string;
  status: string;
  openedAt: string;
  vehicle: { regNo: string; name: string };
};

export function MaintenanceManager({ canEdit }: { canEdit: boolean }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>({ vehicleId: "", type: "Oil Change", cost: 2500, priority: "MEDIUM", description: "" });

  const logsQ = useQuery({ queryKey: ["maintenance"], queryFn: () => jsonFetch("/api/maintenance") });
  const vehiclesQ = useQuery({ queryKey: ["vehicles", "AVAILABLE"], queryFn: () => jsonFetch("/api/vehicles?status=AVAILABLE") });
  const logs: Log[] = logsQ.data?.logs ?? [];
  const vehicles = vehiclesQ.data?.vehicles ?? [];

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["maintenance"] });
    qc.invalidateQueries({ queryKey: ["vehicles"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };

  const openM = useMutation({
    mutationFn: (body: any) => jsonFetch("/api/maintenance", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => { invalidate(); toast("Service logged, vehicle moved to In Shop"); setForm({ ...form, vehicleId: "", description: "" }); },
    onError: (e: any) => toast(e.message, "error"),
  });
  const closeM = useMutation({
    mutationFn: (id: string) => jsonFetch(`/api/maintenance/${id}/close`, { method: "POST" }),
    onSuccess: () => { invalidate(); toast("Service closed, vehicle back to Available"); },
    onError: (e: any) => toast(e.message, "error"),
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {canEdit && (
        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-semibold"><Wrench className="h-4 w-4 text-accent" /> Log Service Record</h2>
          <form onSubmit={(e) => { e.preventDefault(); openM.mutate(form); }} className="mt-4 space-y-3">
            <Field label="Vehicle (available only)">
              <Select value={form.vehicleId} onChange={(e) => set("vehicleId", e.target.value)} required>
                <option value="">Select vehicle</option>
                {vehicles.map((v: any) => (<option key={v.id} value={v.id}>{v.regNo} · {v.name}</option>))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Service Type">
                <Select value={form.type} onChange={(e) => set("type", e.target.value)}>
                  {MAINTENANCE_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
                </Select>
              </Field>
              <Field label="Cost">
                <Input type="number" value={form.cost} onChange={(e) => set("cost", e.target.value)} />
              </Field>
              <Field label="Priority">
                <Select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </Select>
              </Field>
            </div>
            <Field label="Description">
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the issue" />
            </Field>
            <Button type="submit" disabled={openM.isPending} className="w-full">
              {openM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log Service"}
            </Button>
            <p className="text-xs text-accent/80">Logging a service moves the vehicle to In Shop and hides it from dispatch. Closing restores it to Available.</p>
          </form>
        </Card>
      )}

      <Card className={`p-5 ${canEdit ? "" : "lg:col-span-2"}`}>
        <h2 className="mb-3 font-semibold">Service Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
                <th className="pb-2 font-medium">Vehicle</th>
                <th className="pb-2 font-medium">Service</th>
                <th className="pb-2 font-medium">Cost</th>
                <th className="pb-2 font-medium">Opened</th>
                <th className="pb-2 font-medium">Status</th>
                {canEdit && <th className="pb-2 font-medium" />}
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-line/50 last:border-0">
                  <td className="py-2.5 mono text-xs">{l.vehicle.regNo}</td>
                  <td className="py-2.5">{l.type}</td>
                  <td className="py-2.5 text-muted">{formatINR(l.cost)}</td>
                  <td className="py-2.5 text-xs text-muted">{formatDate(l.openedAt)}</td>
                  <td className="py-2.5"><StatusPill status={l.status} /></td>
                  {canEdit && (
                    <td className="py-2.5 text-right">
                      {l.status === "OPEN" && (
                        <Button size="sm" variant="secondary" onClick={() => closeM.mutate(l.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Close
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {logs.length === 0 && (<tr><td colSpan={6} className="py-8 text-center text-muted">No service records.</td></tr>)}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
