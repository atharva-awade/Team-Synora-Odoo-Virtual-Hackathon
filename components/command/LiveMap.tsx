"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DeckGL from "@deck.gl/react";
import { MapView } from "@deck.gl/core";
import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer, PathLayer, ScatterplotLayer } from "@deck.gl/layers";
import { ScenegraphLayer } from "@deck.gl/mesh-layers";
import { GLTFLoader } from "@loaders.gl/gltf";
import { Play, Pause, X, Truck as TruckIcon } from "lucide-react";
import { jsonFetch } from "@/lib/client";
import { formatINR } from "@/lib/utils";

const INITIAL_VIEW = { longitude: 72.7, latitude: 22.6, zoom: 6.6, pitch: 45, bearing: 0 };

function bearing(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const dLng = (b.lng - a.lng) * rad;
  const y = Math.sin(dLng) * Math.cos(b.lat * rad);
  const x = Math.cos(a.lat * rad) * Math.sin(b.lat * rad) - Math.sin(a.lat * rad) * Math.cos(b.lat * rad) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

export function LiveMap() {
  const [selected, setSelected] = useState<any>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [time, setTime] = useState(0);
  const speedRef = useRef(1);
  const clockRef = useRef(0);

  const { data } = useQuery({ queryKey: ["trips"], queryFn: () => jsonFetch("/api/trips"), refetchInterval: 8000 });
  useEffect(() => { speedRef.current = playing ? speed : 0; }, [playing, speed]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastSet = 0;
    const loop = () => {
      const now = performance.now();
      clockRef.current += ((now - last) / 1000) * speedRef.current;
      last = now;
      if (now - lastSet > 33) { setTime(clockRef.current); lastSet = now; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const trips = useMemo(
    () => (data?.trips ?? []).filter((t: any) => t.status === "DISPATCHED" && t.srcLat != null && t.destLat != null),
    [data],
  );
  const activeCount = (data?.trips ?? []).filter((t: any) => t.status === "DISPATCHED").length;

  const vehicles = trips.map((tr: any, i: number) => {
    const p = ((time / 26) + i * 0.17) % 1;
    return {
      position: [tr.srcLng + (tr.destLng - tr.srcLng) * p, tr.srcLat + (tr.destLat - tr.srcLat) * p],
      heading: bearing({ lat: tr.srcLat, lng: tr.srcLng }, { lat: tr.destLat, lng: tr.destLng }),
      isPickup: tr.vehicle?.type === "Pickup",
      trip: tr,
    };
  });
  const routes = trips.map((tr: any) => ({ path: [[tr.srcLng, tr.srcLat], [tr.destLng, tr.destLat]], trip: tr, sel: selected?.id === tr.id }));
  const pins = trips.flatMap((tr: any) => [{ position: [tr.srcLng, tr.srcLat], kind: "src" }, { position: [tr.destLng, tr.destLat], kind: "dst" }]);

  const layers = [
    new TileLayer({
      id: "basemap",
      data: "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      minZoom: 0,
      maxZoom: 19,
      tileSize: 256,
      renderSubLayers: (props: any) => {
        const { boundingBox } = props.tile;
        return new BitmapLayer(props, {
          data: undefined,
          image: props.data,
          bounds: [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]],
        });
      },
    }),
    new PathLayer({
      id: "routes", data: routes, getPath: (d: any) => d.path,
      getColor: (d: any) => (d.sel ? [245, 166, 35, 255] : [232, 121, 58, 150]),
      getWidth: (d: any) => (d.sel ? 5 : 3), widthUnits: "pixels", pickable: true,
      updateTriggers: { getColor: [selected?.id] },
    }),
    new ScatterplotLayer({
      id: "pins", data: pins, getPosition: (d: any) => d.position,
      getFillColor: (d: any) => (d.kind === "src" ? [52, 211, 153, 255] : [245, 166, 35, 255]),
      getRadius: 7, radiusUnits: "pixels", stroked: true, getLineColor: [255, 255, 255, 140], lineWidthUnits: "pixels", getLineWidth: 1.5,
    }),
    new ScenegraphLayer({
      id: "trucks", data: vehicles.filter((v: any) => !v.isPickup), scenegraph: "/models/truck.glb",
      getPosition: (d: any) => d.position, getOrientation: (d: any) => [0, -d.heading, 90],
      sizeScale: 100, sizeMinPixels: 34, sizeMaxPixels: 90, _lighting: "pbr", loaders: [GLTFLoader], pickable: true,
    }),
    new ScenegraphLayer({
      id: "pickups", data: vehicles.filter((v: any) => v.isPickup), scenegraph: "/models/pickup.glb",
      getPosition: (d: any) => d.position, getOrientation: (d: any) => [0, -d.heading, 90],
      sizeScale: 100, sizeMinPixels: 34, sizeMaxPixels: 90, _lighting: "pbr", loaders: [GLTFLoader], pickable: true,
    }),
  ];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#070810]">
      <DeckGL
        views={new MapView({ repeat: true })}
        initialViewState={INITIAL_VIEW}
        controller={true}
        layers={layers}
        onClick={(info: any) => { if (info?.object?.trip) setSelected(info.object.trip); }}
        getCursor={({ isHovering }: any) => (isHovering ? "pointer" : "grab")}
      />

      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3 py-2 backdrop-blur">
        <TruckIcon className="h-4 w-4 text-accent" />
        <span className="text-sm font-semibold text-white">Live Vehicle Map</span>
        <button onClick={() => setPlaying((p) => !p)} className="ml-2 rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white">
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
        <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-20 accent-[#e8793a]" />
        <span className="text-[11px] text-white/60">{speed}x</span>
      </div>
      <div className="absolute right-4 top-4 z-10 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-right backdrop-blur">
        <div className="text-2xl font-semibold text-white">{activeCount}</div>
        <div className="text-[11px] text-white/60">vehicles moving</div>
      </div>
      <div className="absolute bottom-4 left-4 z-10 flex gap-3 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-[11px] text-white/70 backdrop-blur">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Departure</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Destination</span>
        <span className="text-white/50">click a vehicle or route</span>
      </div>

      {selected && (
        <div className="absolute bottom-4 right-4 z-10 w-72 rounded-2xl border border-white/10 bg-black/70 p-4 text-white backdrop-blur-md animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="mono text-sm font-semibold text-accent">{selected.code}</div>
            <button onClick={() => setSelected(null)} className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
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
