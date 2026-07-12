"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { jsonFetch } from "@/lib/client";

const FleetShowcase = dynamic(() => import("@/components/hero/FleetShowcase"), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center text-sm text-muted">Loading 3D fleet...</div>,
});

function Count({ dot, label, n }: { dot: string; label: string; n: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
      <span className="font-medium text-ink">{n}</span>
      <span className="text-muted">{label}</span>
    </span>
  );
}

export function FleetPanel() {
  const { data } = useQuery({ queryKey: ["vehicles", "all"], queryFn: () => jsonFetch("/api/vehicles") });
  const vs = data?.vehicles ?? [];
  const c = (s: string) => vs.filter((v: any) => v.status === s).length;

  return (
    <div className="card relative overflow-hidden p-0" style={{ height: 380 }}>
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute inset-0">
        <FleetShowcase vehicles={vs} />
      </div>
      <div className="pointer-events-none absolute left-5 top-4">
        <h2 className="text-lg font-semibold">Your Fleet in 3D</h2>
        <p className="text-xs text-muted">Drag to rotate · scroll to zoom</p>
      </div>
      <div className="pointer-events-none absolute bottom-4 left-5 flex flex-wrap gap-4 text-xs">
        <Count dot="#34d399" label="Available" n={c("AVAILABLE")} />
        <Count dot="#38bdf8" label="On Trip" n={c("ON_TRIP")} />
        <Count dot="#f5a623" label="In Shop" n={c("IN_SHOP")} />
        <Count dot="#fb7185" label="Retired" n={c("RETIRED")} />
      </div>
    </div>
  );
}
