"use client";

import { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, ContactShadows, Clone } from "@react-three/drei";
import * as THREE from "three";
import { WebGLBoundary } from "./WebGLBoundary";

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE: "#34d399",
  ON_TRIP: "#875A7B",
  IN_SHOP: "#f5a623",
  RETIRED: "#fb7185",
};

type V = { id: string; regNo: string; type: string; status: string };

function useMetrics(scene: THREE.Object3D) {
  return useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2 / maxDim;
    return { scale, cx: center.x, cz: center.z, minY: box.min.y };
  }, [scene]);
}

function Tile({ base, metrics, position, color }: { base: THREE.Object3D; metrics: any; position: [number, number, number]; color: string }) {
  const [hover, setHover] = useState(false);
  const m = metrics;
  return (
    <group position={position} scale={hover ? 1.08 : 1} onPointerOver={(e) => { e.stopPropagation(); setHover(true); }} onPointerOut={() => setHover(false)}>
      <Clone
        object={base}
        castShadow
        receiveShadow
        scale={m.scale}
        position={[-m.cx * m.scale, -m.minY * m.scale, -m.cz * m.scale]}
      />
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.25, 48]} />
        <meshBasicMaterial color={color} transparent opacity={hover ? 0.55 : 0.34} />
      </mesh>
      <pointLight position={[0, 0.55, 0]} color={color} intensity={hover ? 8 : 4.5} distance={3.4} />
    </group>
  );
}

function Yard({ vehicles }: { vehicles: V[] }) {
  const truck = useGLTF("/models/truck.glb").scene;
  const pickup = useGLTF("/models/pickup.glb").scene;
  const truckM = useMetrics(truck);
  const pickupM = useMetrics(pickup);

  const cols = Math.max(1, Math.ceil(Math.sqrt(vehicles.length)));
  const rows = Math.ceil(vehicles.length / cols);
  const spacing = 3.2;

  return (
    <>
      {vehicles.map((v, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = (col - (cols - 1) / 2) * spacing;
        const z = (row - (rows - 1) / 2) * spacing;
        const isPickup = v.type === "Pickup";
        return (
          <Tile
            key={v.id}
            base={isPickup ? pickup : truck}
            metrics={isPickup ? pickupM : truckM}
            position={[x, 0, z]}
            color={STATUS_COLOR[v.status] || "#8b8b95"}
          />
        );
      })}
    </>
  );
}

// Clean 2D grid shown when a WebGL context is unavailable (context limit hit,
// GPU blocked). Keeps the fleet readable instead of crashing the page.
function Fallback2D({ vehicles }: { vehicles: V[] }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="grid max-h-full w-full max-w-2xl grid-cols-2 gap-2.5 overflow-auto sm:grid-cols-3">
        {vehicles.map((v) => (
          <div key={v.id} className="glass flex items-center gap-2.5 rounded-xl px-3 py-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: STATUS_COLOR[v.status] || "#8b8b95" }} />
            <div className="min-w-0">
              <div className="mono truncate text-xs font-medium">{v.regNo}</div>
              <div className="truncate text-[11px] text-muted">{v.type}</div>
            </div>
          </div>
        ))}
        {vehicles.length === 0 && <div className="col-span-full py-8 text-center text-sm text-muted">No vehicles to display.</div>}
      </div>
    </div>
  );
}

export default function FleetShowcase({ vehicles }: { vehicles: V[] }) {
  return (
    <WebGLBoundary fallback={<Fallback2D vehicles={vehicles} />}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [7, 5.5, 8], fov: 42 }}
        gl={{ alpha: true, antialias: true, powerPreference: "default", failIfMajorPerformanceCaveat: false }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[8, 13, 7]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-6, 5, -6]} intensity={0.4} color="#875A7B" />
        <Suspense fallback={null}>
          {vehicles.length > 0 && <Yard vehicles={vehicles} />}
        </Suspense>
        <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={30} blur={2.4} far={12} />
        <OrbitControls
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          enableZoom
          minDistance={4}
          maxDistance={20}
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 0.4, 0]}
        />
      </Canvas>
    </WebGLBoundary>
  );
}

useGLTF.preload("/models/truck.glb");
useGLTF.preload("/models/pickup.glb");
