"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/* Every model sits on y = 0 with its footprint centered on the origin. */

const FLAT = -Math.PI / 2;

function Decal({ map, w, d, y, basic = false }: { map: THREE.Texture; w: number; d: number; y: number; basic?: boolean }) {
  return (
    <mesh position={[0, y, 0]} rotation={[FLAT, 0, 0]} receiveShadow>
      <planeGeometry args={[w, d]} />
      {basic ? (
        <meshBasicMaterial map={map} toneMapped={false} />
      ) : (
        <meshStandardMaterial map={map} roughness={0.85} />
      )}
    </mesh>
  );
}

export function CuttingMat({ w, d, map, edge }: { w: number; d: number; map: THREE.Texture; edge: string }) {
  const h = 0.06;
  return (
    <group>
      <RoundedBox args={[w, h, d]} radius={0.03} smoothness={3} position={[0, h / 2, 0]}>
        <meshStandardMaterial color={edge} roughness={0.9} />
      </RoundedBox>
      <Decal map={map} w={w - 0.04} d={d - 0.04} y={h + 0.001} />
    </group>
  );
}

export function Polaroid({ map }: { map: THREE.Texture }) {
  return (
    <group>
      <mesh position={[0, 0.0125, 0]}>
        <boxGeometry args={[1.5, 0.025, 1.82]} />
        <meshStandardMaterial color="#f3efe7" roughness={0.7} />
      </mesh>
      <Decal map={map} w={1.5} d={1.82} y={0.026} />
    </group>
  );
}

export function Card({ map }: { map: THREE.Texture }) {
  return (
    <group>
      <mesh position={[0, 0.008, 0]}>
        <boxGeometry args={[1.75, 0.016, 1]} />
        <meshStandardMaterial color="#efe8dc" roughness={0.8} />
      </mesh>
      <Decal map={map} w={1.75} d={1} y={0.017} />
    </group>
  );
}

export function StickyNote({ map }: { map: THREE.Texture }) {
  return (
    <group>
      <mesh position={[0, 0.006, 0]}>
        <boxGeometry args={[1.2, 0.012, 1.2]} />
        <meshStandardMaterial color="#f2d468" roughness={0.9} />
      </mesh>
      <Decal map={map} w={1.2} d={1.2} y={0.013} />
    </group>
  );
}

export function Ruler({ map }: { map: THREE.Texture }) {
  return (
    <group>
      <mesh position={[0, 0.012, 0]}>
        <boxGeometry args={[3.4, 0.024, 0.34]} />
        <meshStandardMaterial color="#c9cbcf" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.0245, 0]} rotation={[FLAT, 0, 0]}>
        <planeGeometry args={[3.4, 0.34]} />
        <meshStandardMaterial map={map} metalness={0.75} roughness={0.32} />
      </mesh>
    </group>
  );
}

