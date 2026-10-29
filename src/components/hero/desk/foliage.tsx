"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/*
 * Dappled light: a tree's small leaves outside the window, between the sun and the
 * desk. They never draw (no colour, no depth); they only cast the sun's soft
 * shadow, and sway a little so the shade moves across the desk like a breeze.
 */

/* the sun sits at (-9, 20, 12) aiming at the origin: a desk point (x, z) is shaded from height h at this offset */
const SUN = new THREE.Vector3(-9, 20, 12).normalize();
const overDesk = (x: number, z: number, h: number) => [x + (SUN.x / SUN.y) * h, h, z + (SUN.z / SUN.y) * h] as const;

/* a small seeded random, so every visit draws the same tree */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function branchTexture(seed: number) {
  const size = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const rand = rng(seed);
  /* alpha maps read brightness: white is leaf, black lets the sun through */
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  ctx.lineCap = "round";

  const leaf = (x: number, y: number, a: number, l: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(l * 0.5, -l * 0.32, l, 0);
    ctx.quadraticCurveTo(l * 0.5, l * 0.32, 0, 0);
    ctx.fill();
    ctx.restore();
  };

  /* a twig wanders out, shedding small leaves on both sides and splitting into finer twigs */
  const twig = (x: number, y: number, a: number, len: number, w: number, depth: number) => {
    const steps = 12;
    let px = x;
    let py = y;
    let ang = a;
    for (let i = 0; i < steps; i++) {
      ang += (rand() - 0.5) * 0.35;
      const nx = px + Math.cos(ang) * (len / steps);
      const ny = py + Math.sin(ang) * (len / steps);
      ctx.lineWidth = w * (1 - i / steps) + 0.6;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      for (const side of [-1, 1]) {
        for (let k = 0; k < 2; k++) {
          if (rand() < 0.7) leaf(nx + (rand() - 0.5) * 10, ny + (rand() - 0.5) * 10, ang + side * (0.4 + rand() * 0.9), 13 + rand() * 13);
        }
      }
      if (depth > 0 && i > 1 && rand() < 0.42) twig(nx, ny, ang + (rand() < 0.5 ? -1 : 1) * (0.4 + rand() * 0.6), len * (0.35 + rand() * 0.25), w * 0.55, depth - 1);
      px = nx;
      py = ny;
    }
    leaf(px, py, ang, 18);
  };

  /*
   * A canopy, not a branch: many twigs reach in from one edge, so the shade is
   * thick there and breaks into sunflecks further in, like light through a tree.
   */
  for (let i = 0; i < 9; i++) {
    twig(-20, size * (0.04 + i * 0.11 + rand() * 0.05), -0.35 + rand() * 0.7, size * (0.45 + rand() * 0.5), 7, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

/* where each bough sits: desk point it shades, height, size, turn, sway phase */
const BOUGHS = [
  { at: [8, -5], h: 8.5, size: 13, rot: 2.9, phase: 0 },
  { at: [11, 1], h: 9, size: 12, rot: 3.4, phase: 1.1 },
  { at: [-10, -3], h: 8, size: 12, rot: 0.1, phase: 2.3 },
  { at: [-4, -7], h: 9.5, size: 11, rot: -1.5, phase: 3.4 },
] as const;

export function Foliage({ reduced }: { reduced: boolean }) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const parts = useMemo(
    () =>
      BOUGHS.map((b, i) => {
        return { ...b, pos: overDesk(b.at[0], b.at[1], b.h), alpha: branchTexture(7 + i * 131) };
      }),
    [],
  );

  useFrame(({ clock }) => {
    if (reduced) return;
    /* a lively breeze: raise or lower to speed up or calm the shade */
    const t = clock.elapsedTime * 2.2;
    parts.forEach((p, i) => {
      const g = groups.current[i];
      if (!g) return;
      /* a slow lean with a quicker flutter on top, never quite repeating */
      const gust = Math.sin(t * 0.35 + p.phase) * 0.5 + 0.5;
      g.rotation.y = p.rot + Math.sin(t * 0.6 + p.phase) * 0.035 + Math.sin(t * 1.9 + p.phase * 2) * 0.018 * gust;
      g.position.x = p.pos[0] + Math.sin(t * 0.45 + p.phase) * 0.18;
      g.position.z = p.pos[2] + Math.sin(t * 0.7 + p.phase * 1.3) * 0.12 * (0.4 + gust);
    });
  });

  return (
    <>
      {parts.map((p, i) => (
        <group key={i} ref={(g) => void (groups.current[i] = g)} position={p.pos as unknown as THREE.Vector3Tuple} rotation-y={p.rot}>
          <mesh rotation-x={-Math.PI / 2} castShadow>
            <planeGeometry args={[p.size, p.size]} />
            {/* the shadow pass takes its cut-out and sides from this material, so they live here */}
            <meshBasicMaterial colorWrite={false} depthWrite={false} alphaMap={p.alpha} alphaTest={0.5} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </>
  );
}
