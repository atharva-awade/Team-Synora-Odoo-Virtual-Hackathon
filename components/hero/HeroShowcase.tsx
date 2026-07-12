"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Rocket, MapPin, Wrench, Fuel, BarChart3, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted">Loading 3D fleet...</div>
  ),
});

const MODALITIES = [
  { key: "dispatch", label: "Dispatch", icon: Rocket, title: "Smart Dispatch", desc: "Assign the optimal vehicle and driver with explainable scoring." },
  { key: "tracking", label: "Tracking", icon: MapPin, title: "Live Fleet Tracking", desc: "Watch every dispatched trip progress on a live map." },
  { key: "maintenance", label: "Maintenance", icon: Wrench, title: "Predictive Maintenance", desc: "Forecast service intervals and keep the fleet road ready." },
  { key: "fuel", label: "Fuel", icon: Fuel, title: "Fuel & Operational Cost", desc: "Track consumption and total cost per vehicle automatically." },
  { key: "analytics", label: "Analytics", icon: BarChart3, title: "ROI Analytics", desc: "Utilization, efficiency and profitability at a glance." },
  { key: "compliance", label: "Compliance", icon: ShieldCheck, title: "Compliance Radar", desc: "Licence validity and safety scores, always current." },
];

export function HeroShowcase() {
  const [station, setStation] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      if (!paused.current) setStation((s) => (s + 1) % MODALITIES.length);
    }, 4200);
    return () => clearInterval(t);
  }, []);

  const active = MODALITIES[station];

  return (
    <div
      className="relative aspect-square w-full overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-surface to-surface-2"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
      <div className="absolute inset-0">
        <HeroCanvas station={station} />
      </div>

      {/* HUD card */}
      <div className="absolute left-4 top-4 max-w-[220px] rounded-2xl border border-line bg-surface/80 p-3.5 backdrop-blur-md animate-fade-in" key={active.key}>
        <div className="flex items-center gap-2 text-accent">
          <active.icon className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">{active.title}</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">{active.desc}</p>
      </div>

      {/* Modality tabs */}
      <div className="absolute inset-x-3 bottom-3 flex flex-wrap justify-center gap-1.5">
        {MODALITIES.map((m, i) => (
          <button
            key={m.key}
            onClick={() => setStation(i)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-all",
              i === station
                ? "border-accent/50 bg-accent/15 text-accent"
                : "border-line bg-surface/70 text-muted hover:text-ink",
            )}
          >
            <m.icon className="h-3 w-3" />
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
