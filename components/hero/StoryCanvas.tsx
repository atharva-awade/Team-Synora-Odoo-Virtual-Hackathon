"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, ContactShadows } from "@react-three/drei";
import { useLayoutEffect } from "react";
import * as THREE from "three";
import { useStory } from "@/lib/story-store";

// The camera always looks at the truck center, so the truck stays dead-center
// on screen at every scroll position. Only the camera POSITION orbits.
const TARGET: [number, number, number] = [0, 1.4, 0];
const KEYS: [number, number, number][] = [
  [0, 3.0, 8.0], // 0 reveal (pulls in)
  [4.2, 2.0, 3.0], // 1 dispatch (front 3/4)
  [5.0, 1.8, -1.2], // 2 tracking (right side)
  [-4.2, 2.0, -3.0], // 3 maintenance (rear-left)
  [2.6, 1.2, 3.8], // 4 fuel (front low)
  [0.2, 5.5, 3.0], // 5 analytics (top down, still centered)
  [3.4, 2.2, 2.4], // 6 compliance (cabin)
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
    const scale = 5.6 / maxDim;
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
    camera.position.lerp(desired, 0.06);
    camera.lookAt(look);
  });
  return null;
}

export default function StoryCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [0, 3, 8], fov: 40 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 10, 6]} intensity={1.8} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-6, 4, -6]} intensity={0.6} color="#e8793a" />
      <spotLight position={[0, 9, 0]} intensity={0.5} angle={0.6} penumbra={1} />
      <Truck />
      <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={26} blur={2.6} far={9} />
      <Rig />
    </Canvas>
  );
}

useGLTF.preload("/models/hero-truck.glb");
