"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, ContactShadows } from "@react-three/drei";
import { useMemo, useState } from "react";
import * as THREE from "three";

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE: "#34d399",
  ON_TRIP: "#38bdf8",
  IN_SHOP: "#f5a623",
  RETIRED: "#fb7185",
};

type V = { id: string; regNo: string; type: string; status: string };

function VehicleInstance({ scene, position, color }: { scene: THREE.Object3D; position: [number, number, number]; color: string }) {
  const [hover, setHover] = useState(false);
  const clone = useMemo(() => {
    const c = scene.clone(true);
    const box = new THREE.Box3().setFromObject(c);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = 2 / maxDim;
    c.scale.setScalar(s);
    c.position.set(-center.x * s, -box.min.y * s, -center.z * s);
    c.traverse((o: any) => {
      if (o.isMesh) o.castShadow = true;
    });
    return c;
  }, [scene]);

  return (
    <group
      position={position}
      scale={hover ? 1.08 : 1}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
      onPointerOut={() => setHover(false)}
    >
      <primitive object={clone} />
      {/* status-colored glow disc + light */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.3, 48]} />
        <meshBasicMaterial color={color} transparent opacity={hover ? 0.55 : 0.32} />
      </mesh>
      <pointLight position={[0, 0.5, 0]} color={color} intensity={hover ? 8 : 4.5} distance={3.4} />
    </group>
  );
}

function Yard({ vehicles }: { vehicles: V[] }) {
  const truck = useGLTF("/models/truck.glb").scene;
  const pickup = useGLTF("/models/pickup.glb").scene;
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
        const base = v.type === "Pickup" ? pickup : truck;
        return <VehicleInstance key={v.id} scene={base} position={[x, 0, z]} color={STATUS_COLOR[v.status] || "#8b8b95"} />;
      })}
    </>
  );
}

export default function FleetShowcase({ vehicles }: { vehicles: V[] }) {
  return (
    <Canvas shadows dpr={[1, 1.8]} camera={{ position: [7, 5.5, 8], fov: 42 }} gl={{ alpha: true, antialias: true }} style={{ background: "transparent" }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[8, 12, 6]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-6, 5, -6]} intensity={0.4} color="#e8793a" />
      {vehicles.length > 0 && <Yard vehicles={vehicles} />}
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
  );
}

useGLTF.preload("/models/truck.glb");
useGLTF.preload("/models/pickup.glb");
