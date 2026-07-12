"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Archive, Loader2 } from "lucide-react";
import { jsonFetch } from "@/lib/client";
import { Button, Input, Select, Field, Card } from "@/components/ui/primitives";
import { StatusPill } from "@/components/ui/StatusPill";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/toast";
import { VEHICLE_TYPES, VEHICLE_STATUSES, REGIONS, MODEL_KEYS, statusLabel } from "@/lib/constants";
import { formatINR, formatNumber } from "@/lib/utils";

type Vehicle = {
  id: string;
  regNo: string;
  name: string;
  type: string;
  maxLoadKg: number;
  odometer: number;
  acquisitionCost: number;
  status: string;
  region: string;
};

const EMPTY = { regNo: "", name: "", type: "Truck", maxLoadKg: 1000, odometer: 0, acquisitionCost: 500000, region: "Gandhinagar", modelKey: "truck" };

export function VehicleManager({ canEdit }: { canEdit: boolean }) {
  const qc = useQueryClient();
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);

  const key = ["vehicles", type, status, q];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => {
      const p = new URLSearchParams();
      if (type !== "ALL") p.set("type", type);
      if (status !== "ALL") p.set("status", status);
      if (q) p.set("q", q);
      return jsonFetch(`/api/vehicles?${p.toString()}`);
    },
  });
  const vehicles: Vehicle[] = data?.vehicles ?? [];

  const createM = useMutation({
    mutationFn: (body: any) => jsonFetch("/api/vehicles", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast("Vehicle registered");
      setOpen(false);
      setForm(EMPTY);
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  const patchM = useMutation({
    mutationFn: ({ id, body }: any) => jsonFetch(`/api/vehicles/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast("Vehicle updated");
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  const delM = useMutation({
    mutationFn: (id: string) => jsonFetch(`/api/vehicles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast("Vehicle removed");
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search registration or model" className="pl-9" />
        </div>
        <Select value={type} onChange={(e) => setType(e.target.value)} className="w-36">
          <option value="ALL">All types</option>
          {VEHICLE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          <option value="ALL">All statuses</option>
          {VEHICLE_STATUSES.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </Select>
        {canEdit && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add Vehicle
          </Button>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
              <th className="pb-2 font-medium">Reg. No</th>
              <th className="pb-2 font-medium">Name / Model</th>
              <th className="pb-2 font-medium">Type</th>
              <th className="pb-2 font-medium">Capacity</th>
              <th className="pb-2 font-medium">Odometer</th>
              <th className="pb-2 font-medium">Acq. Cost</th>
              <th className="pb-2 font-medium">Status</th>
              {canEdit && <th className="pb-2 font-medium" />}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            )}
            {!isLoading && vehicles.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted">No vehicles match these filters.</td>
              </tr>
            )}
            {vehicles.map((v) => (
              <tr key={v.id} className="border-b border-line/50 last:border-0 hover:bg-surface-2/40">
                <td className="py-2.5 mono font-medium">{v.regNo}</td>
                <td className="py-2.5">{v.name}</td>
                <td className="py-2.5 text-muted">{v.type}</td>
                <td className="py-2.5 text-muted">{formatNumber(v.maxLoadKg)} kg</td>
                <td className="py-2.5 mono text-xs text-muted">{formatNumber(v.odometer)}</td>
                <td className="py-2.5 text-muted">{formatINR(v.acquisitionCost)}</td>
                <td className="py-2.5"><StatusPill status={v.status} /></td>
                {canEdit && (
                  <td className="py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      {v.status !== "RETIRED" && (
                        <button
                          onClick={() => patchM.mutate({ id: v.id, body: { status: "RETIRED" } })}
                          title="Retire vehicle"
                          className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-amber-500"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => delM.mutate(v.id)}
                        title="Delete vehicle"
                        className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-accent/80">
        Rule: registration number must be unique. Retired and In Shop vehicles are hidden from the dispatch pool.
      </p>

      <Modal open={open} onClose={() => setOpen(false)} title="Register Vehicle">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createM.mutate(form);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Registration No">
              <Input value={form.regNo} onChange={(e) => set("regNo", e.target.value)} placeholder="GJ01AB1234" required />
            </Field>
            <Field label="Name / Model">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Tata Ace" required />
            </Field>
            <Field label="Type">
              <Select value={form.type} onChange={(e) => set("type", e.target.value)}>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field label="Max Load (kg)">
              <Input type="number" value={form.maxLoadKg} onChange={(e) => set("maxLoadKg", e.target.value)} required />
            </Field>
            <Field label="Odometer (km)">
              <Input type="number" value={form.odometer} onChange={(e) => set("odometer", e.target.value)} />
            </Field>
            <Field label="Acquisition Cost">
              <Input type="number" value={form.acquisitionCost} onChange={(e) => set("acquisitionCost", e.target.value)} />
            </Field>
            <Field label="Region">
              <Select value={form.region} onChange={(e) => set("region", e.target.value)}>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
            </Field>
            <Field label="3D Model">
              <Select value={form.modelKey} onChange={(e) => set("modelKey", e.target.value)}>
                {MODEL_KEYS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createM.isPending}>
              {createM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register"}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