/* Cork coaster with a raised lip, Oryzo-style */
export function Coaster({ map }: { map: THREE.Texture }) {
  const geometry = useMemo(() => {
    const profile = [
      [0, 0],
      [0.74, 0],
      [0.78, 0.04],
      [0.78, 0.13],
      [0.74, 0.15],
      [0.68, 0.14],
      [0.64, 0.06],
      [0.6, 0.045],
      [0, 0.045],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(profile, 96);
  }, []);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial map={map} roughness={1} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function Pen() {
  const r = 0.07;
  return (
    <group position={[0, r, 0]} rotation={[0, 0, Math.PI / 2]}>
      {/* barrel */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[r, r, 1.6, 32]} />
        <meshStandardMaterial color="#141414" roughness={0.35} metalness={0.2} />
      </mesh>
      {/* cap */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[r + 0.006, r + 0.006, 0.62, 32]} />
        <meshStandardMaterial color="#141414" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[r + 0.012, r + 0.012, 0.05, 32]} />
        <meshStandardMaterial color="#c9a45c" metalness={1} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.13, 0]}>
        <sphereGeometry args={[r + 0.006, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#c9a45c" metalness={1} roughness={0.25} />
      </mesh>
      {/* clip */}
      <mesh position={[r + 0.03, 0.82, 0]}>
        <boxGeometry args={[0.025, 0.56, 0.04]} />
        <meshStandardMaterial color="#c9a45c" metalness={1} roughness={0.25} />
      </mesh>
      {/* section + nib */}
      <mesh position={[0, -1.0, 0]}>
        <cylinderGeometry args={[r, r * 0.55, 0.2, 32]} />
        <meshStandardMaterial color="#c9a45c" metalness={1} roughness={0.25} />
      </mesh>
      <mesh position={[0, -1.17, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[r * 0.5, 0.14, 24]} />
        <meshStandardMaterial color="#d7d7d7" metalness={1} roughness={0.2} />
      </mesh>
    </group>
  );
}

export function Tablet({ map }: { map: THREE.Texture }) {
  const h = 0.09;
  return (
    <group>
      <RoundedBox args={[3.0, h, 2.2]} radius={0.04} smoothness={4} position={[0, h / 2, 0]}>
        <meshStandardMaterial color="#b9bbbf" metalness={0.85} roughness={0.32} />
      </RoundedBox>
      <mesh position={[0, h + 0.001, 0]} rotation={[FLAT, 0, 0]}>
        <planeGeometry args={[2.92, 2.12]} />
        <meshStandardMaterial color="#0a0a0b" roughness={0.15} metalness={0.4} />
      </mesh>
      <Decal map={map} w={2.76} d={1.94} y={h + 0.002} basic />
    </group>
  );
}

export function NothingPhone({ map, glow = 0 }: { map: THREE.Texture; glow?: number }) {
  const h = 0.09;
  return (
    <group>
      <RoundedBox args={[0.96, h, 1.98]} radius={0.04} smoothness={4} position={[0, h / 2, 0]}>
        <meshStandardMaterial color="#3a3b3e" metalness={0.85} roughness={0.32} />
      </RoundedBox>
      <mesh position={[0, h + 0.001, 0]} rotation={[FLAT, 0, 0]}>
        <planeGeometry args={[0.92, 1.94]} />
        <meshPhysicalMaterial
          map={map}
          emissiveMap={map}
          emissive="#ffffff"
          emissiveIntensity={glow}
          roughness={0.12}
          clearcoat={1}
          clearcoatRoughness={0.05}
          transparent
        />
      </mesh>
      {[-0.72, -0.56].map((z) => (
        <group key={z} position={[-0.17, h, z]}>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.065, 0.065, 0.04, 32]} />
            <meshStandardMaterial color="#c9c9c6" metalness={1} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.041, 0]} rotation={[FLAT, 0, 0]}>
            <circleGeometry args={[0.048, 32]} />
            <meshPhysicalMaterial color="#0b0f14" metalness={0.6} roughness={0.05} clearcoat={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function ApplePencil() {
  const r = 0.045;
  return (
    <group position={[0, r, 0]} rotation={[0, 0, Math.PI / 2]}>
      <mesh>
        <cylinderGeometry args={[r, r, 1.66, 32]} />
        <meshPhysicalMaterial color="#f4f3f0" roughness={0.45} clearcoat={0.3} />
      </mesh>
      <mesh position={[0, 0.83, 0]}>
        <sphereGeometry args={[r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#f4f3f0" roughness={0.45} clearcoat={0.3} />
      </mesh>
      <mesh position={[0, -0.92, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[r, 0.18, 32]} />
        <meshPhysicalMaterial color="#f4f3f0" roughness={0.45} />
      </mesh>
      <mesh position={[0, -1.02, 0]}>
        <sphereGeometry args={[0.012, 12, 8]} />
        <meshStandardMaterial color="#9a9a96" />
      </mesh>
    </group>
  );
}

export function UtilityKnife() {
  return (
    <group>
      <RoundedBox args={[1.9, 0.14, 0.42]} radius={0.06} smoothness={4} position={[0.1, 0.07, 0]}>
        <meshStandardMaterial color="#ee7a22" roughness={0.45} />
      </RoundedBox>
      {/* rubber grip */}
      <RoundedBox args={[0.8, 0.03, 0.28]} radius={0.012} smoothness={2} position={[0.42, 0.145, 0]}>
        <meshStandardMaterial color="#3a3836" roughness={0.95} />
      </RoundedBox>
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={i} position={[0.12 + i * 0.1, 0.163, 0]} rotation={[0, 0.5, 0]}>
          <boxGeometry args={[0.02, 0.01, 0.22]} />
          <meshStandardMaterial color="#2a2826" roughness={1} />
        </mesh>
      ))}
      {/* slider */}
      <RoundedBox args={[0.22, 0.06, 0.16]} radius={0.02} smoothness={2} position={[-0.38, 0.16, 0]}>
        <meshStandardMaterial color="#dcdcda" metalness={0.6} roughness={0.35} />
      </RoundedBox>
      {/* steel channel + blade */}
      <mesh position={[-0.9, 0.07, 0]}>
        <boxGeometry args={[0.2, 0.1, 0.36]} />
        <meshStandardMaterial color="#c7c8ca" metalness={1} roughness={0.3} />
      </mesh>
      <mesh position={[-1.12, 0.07, 0.02]} rotation={[0, 0.35, 0]}>
        <boxGeometry args={[0.32, 0.012, 0.2]} />
        <meshStandardMaterial color="#e4e5e7" metalness={1} roughness={0.15} />
      </mesh>
    </group>
  );
}

function clipCurve() {
  const pts: THREE.Vector3[] = [];
  const line = (x0: number, x1: number, z: number) => {
    for (let i = 0; i <= 6; i++) pts.push(new THREE.Vector3(x0 + ((x1 - x0) * i) / 6, 0, z));
  };
  const arc = (cx: number, cz: number, r: number, a0: number, a1: number) => {
    for (let i = 1; i < 10; i++) {
      const a = a0 + ((a1 - a0) * i) / 10;
      pts.push(new THREE.Vector3(cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r));
    }
  };
  line(0.16, -0.32, 0.05);
  arc(-0.32, -0.005, 0.055, Math.PI / 2, (Math.PI * 3) / 2);
  line(-0.32, 0.36, -0.06);
  arc(0.36, 0.015, 0.075, -Math.PI / 2, Math.PI / 2);
  line(0.36, -0.22, 0.09);
  arc(-0.22, 0.055, 0.035, Math.PI / 2, (Math.PI * 3) / 2);
  line(-0.22, 0.24, 0.02);
  return new THREE.CatmullRomCurve3(pts);
}

export function PaperClip({ color = "#c9cacc" }: { color?: string }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(clipCurve(), 220, 0.011, 8, false), []);
  return (
    <mesh geometry={geometry} position={[0, 0.011, -0.015]}>
      <meshStandardMaterial color={color} metalness={1} roughness={0.25} />
    </mesh>
  );
}

export function Mouse() {
  return (
    <group>
      <mesh scale={[0.62, 0.62, 1]}>
        <sphereGeometry args={[0.5, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#f1efea" roughness={0.38} clearcoat={0.6} clearcoatRoughness={0.3} />
      </mesh>
      {/* button seam */}
      <mesh position={[0, 0.21, -0.25]} rotation={[0.55, 0, 0]}>
        <boxGeometry args={[0.008, 0.01, 0.42]} />
        <meshStandardMaterial color="#b9b5ad" />
      </mesh>
      {/* scroll wheel */}
      <mesh position={[0, 0.27, -0.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.04, 20]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
      </mesh>
    </group>
  );
}

/*
 * Instax Mini, standing up with the lens toward the room. When `ejecting`
 * flips on, the flash fires and a print feeds out of the top slot.
 */
export function InstaxCamera({ ejecting, reduced }: { ejecting: boolean; reduced: boolean }) {
  const w = 1.5;
  const h = 1.75;
  const d = 0.9;
  const print = useRef<THREE.Group>(null);
  const flash = useRef<THREE.MeshStandardMaterial>(null);
  const flashT = useRef(0);

  useEffect(() => {
    if (ejecting) flashT.current = 1;
  }, [ejecting]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    if (print.current) {
      const goal = ejecting ? h + 0.32 : h - 0.7;
      /* the motor feeds the print out steadily; retracting is instant-ish */
      const y = print.current.position.y;
      print.current.position.y = reduced ? goal : ejecting ? Math.min(goal, y + dt * 1.4) : THREE.MathUtils.damp(y, goal, 10, dt);
    }
    if (flash.current) {
      flashT.current = Math.max(0, flashT.current - dt * 3.5);
      flash.current.emissiveIntensity = 0.15 + flashT.current * 6;
    }
  });

  return (
    <group position={[0, 0, -0.08]}>
      <RoundedBox args={[w, h, d]} radius={0.2} smoothness={5} position={[0, h / 2, 0]}>
        <meshStandardMaterial color="#efc0c8" roughness={0.55} />
      </RoundedBox>
      {/* print slot */}
      <mesh position={[0, h + 0.001, -0.12]}>
        <boxGeometry args={[0.92, 0.004, 0.07]} />
        <meshStandardMaterial color="#2b2224" roughness={0.8} />
      </mesh>
      <group ref={print} position={[0, h - 0.7, -0.12]}>
        <mesh>
          <boxGeometry args={[0.78, 1.24, 0.016]} />
          <meshStandardMaterial color="#f6f2ea" roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.08, 0.009]}>
          <planeGeometry args={[0.66, 0.9]} />
          <meshStandardMaterial color="#3d3633" roughness={0.4} />
        </mesh>
      </group>
      {/* lens: pale outer ring, dark barrel, glass */}
      <group position={[0, 0.78, d / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.5, 0.52, 0.12, 64]} />
          <meshStandardMaterial color="#f7e4e7" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.36, 0.38, 0.14, 48]} />
          <meshStandardMaterial color="#2a2426" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.245, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.012, 48]} />
          <meshPhysicalMaterial color="#0d1620" metalness={0.7} roughness={0.04} clearcoat={1} />
        </mesh>
      </group>
      {/* flash */}
      <mesh position={[0.4, 1.47, d / 2 + 0.002]}>
        <planeGeometry args={[0.46, 0.22]} />
        <meshStandardMaterial ref={flash} color="#f4f4f2" emissive="#fff6e8" emissiveIntensity={0.15} roughness={0.2} />
      </mesh>
      {/* viewfinder */}
      <mesh position={[-0.46, 1.47, d / 2 + 0.002]}>
        <planeGeometry args={[0.2, 0.16]} />
        <meshPhysicalMaterial color="#141a20" roughness={0.05} clearcoat={1} />
      </mesh>
      {/* shutter button */}
      <mesh position={[0.56, 1.02, d / 2 + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.05, 32]} />
        <meshStandardMaterial color="#d99aa6" roughness={0.5} />
      </mesh>
    </group>
  );
}

