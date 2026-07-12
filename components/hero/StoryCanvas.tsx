"use client";

import { Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, ContactShadows } from "@react-three/drei";
import { useLayoutEffect } from "react";
import * as THREE from "three";
import { useStory } from "@/lib/story-store";
import { WebGLBoundary } from "./WebGLBoundary";

// The camera always looks at the truck center, so the truck stays dead-center
// on screen at every scroll position. Only the camera POSITION orbits.
const TARGET: [number, number, number] = [0, 1.5, 0];
const KEYS: [number, number, number][] = [
  [0, 2.4, 6.0], // 0 reveal (close, near-level so the truck fills screen 1)
  [4.4, 2.1, 3.0], // 1 dispatch (front 3/4)
  [5.2, 1.9, -1.4], // 2 tracking (right side)
  [-4.4, 2.1, -3.2], // 3 maintenance (rear-left)
  [2.8, 1.3, 4.0], // 4 fuel (front low)
  [0.2, 5.6, 3.2], // 5 analytics (top down, still centered)
  [3.6, 2.3, 2.5], // 6 compliance (cabin)
];

function lerp3(a: number[], b: number[], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
function sample(p: number): [number, number, number] {
  const n = KEYS.length - 1;
  const x = Math.max(0, Math.min(1, p)) * n;
  const i = Math.min(n - 1, Math.floor(x));
  return lerp3(KEYS[i], KEYS[i + 1], x - i);
}

function Truck() {
  const { scene } = useGLTF("/models/hero-truck.glb");
  useLayoutEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 6 / maxDim;
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

function Rig() {
  const { camera } = useThree();
  const desired = new THREE.Vector3();
  const look = new THREE.Vector3(...TARGET);
  useFrame(() => {
    const p = sample(useStory.getState().progress);
    desired.set(p[0], p[1], p[2]);
    camera.position.lerp(desired, 0.1);
    camera.lookAt(look);
  });
  return null;
}

export default function StoryCanvas() {
  return (
    <WebGLBoundary fallback={null}>
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 2.4, 6], fov: 40 }}
      gl={{ alpha: true, antialias: true, powerPreference: "default", failIfMajorPerformanceCaveat: false }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 10, 6]} intensity={1.8} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-6, 4, -6]} intensity={0.6} color="#875A7B" />
      <spotLight position={[0, 9, 0]} intensity={0.5} angle={0.6} penumbra={1} />
      <Suspense fallback={null}>
        <Truck />
      </Suspense>
      <ContactShadows position={[0, 0, 0]} opacity={0.28} scale={13} blur={3.4} far={6} color="#2b1e2e" />
      <Rig />
    </Canvas>
    </WebGLBoundary>
  );
}

useGLTF.preload("/models/hero-truck.glb");
