"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ScenegraphLayer } from "@deck.gl/mesh-layers";
import { PathLayer, ScatterplotLayer } from "@deck.gl/layers";
import { GLTFLoader } from "@loaders.gl/gltf";
import { Play, Pause, X, Truck as TruckIcon } from "lucide-react";
import { jsonFetch } from "@/lib/client";
import { formatINR } from "@/lib/utils";

const CARTO_DARK = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

function bearing(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const dLng = (b.lng - a.lng) * rad;
  const y = Math.sin(dLng) * Math.cos(b.lat * rad);
  const x = Math.cos(a.lat * rad) * Math.sin(b.lat * rad) - Math.sin(a.lat * rad) * Math.cos(b.lat * rad) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

export function LiveMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const overlayRef = useRef<any>(null);
  const tripsRef = useRef<any[]>([]);
  const speedRef = useRef(1);
  const clockRef = useRef(0);
  const selRef = useRef<any>(null);

  const [selected, setSelected] = useState<any>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);

  const { data } = useQuery({ queryKey: ["trips"], queryFn: () => jsonFetch("/api/trips"), refetchInterval: 8000 });

  useEffect(() => { speedRef.current = playing ? speed : 0; }, [playing, speed]);
  useEffect(() => {
    tripsRef.current = (data?.trips ?? []).filter((t: any) => t.status === "DISPATCHED" && t.srcLat != null && t.destLat != null);
  }, [data]);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: CARTO_DARK,
      center: [72.6, 22.6],
      zoom: 6.6,
      pitch: 45,
      attributionControl: false,
    });
    mapRef.current = map;
    const overlay = new MapboxOverlay({ interleaved: false, layers: [] });
    map.addControl(overlay as any);
    overlayRef.current = overlay;

    const select = (info: any) => {
      if (info?.object?.trip) { selRef.current = info.object.trip; setSelected(info.object.trip); }
    };

    let raf = 0;
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      clockRef.current += dt * speedRef.current;
      const t = clockRef.current;
      const trips = tripsRef.current;

      const vehicles = trips.map((tr: any, i: number) => {
        const p = ((t / 26) + i * 0.17) % 1;
        const lng = tr.srcLng + (tr.destLng - tr.srcLng) * p;
        const lat = tr.srcLat + (tr.destLat - tr.srcLat) * p;
        const heading = bearing({ lat: tr.srcLat, lng: tr.srcLng }, { lat: tr.destLat, lng: tr.destLng });
        return { position: [lng, lat], heading, trip: tr, isPickup: tr.vehicle?.type === "Pickup", progress: p };
      });
      const routes = trips.map((tr: any) => ({ path: [[tr.srcLng, tr.srcLat], [tr.destLng, tr.destLat]], trip: tr, sel: selRef.current?.id === tr.id }));
      const pins: any[] = [];
      trips.forEach((tr: any) => { pins.push({ position: [tr.srcLng, tr.srcLat], kind: "src" }); pins.push({ position: [tr.destLng, tr.destLat], kind: "dst" }); });

      overlay.setProps({
        layers: [
          new PathLayer({
            id: "routes", data: routes, getPath: (d: any) => d.path,
            getColor: (d: any) => (d.sel ? [245, 166, 35, 255] : [232, 121, 58, 150]),
            getWidth: (d: any) => (d.sel ? 5 : 3), widthUnits: "pixels", pickable: true, onClick: select,
          }),
          new ScatterplotLayer({
            id: "pins", data: pins, getPosition: (d: any) => d.position,
            getFillColor: (d: any) => (d.kind === "src" ? [52, 211, 153, 255] : [245, 166, 35, 255]),
            getRadius: 7, radiusUnits: "pixels", stroked: true, getLineColor: [255, 255, 255, 130], lineWidthUnits: "pixels", getLineWidth: 1.5,
          }),
          new ScenegraphLayer({
            id: "trucks", data: vehicles.filter((v) => !v.isPickup), scenegraph: "/models/truck.glb",
            getPosition: (d: any) => d.position, getOrientation: (d: any) => [0, -d.heading, 90],
            sizeScale: 30, sizeMinPixels: 26, sizeMaxPixels: 90, _lighting: "pbr", loaders: [GLTFLoader], pickable: true, onClick: select,
          }),
          new ScenegraphLayer({
            id: "pickups", data: vehicles.filter((v) => v.isPickup), scenegraph: "/models/pickup.glb",
            getPosition: (d: any) => d.position, getOrientation: (d: any) => [0, -d.heading, 90],
            sizeScale: 30, sizeMinPixels: 26, sizeMaxPixels: 90, _lighting: "pbr", loaders: [GLTFLoader], pickable: true, onClick: select,
          }),
        ],
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); map.remove(); };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#0a0b10]">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Controls */}
      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3 py-2 backdrop-blur">
        <TruckIcon className="h-4 w-4 text-accent" />
        <span className="text-sm font-semibold text-white">Live Vehicle Map</span>
        <button onClick={() => setPlaying((p) => !p)} className="ml-2 rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white">
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
        <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-20 accent-[#e8793a]" />
        <span className="text-[11px] text-white/60">{speed}x</span>
      </div>
      <div className="absolute right-4 top-4 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-right backdrop-blur">
        <div className="text-2xl font-semibold text-white">{data?.trips?.filter((t: any) => t.status === "DISPATCHED").length ?? 0}</div>
        <div className="text-[11px] text-white/60">vehicles moving</div>
      </div>
      <div className="absolute bottom-4 left-4 flex gap-3 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-[11px] text-white/70 backdrop-blur">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Departure</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Destination</span>
        <span className="text-white/50">click a vehicle or route</span>
      </div>

      {selected && (
        <div className="absolute bottom-4 right-4 w-72 rounded-2xl border border-white/10 bg-black/70 p-4 text-white backdrop-blur-md animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="mono text-sm font-semibold text-accent">{selected.code}</div>
            <button onClick={() => { selRef.current = null; setSelected(null); }} className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-2 text-sm">{selected.source} to {selected.destination}</div>
          <div className="mt-3 space-y-1.5 text-xs text-white/70">
            <Row k="Vehicle" v={`${selected.vehicle?.regNo ?? "-"} · ${selected.vehicle?.name ?? ""}`} />
            <Row k="Type" v={selected.vehicle?.type ?? "-"} />
            <Row k="Driver" v={selected.driver?.name ?? "-"} />
            <Row k="Cargo" v={`${selected.cargoWeightKg} kg`} />
            <Row k="Distance" v={`${selected.plannedDistanceKm} km`} />
            <Row k="Revenue" v={formatINR(selected.revenue)} />
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-white/50">{k}</span>
      <span className="text-right text-white/90">{v}</span>
    </div>
  );
}
