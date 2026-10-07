"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

type LetterfieldProps = {
  years: string;
  label: string;
};

function SpatialYears({ years, label }: LetterfieldProps) {
  const group = useRef<THREE.Group>(null);
  const ember = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.32) * 0.22;
      group.current.rotation.x = Math.cos(t * 0.2) * 0.1;
      group.current.position.y = Math.sin(t * 0.7) * 0.06;
    }
    if (ember.current) {
      ember.current.rotation.z = t * 0.15;
      ember.current.scale.setScalar(1 + Math.sin(t * 1.4) * 0.04);
    }
  });

  return (
    <group>
      <mesh ref={ember} position={[0, 0, -0.6]} rotation={[0.4, 0.2, 0]}>
        <planeGeometry args={[7.2, 2.4]} />
        <meshBasicMaterial color="#e85d04" transparent opacity={0.12} />
      </mesh>
      <group ref={group}>
        <Html
          transform
          center
          distanceFactor={6.5}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div className="text-center whitespace-nowrap">
            <p
              className="m-0 font-sans text-[clamp(2.5rem,8vw,5.5rem)] font-semibold leading-none tracking-[-0.045em] text-bone"
              style={{ fontVariationSettings: '"opsz" 96, "wdth" 88, "wght" 650' }}
            >
              {years}
            </p>
            <p className="meta-type mt-3 m-0 text-bone-soft">{label}</p>
          </div>
        </Html>
      </group>
    </group>
  );
}

function StaticFallback({ years, label }: LetterfieldProps) {
  return (
    <div
      className="flex h-full min-h-[12rem] items-center justify-center bg-panel px-6"
      aria-hidden="true"
    >
      <div className="text-center">
        <p className="display-type-sm m-0 text-bone">{years}</p>
        <p className="meta-type mt-3 m-0">{label}</p>
      </div>
    </div>
  );
}

function canUseWebGL(): boolean {
  if (typeof window === "undefined") return false;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData =
    "connection" in navigator &&
    Boolean(
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
        ?.saveData,
    );
  const lowMem =
    "deviceMemory" in navigator &&
    Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory) > 0 &&
    Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory) < 4;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return Boolean(gl) && !reduced && !saveData && !lowMem;
  } catch {
    return false;
  }
}

function subscribeNoop() {
  return () => {};
}

export function Letterfield({ years, label }: LetterfieldProps) {
  const allowWebGL = useSyncExternalStore(subscribeNoop, canUseWebGL, () => false);
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "10% 0px", threshold: 0.05 },
    );
    io.observe(el);
    const onVis = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  if (!allowWebGL) {
    return (
      <div
        ref={hostRef}
        className="relative h-[min(42vw,22rem)] w-full overflow-hidden border border-[var(--line)]"
      >
        <StaticFallback years={years} label={label} />
      </div>
    );
  }

  const run = visible && !tabHidden;

  return (
    <div
      ref={hostRef}
      className="relative h-[min(42vw,22rem)] w-full overflow-hidden border border-[var(--line)] bg-panel"
      aria-hidden="true"
    >
      {run ? (
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 6], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#14171e"]} />
          <ambientLight intensity={0.9} />
          <SpatialYears years={years} label={label} />
        </Canvas>
      ) : (
        <StaticFallback years={years} label={label} />
      )}
    </div>
  );
}