export function Camera() {
  const bodyH = 0.78;
  const plateH = 0.2;
  const depth = 0.6;
  return (
    <group position={[0, 0, -0.2]}>
      {/* leatherette body */}
      <RoundedBox args={[1.7, bodyH, depth]} radius={0.08} smoothness={4} position={[0, bodyH / 2, 0]}>
        <meshStandardMaterial color="#1b1a19" roughness={0.9} />
      </RoundedBox>
      {/* silver top plate */}
      <RoundedBox args={[1.7, plateH, depth]} radius={0.06} smoothness={4} position={[0, bodyH + plateH / 2 - 0.04, 0]}>
        <meshStandardMaterial color="#d3d3d0" metalness={0.9} roughness={0.28} />
      </RoundedBox>
      {/* viewfinder window */}
      <mesh position={[-0.55, bodyH + 0.06, depth / 2 + 0.001]}>
        <planeGeometry args={[0.3, 0.12]} />
        <meshPhysicalMaterial color="#20262c" metalness={0.6} roughness={0.05} />
      </mesh>
      {/* shutter-speed dial, shutter button, hot shoe, rewind knob */}
      <mesh position={[0.42, bodyH + plateH + 0.01, 0.02]}>
        <cylinderGeometry args={[0.17, 0.17, 0.09, 40]} />
        <meshStandardMaterial color="#b9b9b6" metalness={1} roughness={0.38} />
      </mesh>
      <mesh position={[0.42, bodyH + plateH + 0.06, 0.02]}>
        <cylinderGeometry args={[0.13, 0.13, 0.012, 40]} />
        <meshStandardMaterial color="#1b1a19" roughness={0.6} />
      </mesh>
      <mesh position={[0.7, bodyH + plateH + 0.01, 0.12]}>
        <cylinderGeometry args={[0.045, 0.045, 0.06, 20]} />
        <meshStandardMaterial color="#d6d6d3" metalness={1} roughness={0.2} />
      </mesh>
      <mesh position={[0, bodyH + plateH - 0.02, 0]}>
        <boxGeometry args={[0.36, 0.05, 0.3]} />
        <meshStandardMaterial color="#9a9a97" metalness={1} roughness={0.35} />
      </mesh>
      <mesh position={[-0.55, bodyH + plateH, -0.02]}>
        <cylinderGeometry args={[0.12, 0.12, 0.07, 32]} />
        <meshStandardMaterial color="#b9b9b6" metalness={1} roughness={0.38} />
      </mesh>
      {/* red dot */}
      <mesh position={[0.5, bodyH - 0.12, depth / 2 + 0.001]}>
        <circleGeometry args={[0.055, 24]} />
        <meshStandardMaterial color="#d8322a" roughness={0.4} />
      </mesh>
      {/* lens barrel */}
      <group position={[-0.05, 0.42, depth / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.36, 0.36, 0.44, 48]} />
          <meshStandardMaterial color="#141414" roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.08, 48]} />
          <meshStandardMaterial color="#c4c4c1" metalness={1} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.445, 0]}>
          <cylinderGeometry args={[0.27, 0.27, 0.02, 48]} />
          <meshPhysicalMaterial color="#0e1b2a" metalness={0.8} roughness={0.04} clearcoat={1} />
        </mesh>
      </group>
    </group>
  );
}
