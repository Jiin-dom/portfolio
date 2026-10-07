"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "motion/react";

function StudioRibbon({ reduced }: { reduced: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!mesh.current || reduced) return;
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.x = 0.4 + Math.sin(t * 0.35) * 0.15;
    mesh.current.rotation.y = t * 0.18;
  });

  return (
    <Float speed={reduced ? 0 : 1.4} floatIntensity={reduced ? 0 : 0.8} rotationIntensity={reduced ? 0 : 0.35}>
      <mesh ref={mesh} scale={1.35}>
        <torusKnotGeometry args={[0.85, 0.28, 160, 24]} />
        <meshStandardMaterial
          color="#3d5c45"
          metalness={0.45}
          roughness={0.32}
          emissive="#e85d2c"
          emissiveIntensity={0.12}
        />
      </mesh>
    </Float>
  );
}

export function RibbonScene() {
  const reduce = useReducedMotion();
  const reduced = !!reduce;

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 4.2], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-3, -1, 2]} intensity={0.45} color="#e85d2c" />
        <Suspense fallback={null}>
          <StudioRibbon reduced={reduced} />
        </Suspense>
      </Canvas>
    </div>
  );
}
