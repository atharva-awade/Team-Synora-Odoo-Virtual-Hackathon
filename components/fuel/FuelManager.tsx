"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Fuel, Plus, Loader2, Receipt } from "lucide-react";
import { jsonFetch } from "@/lib/client";
import { Button, Input, Select, Field, Card } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/toast";
import { formatINR, formatDate } from "@/lib/utils";

export function FuelManager({ canEdit }: { canEdit: boolean }) {
  const qc = useQueryClient();
  const [fuelOpen, setFuelOpen] = useState(false);
  const [expOpen, setExpOpen] = useState(false);
  const [fuelForm, setFuelForm] = useState<any>({ vehicleId: "", liters: 40, cost: "", odometer: "" });
  const [expForm, setExpForm] = useState<any>({ vehicleId: "", type: "TOLL", amount: 500, note: "" });

  const dataQ = useQuery({ queryKey: ["fuel"], queryFn: () => jsonFetch("/api/fuel") });
  const vehiclesQ = useQuery({ queryKey: ["vehicles", "all"], queryFn: () => jsonFetch("/api/vehicles") });
  const fuelLogs = dataQ.data?.fuelLogs ?? [];
  const expenses = dataQ.data?.expenses ?? [];
  const totals = dataQ.data?.totals ?? { fuelCost: 0, maintCost: 0, expenseCost: 0, total: 0 };
  const vehicles = vehiclesQ.data?.vehicles ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["fuel"] });

  const fuelM = useMutation({
    mutationFn: (body: any) => jsonFetch("/api/fuel", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => { invalidate(); toast("Fuel logged"); setFuelOpen(false); },
    onError: (e: any) => toast(e.message, "error"),
  });
  const expM = useMutation({
    mutationFn: (body: any) => jsonFetch("/api/expenses", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => { invalidate(); toast("Expense recorded"); setExpOpen(false); },
    onError: (e: any) => toast(e.message, "error"),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <CostTile label="Fuel Cost" value={totals.fuelCost} accent="#714B67" />
        <CostTile label="Maintenance Cost" value={totals.maintCost} accent="#875A7B" />
        <CostTile label="Other Expenses" value={totals.expenseCost} accent="#38bdf8" />
        <CostTile label="Total Operational Cost" value={totals.total} accent="#34d399" bold />
      </div>

      {canEdit && (
        <div className="flex gap-2">
          <Button onClick={() => setFuelOpen(true)}><Fuel className="h-4 w-4" /> Log Fuel</Button>
          <Button variant="secondary" onClick={() => setExpOpen(true)}><Plus className="h-4 w-4" /> Add Expense</Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><Fuel className="h-4 w-4 text-accent" /> Fuel Logs</h2>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
                  <th className="pb-2 font-medium">Vehicle</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Litres</th>
                  <th className="pb-2 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {fuelLogs.map((f: any) => (
                  <tr key={f.id} className="border-b border-line/50 last:border-0">
                    <td className="py-2 mono text-xs">{f.vehicle?.regNo}</td>
                    <td className="py-2 text-xs text-muted">{formatDate(f.date)}</td>
                    <td className="py-2 text-muted">{f.liters} L</td>
                    <td className="py-2">{formatINR(f.cost)}</td>
                  </tr>
                ))}
                {fuelLogs.length === 0 && (<tr><td colSpan={4} className="py-6 text-center text-muted">No fuel logs.</td></tr>)}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><Receipt className="h-4 w-4 text-accent" /> Other Expenses</h2>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
                  <th className="pb-2 font-medium">Vehicle</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Note</th>
                  <th className="pb-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e: any) => (
                  <tr key={e.id} className="border-b border-line/50 last:border-0">
                    <td className="py-2 mono text-xs">{e.vehicle?.regNo ?? "-"}</td>
                    <td className="py-2 text-muted">{e.type}</td>
                    <td className="py-2 text-xs text-muted">{e.note || "-"}</td>
                    <td className="py-2">{formatINR(e.amount)}</td>
                  </tr>
                ))}
                {expenses.length === 0 && (<tr><td colSpan={4} className="py-6 text-center text-muted">No expenses.</td></tr>)}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <p className="text-xs text-accent/80">Total operational cost is computed automatically as Fuel + Maintenance + Expenses.</p>

      <Modal open={fuelOpen} onClose={() => setFuelOpen(false)} title="Log Fuel">
        <form onSubmit={(e) => { e.preventDefault(); fuelM.mutate(fuelForm); }} className="space-y-4">
          <Field label="Vehicle">
            <Select value={fuelForm.vehicleId} onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })} required>
              <option value="">Select vehicle</option>
              {vehicles.map((v: any) => (<option key={v.id} value={v.id}>{v.regNo} · {v.name}</option>))}
            </Select>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Litres"><Input type="number" value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} required /></Field>
            <Field label="Cost (auto if blank)"><Input type="number" value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} placeholder="litres x 95" /></Field>
            <Field label="Odometer"><Input type="number" value={fuelForm.odometer} onChange={(e) => setFuelForm({ ...fuelForm, odometer: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setFuelOpen(false)}>Cancel</Button><Button type="submit" disabled={fuelM.isPending}>{fuelM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log Fuel"}</Button></div>
        </form>
      </Modal>

      <Modal open={expOpen} onClose={() => setExpOpen(false)} title="Add Expense">
        <form onSubmit={(e) => { e.preventDefault(); expM.mutate(expForm); }} className="space-y-4">
          <Field label="Vehicle (optional)">
            <Select value={expForm.vehicleId} onChange={(e) => setExpForm({ ...expForm, vehicleId: e.target.value })}>
              <option value="">None</option>
              {vehicles.map((v: any) => (<option key={v.id} value={v.id}>{v.regNo} · {v.name}</option>))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select value={expForm.type} onChange={(e) => setExpForm({ ...expForm, type: e.target.value })}>
                <option value="TOLL">Toll</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OTHER">Other</option>
              </Select>
            </Field>
            <Field label="Amount"><Input type="number" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} required /></Field>
          </div>
          <Field label="Note"><Input value={expForm.note} onChange={(e) => setExpForm({ ...expForm, note: e.target.value })} /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setExpOpen(false)}>Cancel</Button><Button type="submit" disabled={expM.isPending}>{expM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Expense"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}

function CostTile({ label, value, accent, bold }: { label: string; value: number; accent: string; bold?: boolean }) {
  return (
    <div className="card relative overflow-hidden p-4">
      <div className="absolute left-0 top-0 h-full w-1" style={{ background: accent }} />
      <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-1.5 ${bold ? "text-2xl font-semibold" : "text-xl font-medium"}`}>{formatINR(value)}</div>
    </div>
  );
}
