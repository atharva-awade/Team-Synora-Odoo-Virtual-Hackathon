"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, ContactShadows } from "@react-three/drei";
import { useLayoutEffect } from "react";
import * as THREE from "three";
import { useStory } from "@/lib/story-store";

// Camera keyframes: index 0 is the far "zoom-parallax" reveal, 1..6 are the
// modality stations the camera glides between as the user scrolls.
const KEYS: { p: [number, number, number]; t: [number, number, number] }[] = [
  { p: [0, 3.4, 15], t: [0, 1.0, 0] }, // 0 reveal (far)
  { p: [5.2, 2.4, 6], t: [0, 0.9, 0] }, // 1 dispatch
  { p: [8.6, 2.0, 0.4], t: [0, 0.9, 0] }, // 2 tracking
  { p: [-5.6, 2.5, -5.5], t: [0, 0.8, 0] }, // 3 maintenance
  { p: [3.2, 1.2, 3.9], t: [0, 0.6, 0] }, // 4 fuel
  { p: [0.4, 7.6, 4.2], t: [0, 0.1, 0] }, // 5 analytics
  { p: [4.1, 2.8, 2.6], t: [0.2, 1.15, 0] }, // 6 compliance
];

function lerp3(a: number[], b: number[], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function sample(progress: number) {
  const n = KEYS.length - 1;
  const x = Math.max(0, Math.min(1, progress)) * n;
  const i = Math.min(n - 1, Math.floor(x));
  const t = x - i;
  return { pos: lerp3(KEYS[i].p, KEYS[i + 1].p, t), tgt: lerp3(KEYS[i].t, KEYS[i + 1].t, t) };
}

function Truck() {
  const { scene } = useGLTF("/models/hero-truck.glb");
  useLayoutEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 4.6 / maxDim;
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
  const tgt = { current: new THREE.Vector3(0, 1, 0) };
  const desired = new THREE.Vector3();
  const look = new THREE.Vector3();
  useFrame(() => {
    const { pos, tgt: tg } = sample(useStory.getState().progress);
    desired.set(pos[0], pos[1], pos[2]);
    camera.position.lerp(desired, 0.06);
    look.set(tg[0], tg[1], tg[2]);
    tgt.current.lerp(look, 0.06);
    camera.lookAt(tgt.current);
  });
  return null;
}

export default function StoryCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [0, 3.4, 15], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 10, 6]} intensity={1.7} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-6, 4, -6]} intensity={0.6} color="#e8793a" />
      <spotLight position={[0, 9, 0]} intensity={0.5} angle={0.6} penumbra={1} />
      <Truck />
      <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={26} blur={2.6} far={9} />
      <Rig />
    </Canvas>
  );
}

useGLTF.preload("/models/hero-truck.glb");
