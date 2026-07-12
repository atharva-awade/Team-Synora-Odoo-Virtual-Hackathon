"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Loader2, ShieldAlert } from "lucide-react";
import { jsonFetch } from "@/lib/client";
import { Button, Input, Select, Field, Card } from "@/components/ui/primitives";
import { StatusPill } from "@/components/ui/StatusPill";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/toast";
import { DRIVER_STATUSES, DRIVER_CATEGORIES, REGIONS, statusLabel } from "@/lib/constants";
import { formatDate, daysUntil } from "@/lib/utils";

type Driver = {
  id: string;
  name: string;
  licenseNo: string;
  category: string;
  licenseExpiry: string;
  contact: string;
  safetyScore: number;
  status: string;
};

const EMPTY = { name: "", licenseNo: "", category: "HMV", licenseExpiry: "", contact: "", safetyScore: 90, status: "AVAILABLE", region: "Gandhinagar" };

export function DriverManager({ canEdit }: { canEdit: boolean }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState("ALL");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);

  const { data, isLoading } = useQuery({
    queryKey: ["drivers", status, q],
    queryFn: () => {
      const p = new URLSearchParams();
      if (status !== "ALL") p.set("status", status);
      if (q) p.set("q", q);
      return jsonFetch(`/api/drivers?${p.toString()}`);
    },
  });
  const drivers: Driver[] = data?.drivers ?? [];

  const createM = useMutation({
    mutationFn: (body: any) => jsonFetch("/api/drivers", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["drivers"] }); toast("Driver added"); setOpen(false); setForm(EMPTY); },
    onError: (e: any) => toast(e.message, "error"),
  });
  const patchM = useMutation({
    mutationFn: ({ id, body }: any) => jsonFetch(`/api/drivers/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["drivers"] }); toast("Driver updated"); },
    onError: (e: any) => toast(e.message, "error"),
  });
  const delM = useMutation({
    mutationFn: (id: string) => jsonFetch(`/api/drivers/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["drivers"] }); toast("Driver removed"); },
    onError: (e: any) => toast(e.message, "error"),
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  function expiryCell(iso: string) {
    const d = daysUntil(iso);
    if (d < 0) return <span className="text-rose-600 dark:text-rose-300">{formatDate(iso)} · expired</span>;
    if (d <= 30) return <span className="text-amber-600 dark:text-amber-300">{formatDate(iso)} · {d}d left</span>;
    return <span className="text-muted">{formatDate(iso)}</span>;
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or licence" className="pl-9" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          <option value="ALL">All statuses</option>
          {DRIVER_STATUSES.map((s) => (<option key={s} value={s}>{statusLabel(s)}</option>))}
        </Select>
        {canEdit && <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Driver</Button>}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
              <th className="pb-2 font-medium">Driver</th>
              <th className="pb-2 font-medium">Licence</th>
              <th className="pb-2 font-medium">Category</th>
              <th className="pb-2 font-medium">Expiry</th>
              <th className="pb-2 font-medium">Safety</th>
              <th className="pb-2 font-medium">Status</th>
              {canEdit && <th className="pb-2 font-medium" />}
            </tr>
          </thead>
          <tbody>
            {isLoading && (<tr><td colSpan={7} className="py-8 text-center text-muted"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>)}
            {!isLoading && drivers.length === 0 && (<tr><td colSpan={7} className="py-8 text-center text-muted">No drivers found.</td></tr>)}
            {drivers.map((d) => (
              <tr key={d.id} className="border-b border-line/50 last:border-0 hover:bg-surface-2/40">
                <td className="py-2.5 font-medium">{d.name}</td>
                <td className="py-2.5 mono text-xs text-muted">{d.licenseNo}</td>
                <td className="py-2.5 text-muted">{d.category}</td>
                <td className="py-2.5 text-xs">{expiryCell(d.licenseExpiry)}</td>
                <td className="py-2.5">
                  <span className={d.safetyScore >= 90 ? "text-emerald-600 dark:text-emerald-300" : d.safetyScore >= 80 ? "text-amber-600 dark:text-amber-300" : "text-rose-600 dark:text-rose-300"}>{d.safetyScore}%</span>
                </td>
                <td className="py-2.5">
                  {canEdit ? (
                    <Select value={d.status} onChange={(e) => patchM.mutate({ id: d.id, body: { status: e.target.value } })} className="h-7 w-32 text-xs" disabled={d.status === "ON_TRIP"}>
                      {DRIVER_STATUSES.map((s) => (<option key={s} value={s}>{statusLabel(s)}</option>))}
                    </Select>
                  ) : (<StatusPill status={d.status} />)}
                </td>
                {canEdit && (
                  <td className="py-2.5 text-right">
                    <button onClick={() => delM.mutate(d.id)} title="Delete driver" className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-accent/80">
        <ShieldAlert className="h-3.5 w-3.5" />
        Rule: drivers with an expired licence or Suspended status are blocked from trip assignment.
      </p>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Driver">
        <form onSubmit={(e) => { e.preventDefault(); createM.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} required /></Field>
            <Field label="Licence No"><Input value={form.licenseNo} onChange={(e) => set("licenseNo", e.target.value)} placeholder="DL-GJ-00000" required /></Field>
            <Field label="Category">
              <Select value={form.category} onChange={(e) => set("category", e.target.value)}>
                {DRIVER_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </Select>
            </Field>
            <Field label="Licence Expiry"><Input type="date" value={form.licenseExpiry} onChange={(e) => set("licenseExpiry", e.target.value)} required /></Field>
            <Field label="Contact"><Input value={form.contact} onChange={(e) => set("contact", e.target.value)} placeholder="98765 43210" /></Field>
            <Field label="Safety Score"><Input type="number" min={0} max={100} value={form.safetyScore} onChange={(e) => set("safetyScore", e.target.value)} /></Field>
            <Field label="Region">
              <Select value={form.region} onChange={(e) => set("region", e.target.value)}>
                {REGIONS.map((r) => (<option key={r} value={r}>{r}</option>))}
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createM.isPending}>{createM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Driver"}</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
