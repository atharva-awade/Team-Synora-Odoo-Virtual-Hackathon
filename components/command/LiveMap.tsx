"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import DeckGL from "@deck.gl/react";
import { MapView, LightingEffect, AmbientLight, DirectionalLight } from "@deck.gl/core";
import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer, PathLayer, ScatterplotLayer } from "@deck.gl/layers";
import { ScenegraphLayer } from "@deck.gl/mesh-layers";
import { GLTFLoader } from "@loaders.gl/gltf";
import { Play, Pause, X, Truck as TruckIcon, Maximize2, Minimize2 } from "lucide-react";
import { jsonFetch } from "@/lib/client";
import { formatINR } from "@/lib/utils";

const INITIAL_VIEW = { longitude: 72.7, latitude: 22.6, zoom: 6.6, pitch: 45, bearing: 0 };
// Model forward-facing yaw offset (tune if headlights point the wrong way).
const ORIENT_YAW = 90;

// Bright lighting so the 3D trucks read light/near-original instead of dark.
const lightingEffect = new LightingEffect({
  ambient: new AmbientLight({ color: [255, 255, 255], intensity: 3.2 }),
  dir1: new DirectionalLight({ color: [255, 255, 255], intensity: 1.4, direction: [-1, -3, -1] }),
  dir2: new DirectionalLight({ color: [255, 255, 255], intensity: 0.8, direction: [2, -1, 1] }),
});

function bearing(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const dLng = (b.lng - a.lng) * rad;
  const y = Math.sin(dLng) * Math.cos(b.lat * rad);
  const x = Math.cos(a.lat * rad) * Math.sin(b.lat * rad) - Math.sin(a.lat * rad) * Math.cos(b.lat * rad) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

// Interpolate a position + heading along a polyline at fraction t (0..1).
function alongPath(path: number[][], t: number): { position: number[]; heading: number } {
  if (!path || path.length < 2) return { position: path?.[0] ?? [0, 0], heading: 0 };
  const seg: number[] = [];
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const L = Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]);
    seg.push(L);
    total += L;
  }
  let d = t * total;
  let i = 0;
  while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
  const f = seg[i] ? d / seg[i] : 0;
  const a = path[i];
  const b = path[i + 1];
  return {
    position: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f],
    heading: bearing({ lat: a[1], lng: a[0] }, { lat: b[1], lng: b[0] }),
  };
}

