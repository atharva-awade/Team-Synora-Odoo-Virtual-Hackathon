"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Odometer style count-up used across the dashboard KPI cards.
export function CountUp({
  value,
  duration = 900,
  decimals = 0,
  suffix = "",
  prefix = "",
}: {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
}) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    const end = value;
    if (start === end) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(start + (end - start) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = end;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span className="tabular-nums">
      {prefix}
      {display.toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  accent = "var(--accent)",
  suffix = "",
  decimals = 0,
  sub,
  icon,
}: {
  label: string;
  value: number;
  accent?: string;
  suffix?: string;
  decimals?: number;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="card group relative overflow-hidden p-4 transition-colors hover:border-white/15">
      <div className="absolute left-0 top-0 h-full w-1" style={{ background: accent }} />
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
        {icon && <div className="text-muted">{icon}</div>}
      </div>
      <div className={cn("mt-2 text-3xl font-semibold text-ink")}>
        <CountUp value={value} suffix={suffix} decimals={decimals} />
      </div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}
