"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Rocket, Loader2, Check, X, Send, AlertTriangle } from "lucide-react";
import { jsonFetch } from "@/lib/client";
import { Button, Input, Select, Field, Card } from "@/components/ui/primitives";
import { StatusPill } from "@/components/ui/StatusPill";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/toast";
import { CITY_NAMES, CITIES, TRIP_STATUSES, statusLabel } from "@/lib/constants";
import { haversineKm, formatINR } from "@/lib/utils";

type Trip = {
  id: string;
  code: string;
  source: string;
  destination: string;
  status: string;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  revenue: number;
  vehicle?: { regNo: string; maxLoadKg: number; odometer: number } | null;
  driver?: { name: string } | null;
};
type Vehicle = { id: string; regNo: string; name: string; maxLoadKg: number; odometer: number };
type Driver = { id: string; name: string; safetyScore: number };

const EMPTY = { source: "Gandhinagar", destination: "Ahmedabad", vehicleId: "", driverId: "", cargoWeightKg: 500, revenue: 8000 };

export function TripManager({ canEdit }: { canEdit: boolean }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>(EMPTY);
  const [completing, setCompleting] = useState<Trip | null>(null);
  const [odo, setOdo] = useState("");
  const [fuel, setFuel] = useState("");

  const tripsQ = useQuery({ queryKey: ["trips"], queryFn: () => jsonFetch("/api/trips"), refetchInterval: 4000 });
  const vehiclesQ = useQuery({ queryKey: ["vehicles", "dispatchable"], queryFn: () => jsonFetch("/api/vehicles?dispatchable=1") });
  const driversQ = useQuery({ queryKey: ["drivers", "available"], queryFn: () => jsonFetch("/api/drivers?available=1") });

  const trips: Trip[] = tripsQ.data?.trips ?? [];
  const vehicles: Vehicle[] = vehiclesQ.data?.vehicles ?? [];
  const drivers: Driver[] = driversQ.data?.drivers ?? [];

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);
  const distance = useMemo(() => {
    if (CITIES[form.source] && CITIES[form.destination]) return haversineKm(CITIES[form.source], CITIES[form.destination]);
    return 0;
  }, [form.source, form.destination]);
  const overCapacity = selectedVehicle ? Number(form.cargoWeightKg) > selectedVehicle.maxLoadKg : false;
  const canDispatch = Boolean(form.vehicleId && form.driverId && !overCapacity && form.source !== form.destination);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["trips"] });
    qc.invalidateQueries({ queryKey: ["vehicles"] });
    qc.invalidateQueries({ queryKey: ["drivers"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };

  const createM = useMutation({
    mutationFn: (dispatch: boolean) =>
      jsonFetch("/api/trips", { method: "POST", body: JSON.stringify({ ...form, plannedDistanceKm: distance, dispatch }) }),
    onSuccess: (_d, dispatch) => { invalidateAll(); toast(dispatch ? "Trip dispatched" : "Draft trip created"); setForm(EMPTY); },
    onError: (e: any) => toast(e.message, "error"),
  });

  const actionM = useMutation({
    mutationFn: ({ id, body }: any) => jsonFetch(`/api/trips/${id}/action`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_d, vars: any) => {
      invalidateAll();
      toast(vars.body.action === "dispatch" ? "Trip dispatched" : vars.body.action === "complete" ? "Trip completed" : "Trip cancelled");
      setCompleting(null); setOdo(""); setFuel("");
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Create trip */}
      {canEdit ? (
        <Card className="p-5">
          <h2 className="font-semibold">Create Trip</h2>
          <Stepper current="DRAFT" />
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Source">
                <Select value={form.source} onChange={(e) => set("source", e.target.value)}>
                  {CITY_NAMES.map((c) => (<option key={c} value={c}>{c}</option>))}
                </Select>
              </Field>
              <Field label="Destination">
                <Select value={form.destination} onChange={(e) => set("destination", e.target.value)}>
                  {CITY_NAMES.map((c) => (<option key={c} value={c}>{c}</option>))}
                </Select>
              </Field>
              <Field label="Vehicle (available only)">
                <Select value={form.vehicleId} onChange={(e) => set("vehicleId", e.target.value)}>
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => (<option key={v.id} value={v.id}>{v.regNo} · {v.maxLoadKg} kg</option>))}
                </Select>
              </Field>
              <Field label="Driver (available only)">
                <Select value={form.driverId} onChange={(e) => set("driverId", e.target.value)}>
                  <option value="">Select driver</option>
                  {drivers.map((d) => (<option key={d.id} value={d.id}>{d.name} · safety {d.safetyScore}</option>))}
                </Select>
              </Field>
              <Field label="Cargo Weight (kg)">
                <Input type="number" value={form.cargoWeightKg} onChange={(e) => set("cargoWeightKg", e.target.value)} />
              </Field>
              <Field label="Freight Revenue">
                <Input type="number" value={form.revenue} onChange={(e) => set("revenue", e.target.value)} />
              </Field>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm">
              <span className="text-muted">Planned distance</span>
              <span className="mono font-medium">{distance} km</span>
            </div>

            {overCapacity && selectedVehicle && (
              <div className="flex items-start gap-2 rounded-lg border border-dashed border-rose-500/50 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  Vehicle capacity: {selectedVehicle.maxLoadKg} kg · Cargo: {form.cargoWeightKg} kg.
                  <br />Capacity exceeded by {Number(form.cargoWeightKg) - selectedVehicle.maxLoadKg} kg, dispatch blocked.
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="secondary" onClick={() => createM.mutate(false)} disabled={createM.isPending}>
                Save as Draft
              </Button>
              <Button onClick={() => createM.mutate(true)} disabled={createM.isPending || !canDispatch} className="flex-1">
                {createM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Rocket className="h-4 w-4" /> Create &amp; Dispatch</>}
              </Button>
            </div>
            <p className="text-xs text-accent/80">
              On dispatch, the vehicle and driver both move to On Trip. On completion they return to Available.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="flex items-center justify-center p-8 text-sm text-muted">
          Your role has view-only access to dispatching.
        </Card>
      )}

      {/* Live board */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Live Board</h2>
          <span className="flex items-center gap-1.5 text-xs text-emerald-300"><span className="live-dot" /> auto-refresh</span>
        </div>
        <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
          {trips.map((t) => (
            <div key={t.id} className="rounded-xl border border-line bg-surface-2/50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="mono text-sm font-semibold">{t.code}</span>
                    <StatusPill status={t.status} />
                  </div>
                  <div className="mt-1 text-sm">{t.source} to {t.destination}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {t.vehicle?.regNo ?? "unassigned"} · {t.driver?.name ?? "no driver"} · {t.cargoWeightKg} kg · {formatINR(t.revenue)}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex shrink-0 flex-col gap-1">
                    {t.status === "DRAFT" && (
                      <>
                        <Button size="sm" onClick={() => actionM.mutate({ id: t.id, body: { action: "dispatch" } })}>
                          <Send className="h-3.5 w-3.5" /> Dispatch
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => actionM.mutate({ id: t.id, body: { action: "cancel" } })}>Cancel</Button>
                      </>
                    )}
                    {t.status === "DISPATCHED" && (
                      <>
                        <Button size="sm" onClick={() => { setCompleting(t); setOdo(String((t.vehicle?.odometer ?? 0) + Math.round(t.plannedDistanceKm))); setFuel(String(Math.round(t.plannedDistanceKm / 6))); }}>
                          <Check className="h-3.5 w-3.5" /> Complete
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => actionM.mutate({ id: t.id, body: { action: "cancel" } })}>
                          <X className="h-3.5 w-3.5" /> Cancel
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {trips.length === 0 && <div className="py-8 text-center text-sm text-muted">No trips yet.</div>}
        </div>
      </Card>

      <Modal open={!!completing} onClose={() => setCompleting(null)} title={`Complete ${completing?.code ?? ""}`}>
        <form
          onSubmit={(e) => { e.preventDefault(); if (completing) actionM.mutate({ id: completing.id, body: { action: "complete", finalOdometer: odo, fuelUsedL: fuel } }); }}
          className="space-y-4"
        >
          <p className="text-sm text-muted">Enter the final odometer and fuel consumed to close out this trip.</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Final Odometer (km)"><Input type="number" value={odo} onChange={(e) => setOdo(e.target.value)} required /></Field>
            <Field label="Fuel Consumed (L)"><Input type="number" value={fuel} onChange={(e) => setFuel(e.target.value)} required /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setCompleting(null)}>Cancel</Button>
            <Button type="submit" disabled={actionM.isPending}>{actionM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Complete Trip"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Stepper({ current }: { current: string }) {
  const idx = TRIP_STATUSES.indexOf(current as any);
  return (
    <div className="mt-3 flex items-center gap-1">
      {TRIP_STATUSES.map((s, i) => (
        <div key={s} className="flex flex-1 items-center gap-1">
          <div className={`h-1.5 w-1.5 rounded-full ${i <= idx ? "bg-accent" : "bg-line"}`} />
          <span className={`text-[10px] ${i === idx ? "text-ink" : "text-muted"}`}>{statusLabel(s)}</span>
          {i < TRIP_STATUSES.length - 1 && <div className={`h-px flex-1 ${i < idx ? "bg-accent" : "bg-line"}`} />}
        </div>
      ))}
    </div>
  );
}
