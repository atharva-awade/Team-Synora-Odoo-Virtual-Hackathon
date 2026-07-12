"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { jsonFetch } from "@/lib/client";
import { CITIES } from "@/lib/constants";

// react-globe.gl ships as a default export that uses WebGL, so we load it
// lazily on the client and forward the ref through to the underlying Globe.
function GlobeBase(props: any, ref: React.ForwardedRef<any>) {
  const [Loaded, setLoaded] = useState<any>(null);
  useEffect(() => {
    let cancelled = false;
    import("react-globe.gl").then((m) => {
      if (!cancelled) setLoaded(() => m.default);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  if (!Loaded) return <div className="flex h-full w-full items-center justify-center text-sm text-white/50">Loading globe...</div>;
  return <Loaded {...props} ref={ref} />;
}
const Globe = forwardRef<any, any>(GlobeBase);
Globe.displayName = "Globe";

export function FleetGlobe() {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dim, setDim] = useState({ width: 800, height: 520 });
  const [material, setMaterial] = useState<any>(null);

  const { data } = useQuery({ queryKey: ["trips"], queryFn: () => jsonFetch("/api/trips"), refetchInterval: 5000 });
  const trips = data?.trips ?? [];

  const arcs = trips
    .filter((t: any) => t.srcLat != null && t.destLat != null && (t.status === "DISPATCHED" || t.status === "COMPLETED"))
    .map((t: any) => ({
      startLat: t.srcLat, startLng: t.srcLng, endLat: t.destLat, endLng: t.destLng,
      status: t.status,
      color: t.status === "DISPATCHED" ? ["#f5a623", "#e8793a"] : ["#4f8fff", "#4f8fff"],
      label: `${t.code} · ${t.source} to ${t.destination} · ${t.status}`,
    }));

  const used = new Set<string>();
  trips.forEach((t: any) => { used.add(t.source); used.add(t.destination); });
  const points = [...used].filter((n) => CITIES[n]).map((n) => ({ lat: CITIES[n].lat, lng: CITIES[n].lng, name: n }));

  const activeCities = new Set<string>();
  trips.filter((t: any) => t.status === "DISPATCHED").forEach((t: any) => { activeCities.add(t.source); activeCities.add(t.destination); });
  const rings = [...activeCities].filter((n) => CITIES[n]).map((n) => ({ lat: CITIES[n].lat, lng: CITIES[n].lng }));

  useEffect(() => {
    import("three").then((THREE) => {
      setMaterial(new THREE.MeshPhongMaterial({ color: "#10131c", emissive: "#080a12", shininess: 6 }));
    });
  }, []);

  useEffect(() => {
    const handle = () => {
      const el = containerRef.current;
      if (el) setDim({ width: el.clientWidth, height: el.clientHeight });
    };
    handle();
    const raf = requestAnimationFrame(handle);
    window.addEventListener("resize", handle);
    return () => { window.removeEventListener("resize", handle); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    let raf = 0;
    const start = Date.now();
    const tick = () => {
      const g = globeRef.current;
      if (g && g.pointOfView) {
        g.pointOfView({ lat: 22.6, lng: 73, altitude: 1.9 }, 1400);
        const c = g.controls?.();
        if (c) { c.autoRotate = true; c.autoRotateSpeed = 0.35; c.enableZoom = true; }
        return;
      }
      if (Date.now() - start < 5000) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [material]);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden rounded-2xl bg-[#070810]">
      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-xl border border-white/10 bg-black/40 px-3 py-2 backdrop-blur">
        <div className="text-xs font-semibold text-white">Live Command Globe</div>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-white/60">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" /> Active</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue" /> Completed</span>
        </div>
      </div>
      <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-right backdrop-blur">
        <div className="text-2xl font-semibold text-white">{trips.filter((t: any) => t.status === "DISPATCHED").length}</div>
        <div className="text-[11px] text-white/60">active trips</div>
      </div>
      <Globe
        ref={globeRef}
        width={dim.width}
        height={dim.height}
        backgroundColor="rgba(0,0,0,0)"
        {...(material ? { globeMaterial: material } : {})}
        showAtmosphere
        atmosphereColor="#e8793a"
        atmosphereAltitude={0.2}
        arcsData={arcs}
        arcColor={(d: any) => d.color}
        arcStroke={0.6}
        arcDashLength={0.5}
        arcDashGap={0.25}
        arcDashAnimateTime={(d: any) => (d.status === "DISPATCHED" ? 2200 : 0)}
        arcLabel={(d: any) => d.label}
        arcAltitudeAutoScale={0.4}
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor={() => "#f5a623"}
        pointAltitude={0.012}
        pointRadius={0.26}
        pointLabel={(d: any) => d.name}
        ringsData={rings}
        ringColor={() => (t: number) => `rgba(232,121,58,${1 - t})`}
        ringMaxRadius={3}
        ringPropagationSpeed={2}
        ringRepeatPeriod={1300}
      />
    </div>
  );
}
