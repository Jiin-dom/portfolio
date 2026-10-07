"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type LetterfieldProps = {
  years: string;
  label: string;
};

function EmberField() {
  const group = useRef<THREE.Group>(null);
  const planes = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      pos: [(i - 2) * 1.15, ((i % 2) - 0.5) * 0.55, -0.4 - i * 0.08] as [
        number,
        number,
        number,
      ],
      rot: [0.25 + i * 0.05, 0.15 - i * 0.04, i * 0.12] as [number, number, number],
      size: [1.8 + (i % 3) * 0.35, 0.55 + (i % 2) * 0.2] as [number, number],
      opacity: 0.08 + i * 0.02,
    }));
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!group.current) return;
    group.current.rotation.y = Math.sin(t * 0.28) * 0.2;
    group.current.rotation.x = Math.cos(t * 0.18) * 0.08;
    group.current.position.y = Math.sin(t * 0.65) * 0.05;
  });

  return (
    <group ref={group}>
      {planes.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={p.rot}>
          <planeGeometry args={p.size} />
          <meshBasicMaterial
            color={i % 2 === 0 ? "#e85d04" : "#ece7df"}
            transparent
            opacity={p.opacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
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
  const [visible, setVisible] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "20% 0px", threshold: 0.02 },
    );
    io.observe(el);
    const onVis = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const animate = visible && !tabHidden;

  return (
    <div
      ref={hostRef}
      className="relative h-[min(42vw,22rem)] w-full overflow-hidden border border-[var(--line)] bg-panel"
    >
      {allowWebGL ? (
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 5.5], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          frameloop={animate ? "always" : "never"}
        >
          <color attach="background" args={["#14171e"]} />
          <ambientLight intensity={0.85} />
          <EmberField />
        </Canvas>
      ) : null}

      <div className="relative z-10 flex h-full min-h-[12rem] items-center justify-center px-6">
        <div className="text-center">
          <p
            className="display-type-sm m-0 text-bone"
            style={{ textShadow: "0 0 40px rgb(12 14 18 / 0.65)" }}
          >
            {years}
          </p>
          <p className="meta-type mt-3 m-0 text-bone-soft">{label}</p>
        </div>
      </div>
    </div>
  );
}