export function LiveMap() {
  const [selected, setSelected] = useState<any>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [time, setTime] = useState(0);
  const [dark, setDark] = useState(() => typeof document !== "undefined" && document.documentElement.classList.contains("dark"));
  const [routes, setRoutes] = useState<Record<string, number[][]>>({});
  const [fullscreen, setFullscreen] = useState(false);
  const speedRef = useRef(1);
  const clockRef = useRef(0);

  const { data } = useQuery({ queryKey: ["trips"], queryFn: () => jsonFetch("/api/trips"), refetchInterval: 8000, placeholderData: keepPreviousData });
  useEffect(() => { speedRef.current = playing ? speed : 0; }, [playing, speed]);
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  // theme detection
  useEffect(() => {
    const el = document.documentElement;
    const update = () => setDark(el.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // animation clock
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastSet = 0;
    const loop = () => {
      const now = performance.now();
      clockRef.current += ((now - last) / 1000) * speedRef.current;
      last = now;
      if (now - lastSet > 40) { setTime(clockRef.current); lastSet = now; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const trips = useMemo(
    () => (data?.trips ?? []).filter((t: any) => t.status === "DISPATCHED" && t.srcLat != null && t.destLat != null),
    [data],
  );
  const tripKey = trips.map((t: any) => t.id).join(",");

  // fetch road-following routes from OSRM (cached per trip)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, number[][]> = { ...routes };
      let changed = false;
      for (const tr of trips) {
        if (next[tr.id]) continue;
        const straight = [[tr.srcLng, tr.srcLat], [tr.destLng, tr.destLat]];
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${tr.srcLng},${tr.srcLat};${tr.destLng},${tr.destLat}?overview=full&geometries=geojson`;
          const r = await fetch(url);
          const j = await r.json();
          const coords = j?.routes?.[0]?.geometry?.coordinates;
          next[tr.id] = coords && coords.length > 1 ? coords : straight;
        } catch {
          next[tr.id] = straight;
        }
        changed = true;
      }
      if (!cancelled && changed) setRoutes(next);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripKey]);

  const pathFor = (tr: any) => (routes[tr.id] && routes[tr.id].length > 1 ? routes[tr.id] : [[tr.srcLng, tr.srcLat], [tr.destLng, tr.destLat]]);

  // The moving trucks are the only thing recomputed every animation tick.
  const vehicles = useMemo(
    () => trips.map((tr: any, i: number) => {
      const p = ((time / 26) + i * 0.17) % 1;
      const { position, heading } = alongPath(pathFor(tr), p);
      return { position, heading, isPickup: tr.vehicle?.type === "Pickup", trip: tr };
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trips, routes, time],
  );

  const activeCount = useMemo(() => (data?.trips ?? []).filter((t: any) => t.status === "DISPATCHED").length, [data]);

  const tileUrl = dark
    ? "https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png"
    : "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";

  // Basemap, routes and pins only rebuild when their data or the theme changes,
  // so the 25fps truck animation does not thrash the whole layer stack.
  const staticLayers = useMemo(() => {
    const routePaths = trips.map((tr: any) => ({ path: pathFor(tr), trip: tr, sel: selected?.id === tr.id }));
    const pins = trips.flatMap((tr: any) => [{ position: [tr.srcLng, tr.srcLat], kind: "src" }, { position: [tr.destLng, tr.destLat], kind: "dst" }]);
    return [
      new TileLayer({
        id: `basemap-${dark ? "d" : "l"}`,
        data: tileUrl,
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
        id: "routes", data: routePaths, getPath: (d: any) => d.path,
        getColor: (d: any) => (d.sel ? [245, 166, 35, 255] : [232, 121, 58, 170]),
        getWidth: (d: any) => (d.sel ? 5 : 3), widthUnits: "pixels", capRounded: true, jointRounded: true, pickable: true,
        updateTriggers: { getColor: [selected?.id] },
      }),
      new ScatterplotLayer({
        id: "pins", data: pins, getPosition: (d: any) => d.position,
        getFillColor: (d: any) => (d.kind === "src" ? [52, 211, 153, 255] : [245, 166, 35, 255]),
        getRadius: 6, radiusUnits: "pixels", stroked: true, getLineColor: [255, 255, 255, 150], lineWidthUnits: "pixels", getLineWidth: 1.5,
      }),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips, routes, dark, selected?.id]);

  const truckLayers = [
    new ScenegraphLayer({
      id: "trucks", data: vehicles.filter((v: any) => !v.isPickup), scenegraph: "/models/truck.glb",
      getPosition: (d: any) => d.position, getOrientation: (d: any) => [0, -d.heading + ORIENT_YAW, 90],
      sizeScale: 1.5, sizeUnits: "meters", sizeMinPixels: 6, sizeMaxPixels: 34, _lighting: "pbr", loaders: [GLTFLoader], pickable: true,
    }),
    new ScenegraphLayer({
      id: "pickups", data: vehicles.filter((v: any) => v.isPickup), scenegraph: "/models/pickup.glb",
      getPosition: (d: any) => d.position, getOrientation: (d: any) => [0, -d.heading + ORIENT_YAW, 90],
      sizeScale: 1.5, sizeUnits: "meters", sizeMinPixels: 6, sizeMaxPixels: 34, _lighting: "pbr", loaders: [GLTFLoader], pickable: true,
    }),
  ];

  const layers = [...staticLayers, ...truckLayers];

  return (
    <div
      className={`${fullscreen ? "fixed inset-0 z-[70]" : "relative h-full w-full rounded-2xl"} overflow-hidden`}
      style={{ background: dark ? "#070810" : "#dfe3ea" }}
    >
      <DeckGL
        views={new MapView({ repeat: true })}
        initialViewState={INITIAL_VIEW}
        controller={true}
        effects={[lightingEffect]}
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

      <button
        onClick={() => setFullscreen((f) => !f)}
        title={fullscreen ? "Exit fullscreen (Esc)" : "Open fullscreen"}
        className="absolute bottom-4 right-4 z-20 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur transition-colors hover:bg-black/70 hover:text-white"
      >
        {fullscreen ? <><Minimize2 className="h-3.5 w-3.5" /> Exit</> : <><Maximize2 className="h-3.5 w-3.5" /> Fullscreen</>}
      </button>

      {selected && (
        <div className="absolute bottom-16 right-4 z-10 w-72 rounded-2xl border border-white/10 bg-black/70 p-4 text-white backdrop-blur-md animate-fade-in">
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
