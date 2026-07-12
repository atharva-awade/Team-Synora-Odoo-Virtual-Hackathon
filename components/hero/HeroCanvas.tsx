"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, ContactShadows } from "@react-three/drei";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";

// Camera stations, one per modality. The rig lerps the camera toward the
// active station so switching modality glides the camera around the truck.
const STATIONS: { pos: [number, number, number]; target: [number, number, number] }[] = [
  { pos: [4.5, 2.2, 5.5], target: [0, 0.8, 0] }, // dispatch (front 3/4)
  { pos: [7, 1.8, 0.5], target: [0, 0.8, 0] }, // live tracking (side)
  { pos: [-4.5, 2.2, -5], target: [0, 0.8, 0] }, // maintenance (rear)
  { pos: [3.2, 1.2, 3.4], target: [0, 0.6, 0] }, // fuel (close)
  { pos: [0.5, 6.5, 3.5], target: [0, 0.2, 0] }, // analytics (top down)
  { pos: [3.6, 2.6, 2.4], target: [0.2, 1.1, 0] }, // compliance (cabin)
];

function Truck() {
  const { scene } = useGLTF("/models/hero-truck.glb");

  useLayoutEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 4 / maxDim;
    scene.scale.setScalar(scale);
    scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    scene.traverse((o: any) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
  }, [scene]);

  return <primitive object={scene} />;
}

function Rig({ station }: { station: number }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0.8, 0));
  const desired = useRef(new THREE.Vector3());

  useFrame(() => {
    const s = STATIONS[station] ?? STATIONS[0];
    desired.current.set(...s.pos);
    camera.position.lerp(desired.current, 0.045);
    target.current.lerp(new THREE.Vector3(...s.target), 0.045);
    camera.lookAt(target.current);
  });
  return null;
}

export default function HeroCanvas({ station }: { station: number }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [4.5, 2.2, 5.5], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 9, 6]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-6, 4, -6]} intensity={0.6} color="#875A7B" />
      <spotLight position={[0, 8, 0]} intensity={0.4} angle={0.6} penumbra={1} />
      <Truck />
      <ContactShadows position={[0, 0.001, 0]} opacity={0.45} scale={22} blur={2.6} far={8} />
      <Rig station={station} />
    </Canvas>
  );
}

useGLTF.preload("/models/hero-truck.glb");
