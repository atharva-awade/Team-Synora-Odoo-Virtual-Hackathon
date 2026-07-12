"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, ContactShadows } from "@react-three/drei";
import { useLayoutEffect } from "react";
import * as THREE from "three";

function FleetModel() {
  const { scene } = useGLTF("/models/fleet.glb");
  useLayoutEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 8 / maxDim;
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

export default function FleetShowcase() {
  return (
    <Canvas shadows dpr={[1, 1.8]} camera={{ position: [9, 5.5, 10], fov: 40 }} gl={{ alpha: true, antialias: true }} style={{ background: "transparent" }}>
      <ambientLight intensity={0.65} />
      <directionalLight position={[8, 13, 7]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-7, 5, -6]} intensity={0.5} color="#e8793a" />
      <FleetModel />
      <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={34} blur={2.5} far={14} />
      <OrbitControls
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.55}
        enableZoom
        minDistance={6}
        maxDistance={22}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.05}
      />
    </Canvas>
  );
}

useGLTF.preload("/models/fleet.glb");
