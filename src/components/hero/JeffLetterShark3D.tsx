"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import {
  BRICOLAGE_FONT_URL,
  JEANNE_HOME,
  JEFF_LETTER_POSE,
} from "@/lib/jeffLetterPose";

export type SharkDrive = {
  morph: number;
  pointer: { x: number; y: number; active: boolean };
  swim: number;
};

type Props = {
  drive: React.MutableRefObject<SharkDrive>;
  active: boolean;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Bricolage SDF face + stacked z-slices for extruded 3D depth (no Helvetiker blob). */
function DepthLetter({ char }: { char: string }) {
  const slices = [0.16, 0.1, 0.04, -0.02, -0.08];
  return (
    <group>
      {slices.map((z, i) => {
        const front = i === 0;
        return (
          <Text
            key={z}
            font={BRICOLAGE_FONT_URL}
            fontSize={0.55}
            anchorX="center"
            anchorY="middle"
            position={[0, 0, z]}
            letterSpacing={-0.06}
            characters="Jeanne"
            fontWeight={800}
          >
            {char}
            <meshBasicMaterial
              color={front ? "#ece7df" : "#9a948c"}
              toneMapped={false}
              transparent={!front}
              opacity={front ? 1 : 0.55}
            />
          </Text>
        );
      })}
    </group>
  );
}

function SharkFlockLive({ drive }: { drive: React.MutableRefObject<SharkDrive> }) {
  const root = useRef<THREE.Group>(null);
  const letterRefs = useRef<(THREE.Group | null)[]>([]);
  const flock = useRef({ x: 0, y: 0, rot: 0, bounce: 0 });

  useFrame((_, dt) => {
    const d = drive.current;
    const t = d.morph;
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    for (let i = 0; i < 6; i++) {
      const home = JEANNE_HOME[i]!;
      const shark = JEFF_LETTER_POSE[i]!;
      const el = letterRefs.current[i];
      if (!el) continue;
      el.position.set(
        lerp(home.x, shark.x, eased),
        lerp(home.y, shark.y, eased),
        lerp(home.z, shark.z, eased),
      );
      el.rotation.set(
        0,
        (lerp(home.rotY, shark.rotY, eased) * Math.PI) / 180,
        (lerp(home.rot, shark.rot, eased) * Math.PI) / 180,
      );
      el.scale.setScalar(lerp(home.scale, shark.scale, eased));
    }

    const g = root.current;
    if (!g) return;
    g.visible = t > 0.05;

    if (d.swim > 0.05 && d.pointer.active) {
      const tx = THREE.MathUtils.clamp(d.pointer.x, -2.6, 2.6);
      const ty = THREE.MathUtils.clamp(d.pointer.y, -1.4, 1.4);
      flock.current.x += (tx - flock.current.x) * Math.min(1, 4 * dt);
      flock.current.y += (ty - flock.current.y) * Math.min(1, 4 * dt);
      const dx = tx - flock.current.x;
      const dy = ty - flock.current.y;
      flock.current.rot += (Math.atan2(dy, dx) * 0.18 - flock.current.rot) * 0.1;
      const speed = Math.hypot(dx, dy);
      const bounceTarget =
        Math.sin(performance.now() * 0.014) * Math.min(0.12, speed * 0.04);
      flock.current.bounce += (bounceTarget - flock.current.bounce) * 0.2;
    } else {
      flock.current.x += (0 - flock.current.x) * 0.08;
      flock.current.y += (0 - flock.current.y) * 0.08;
      flock.current.rot *= 0.9;
      flock.current.bounce *= 0.85;
    }

    const swim = d.swim;
    g.position.set(
      flock.current.x * swim,
      flock.current.y * swim + flock.current.bounce * swim,
      0,
    );
    g.rotation.z = flock.current.rot * swim;
  });

  return (
    <group ref={root} visible={false}>
      {JEANNE_HOME.map((home, i) => (
        <group
          key={`${home.char}-${i}`}
          ref={(el) => {
            letterRefs.current[i] = el;
          }}
          position={[home.x, home.y, home.z]}
        >
          <DepthLetter char={home.char} />
        </group>
      ))}
    </group>
  );
}

export function JeffLetterShark3D({ drive, active }: Props) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.15, 7.4], fov: 36 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        background: "transparent",
      }}
      frameloop={active ? "always" : "never"}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 4, 5]} intensity={0.9} />
      <Suspense fallback={null}>
        <SharkFlockLive drive={drive} />
      </Suspense>
    </Canvas>
  );
}
